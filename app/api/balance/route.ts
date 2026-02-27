export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { dailyConsumptionCache, descoAccounts } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';

/**
 * GET /api/balance
 * Returns the most recent cached balance from the database.
 *
 * Query params:
 *   - accountId: The DESCO account ID (required)
 */
export async function GET(request: NextRequest) {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');

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

    // Get the most recent cached balance
    const latestRecord = await db
        .select()
        .from(dailyConsumptionCache)
        .where(eq(dailyConsumptionCache.descoAccountId, accountId))
        .orderBy(desc(dailyConsumptionCache.date))
        .limit(1);

    if (!latestRecord.length || !latestRecord[0]!.balance) {
        return NextResponse.json({
            data: null,
            message: 'No cached balance data. Please sync first.'
        });
    }

    const row = latestRecord[0]!;

    // Calculate current month consumption (sum of dailyTakaDiff for current month)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0]!;

    const monthData = await db
        .select({
            totalTaka: sql<number>`SUM(${dailyConsumptionCache.dailyTakaDiff})`,
        })
        .from(dailyConsumptionCache)
        .where(and(
            eq(dailyConsumptionCache.descoAccountId, accountId),
            sql`${dailyConsumptionCache.date} >= ${firstDayOfMonth}`
        ));

    const currentMonthConsumption = monthData[0]?.totalTaka
        ? Number(monthData[0].totalTaka)
        : 0;

    // Return balance in the expected format
    const balanceData = {
        accountNo: account[0]!.accountNo,
        meterNo: account[0]!.meterNo,
        balance: Number(row.balance),
        currentMonthConsumption,
        readingTime: row.date,
    };

    return NextResponse.json({ data: balanceData });
}
