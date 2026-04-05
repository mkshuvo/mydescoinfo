export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { dailyConsumptionCache, descoAccounts } from '@/lib/db/schema';
import { eq, and, desc, isNotNull } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';

/**
 * GET /api/consumption
 * Returns cached daily consumption data from the database.
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

    // Get cached consumption data for the last 30 days
    // Filter out balance-only records (where consumedTaka is NULL) using SQL
    // Balance-only records are created by /api/balance endpoint when fetching balance without consumption data
    // Real zero-consumption days have consumedTaka = 0 (explicitly set by sync), not NULL
    const consumptionData = await db
        .select()
        .from(dailyConsumptionCache)
        .where(and(
            eq(dailyConsumptionCache.descoAccountId, accountId),
            isNotNull(dailyConsumptionCache.consumedTaka) // Exclude balance-only records
        ))
        .orderBy(desc(dailyConsumptionCache.date))
        .limit(30);

    if (!consumptionData.length) {
        return NextResponse.json({
            data: [],
            message: 'No cached consumption data. Please sync first.'
        });
    }

    // Transform to match expected format
    // Note: consumedTaka is already guaranteed to be non-NULL due to SQL filter above
    // Real zero-consumption days (consumedTaka = 0) are preserved, only balance-only records (consumedTaka = NULL) are excluded
    const transformedData = consumptionData.map(row => ({
        date: row.date,
        consumedTaka: Number(row.consumedTaka) || 0,
        consumedUnit: Number(row.consumedUnit) || 0,
        dailyTakaDiff: Number(row.dailyTakaDiff) || 0,
        dailyUnitDiff: Number(row.dailyUnitDiff) || 0,
        balance: row.balance ? Number(row.balance) : null,
    }));

    return NextResponse.json({ data: transformedData });
}
