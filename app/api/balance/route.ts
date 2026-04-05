export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { dailyConsumptionCache, descoAccounts } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';
import { fetchWithTimeout } from '@/lib/utils/fetchWithTimeout';
import https from 'https';

/**
 * Cache freshness threshold in milliseconds (1 hour)
 * Balance data older than this is considered stale
 */
const CACHE_FRESHNESS_THRESHOLD_MS = 60 * 60 * 1000;

/**
 * Timezone for DESCO (Bangladesh)
 */
const TZ = 'Asia/Dhaka';

/**
 * Get current date in Asia/Dhaka timezone
 */
function getDhakaDate(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
}

/**
 * Get date string in Asia/Dhaka timezone (YYYY-MM-DD format)
 */
function getDhakaDateString(date: Date = getDhakaDate()): string {
    return date.toISOString().split('T')[0]!;
}

/**
 * DESCO API configuration
 */
const DESCO_API_BASE_URL = 'https://prepaid.desco.org.bd/api/tkdes/customer';

// Agent to bypass SSL verification (DESCO API has certificate issues)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

interface BalanceApiResponse {
    code: number;
    data: { balance: number };
}

/**
 * GET /api/balance
 * Returns the most recent cached balance from the database.
 * If cache is missing or stale, fetches from DESCO API and caches it.
 *
 * Query params:
 *   - accountId: The DESCO account ID (required)
 *   - forceRefresh: Optional - if true, always fetch from DESCO API
 *
 * Response includes:
 *   - data: Balance information
 *   - isStale: true if cache is older than CACHE_FRESHNESS_THRESHOLD_MS
 *   - cachedAt: ISO timestamp of when the data was cached
 *   - fromCache: true if data was served from cache, false if fetched from API
 */
export async function GET(request: NextRequest) {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    if (!accountId) {
        return NextResponse.json(
            { message: 'Missing required parameter: accountId' },
            { status: 400 }
        );
    }

    const db = getDb();

    // Verify account belongs to user
    const account = await db
        .select()
        .from(descoAccounts)
        .where(and(
            eq(descoAccounts.id, accountId),
            eq(descoAccounts.userId, session.user.id)
        ))
        .limit(1);

    if (!account.length) {
        return NextResponse.json(
            { message: 'Account not found or unauthorized' },
            { status: 404 }
        );
    }

    const accountData = account[0]!;

    // Get the most recent cached balance (unless forceRefresh is true)
    let latestRecord: typeof dailyConsumptionCache.$inferSelect[] = [];
    let isStale = false;
    let fromCache = false;

    if (!forceRefresh) {
        latestRecord = await db
            .select()
            .from(dailyConsumptionCache)
            .where(eq(dailyConsumptionCache.descoAccountId, accountId))
            .orderBy(desc(dailyConsumptionCache.date))
            .limit(1);

        if (latestRecord.length && latestRecord[0]!.balance) {
            const row = latestRecord[0]!;
            const cachedAtTime = new Date(row.createdAt).getTime();
            const nowMs = Date.now();
            isStale = nowMs - cachedAtTime > CACHE_FRESHNESS_THRESHOLD_MS;
            fromCache = !isStale;
        }
    }

    // Fetch from DESCO API if no cache, cache is stale, or forceRefresh is true
    let balance: number | null = null;
    let readingTime: string = new Date().toISOString().split('T')[0]!;
    let cachedAt: string = new Date().toISOString();

    if (!latestRecord.length || !latestRecord[0]!.balance || isStale || forceRefresh) {
        try {
            const balanceRes = await fetchWithTimeout(
                `${DESCO_API_BASE_URL}/getBalance?accountNo=${accountData.accountNo}&meterNo=${accountData.meterNo}`,
                {
                    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
                    // @ts-expect-error - Agent is not in standard fetch types but works with Node.js
                    agent: httpsAgent,
                }
            );

            if (balanceRes.ok) {
                const balanceData: BalanceApiResponse = await balanceRes.json();
                balance = balanceData.data?.balance ?? null;

                // Save to database - use today's date in Asia/Dhaka timezone
                // Only update the balance field, preserve existing consumption data
                if (balance !== null) {
                    const today = getDhakaDateString();
                    await db
                        .insert(dailyConsumptionCache)
                        .values({
                            descoAccountId: accountId,
                            date: today,
                            balance: String(balance),
                        })
                        .onConflictDoUpdate({
                            target: [dailyConsumptionCache.descoAccountId, dailyConsumptionCache.date],
                            set: {
                                balance: String(balance),
                            },
                        });

                    readingTime = today;
                    cachedAt = new Date().toISOString();
                    fromCache = false;
                }
            }
        } catch (err) {
            const timeoutMsg = err instanceof Error && err.message.includes('timeout') ? err.message : null;
            if (timeoutMsg) {
                console.warn(`[BALANCE] Balance fetch timeout for ${accountData.accountNo}: ${timeoutMsg}`);
            } else {
                console.warn(`[BALANCE] Failed to fetch balance for ${accountData.accountNo}`);
            }
            // If we have old cache, use it even if stale
            if (latestRecord.length && latestRecord[0]!.balance) {
                balance = Number(latestRecord[0]!.balance);
                readingTime = latestRecord[0]!.date!;
                cachedAt = latestRecord[0]!.createdAt.toISOString();
            }
        }
    } else {
        // Use cached data
        const row = latestRecord[0]!;
        balance = Number(row.balance);
        readingTime = row.date!;
        cachedAt = row.createdAt.toISOString();
    }

    // Calculate current month consumption (sum of dailyTakaDiff for current month)
    // Use Asia/Dhaka timezone for consistent date handling
    const nowDate = getDhakaDate();
    const firstDayOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
    const firstDayOfMonthStr = getDhakaDateString(firstDayOfMonth);

    const monthData = await db
        .select({
            totalTaka: sql<number>`SUM(${dailyConsumptionCache.dailyTakaDiff})`,
        })
        .from(dailyConsumptionCache)
        .where(and(
            eq(dailyConsumptionCache.descoAccountId, accountId),
            sql`${dailyConsumptionCache.date} >= ${firstDayOfMonthStr}`
        ));

    const currentMonthConsumption = monthData[0]?.totalTaka
        ? Number(monthData[0].totalTaka)
        : 0;

    // Return balance in the expected format with freshness info
    const balanceData = {
        accountNo: accountData.accountNo,
        meterNo: accountData.meterNo,
        balance: balance,
        currentMonthConsumption,
        readingTime,
        isStale: isStale && balance !== null,
        cachedAt,
        fromCache,
    };

    return NextResponse.json({ data: balanceData });
}
