export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { getDb } from '@/lib/db/db';
import { descoAccounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { syncAccountConsumption } from '@/lib/utils/syncAccount';
import https from 'https';
import { fetchWithTimeout } from '@/lib/utils/fetchWithTimeout';

// Agent to bypass SSL verification (DESCO API has certificate issues)
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

// ============================================================================
// Simple In-Memory Rate Limiter
// NOTE: This rate limiter is designed for single-instance deployments.
// In serverless environments (e.g., Vercel), each function invocation has
// isolated memory, so rate limits won't be shared across requests.
// For production serverless deployments, consider using:
// - Vercel's built-in rate limiting middleware
// - A Redis-based solution (e.g., @vercel/kv)
// - A database-backed rate limiter
// ============================================================================

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 * - 5 requests per minute per user
 * - 20 requests per hour per user
 */
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;
const HOURLY_RATE_LIMIT_MAX_REQUESTS = 20;

interface HourlyRateLimitEntry {
    count: number;
    resetTime: number;
}

const hourlyRateLimitMap = new Map<string, HourlyRateLimitEntry>();

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    let entry = rateLimitMap.get(userId);

    // Reset per-minute window if expired
    if (entry && now > entry.resetTime) {
        rateLimitMap.delete(userId);
        entry = undefined;
    }

    if (!entry) {
        // First request - initialize both minute and hourly counters
        rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        hourlyRateLimitMap.set(userId, { count: 1, resetTime: now + 60 * 60 * 1000 });
        return { allowed: true };
    }

    // Check per-minute limit
    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return { allowed: false, retryAfter };
    }

    // Check and update hourly limit
    let hourlyEntry = hourlyRateLimitMap.get(userId);
    if (!hourlyEntry || now > hourlyEntry.resetTime) {
        // Hourly window expired - reset with current request count
        hourlyEntry = { count: entry.count, resetTime: now + 60 * 60 * 1000 };
    }

    // Check hourly limit
    if (hourlyEntry.count >= HOURLY_RATE_LIMIT_MAX_REQUESTS) {
        const retryAfter = Math.ceil((hourlyEntry.resetTime - now) / 1000);
        return { allowed: false, retryAfter };
    }

    // Increment both counters
    hourlyEntry.count++;
    entry.count++;
    rateLimitMap.set(userId, entry);
    hourlyRateLimitMap.set(userId, hourlyEntry);
    return { allowed: true };
}

// POST - Force sync an existing DESCO account's historical data (last 30 days)
export async function POST(_request: NextRequest, { params }: RouteParams) {
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit
    const rateLimitResult = checkRateLimit(session.user.id);
    if (!rateLimitResult.allowed) {
        return NextResponse.json(
            {
                message: 'Rate limit exceeded. Please wait before syncing again.',
                retryAfter: rateLimitResult.retryAfter,
            },
            { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter ?? 60) } }
        );
    }

    const db = getDb();
    const { id } = await params;

    // Verify account exists and belongs to user
    const [account] = await db
        .select()
        .from(descoAccounts)
        .where(
            and(
                eq(descoAccounts.id, id),
                eq(descoAccounts.userId, session.user.id),
                eq(descoAccounts.isActive, true)
            )
        )
        .limit(1);

    if (!account) {
        return NextResponse.json({ message: 'Account not found or inactive.' }, { status: 404 });
    }

    let resolvedMeterNo = account.meterNo;

    // Auto-resolve missing meter number with timeout
    if (!resolvedMeterNo) {
        try {
            const infoRes = await fetchWithTimeout(
                `https://prepaid.desco.org.bd/api/tkdes/customer/getCustomerInfo?accountNo=${account.accountNo}&meterNo=0`,
                {
                    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
                    // @ts-expect-error - Agent is not in standard fetch types but works with Node.js
                    agent: httpsAgent,
                }
            );
            if (infoRes.ok) {
                const infoData = await infoRes.json();
                if (infoData?.data?.meterNo) {
                    resolvedMeterNo = infoData.data.meterNo;
                    // Persist the missing meter number back to the database
                    await db.update(descoAccounts)
                        .set({ meterNo: resolvedMeterNo, updatedAt: new Date() })
                        .where(eq(descoAccounts.id, account.id));
                }
            }
        } catch (err) {
            const timeoutMsg = err instanceof Error && err.message.includes('timeout') ? err.message : null;
            if (timeoutMsg) {
                console.warn('[SYNC] Meter number resolution timeout:', timeoutMsg);
            } else {
                console.warn('[SYNC] Failed to auto-resolve meter number:', err);
            }
        }

        if (!resolvedMeterNo) {
            return NextResponse.json({ message: 'Meter number is missing and could not be automatically resolved by DESCO.' }, { status: 400 });
        }
    }

    try {
        const result = await syncAccountConsumption(
            account.id,
            account.accountNo,
            resolvedMeterNo,
            30 // Fetch last 30 days
        );

        if (result.success) {
            return NextResponse.json({
                message: `Successfully synced ${result.recordsProcessed} records.`,
                recordsProcessed: result.recordsProcessed
            });
        } else {
            return NextResponse.json({ message: result.message }, { status: 500 });
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error during sync.';
        return NextResponse.json({ message }, { status: 500 });
    }
}
