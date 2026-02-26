export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { getDb } from '@/lib/db/db';
import { descoAccounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { syncAccountConsumption } from '@/lib/utils/syncAccount';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST - Force sync an existing DESCO account's historical data (last 30 days)
export async function POST(_request: NextRequest, { params }: RouteParams) {
    const db = getDb();
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

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

    // Auto-resolve missing meter number
    if (!resolvedMeterNo) {
        try {
            const infoRes = await fetch(
                `https://prepaid.desco.org.bd/api/tkdes/customer/getCustomerInfo?accountNo=${account.accountNo}&meterNo=0`,
                {
                    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
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
            console.error('[SYNC] Failed to auto-resolve meter number:', err);
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
