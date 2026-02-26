export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse, after } from 'next/server';
import { auth } from '@/lib/auth/server';
import { getDb } from '@/lib/db/db';
import { descoAccounts } from '@/lib/db/schema';
import { syncAccountConsumption } from '@/lib/utils/syncAccount';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const addAccountSchema = z.object({
    accountNo: z.string().min(1, 'Account number is required'),
    meterNo: z.string().optional(),
    label: z.string().max(100).optional(),
});

// GET - List all DESCO accounts for the authenticated user
export async function GET() {
    const db = getDb();
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userAccounts = await db
        .select()
        .from(descoAccounts)
        .where(
            and(
                eq(descoAccounts.userId, session.user.id),
                eq(descoAccounts.isActive, true)
            )
        );

    return NextResponse.json({ data: userAccounts });
}

// POST - Add a new DESCO account for the authenticated user
export async function POST(request: NextRequest) {
    const db = getDb();
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = addAccountSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { message: parsed.error.errors[0]?.message ?? 'Validation failed' },
            { status: 400 }
        );
    }

    const { accountNo, meterNo, label } = parsed.data;

    // Check for duplicate
    const [existing] = await db
        .select({ id: descoAccounts.id })
        .from(descoAccounts)
        .where(
            and(
                eq(descoAccounts.userId, session.user.id),
                eq(descoAccounts.accountNo, accountNo)
            )
        )
        .limit(1);

    if (existing) {
        return NextResponse.json(
            { message: 'This account number is already linked to your profile.' },
            { status: 409 }
        );
    }

    // Attempt to fetch meter number from DESCO API if not provided
    let resolvedMeterNo = meterNo ?? null;

    if (!resolvedMeterNo) {
        try {
            const infoRes = await fetch(
                `https://prepaid.desco.org.bd/api/tkdes/customer/getCustomerInfo?accountNo=${accountNo}&meterNo=0`,
                {
                    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
                }
            );
            const infoData = await infoRes.json();
            console.log('[ACCOUNTS] getCustomerInfo response for', accountNo, ':', JSON.stringify(infoData));

            if (infoRes.ok && infoData?.data?.meterNo) {
                resolvedMeterNo = infoData.data.meterNo;
                console.log('[ACCOUNTS] Auto-resolved meter number:', resolvedMeterNo);
            } else if (infoData?.code !== undefined && infoData.code !== 0) {
                console.warn('[ACCOUNTS] DESCO API error:', infoData.desc || infoData.message);
            }
        } catch (err) {
            // Non-critical — we can still add the account without a meter number
            console.error('[ACCOUNTS] Error resolving meter number for', accountNo, err);
        }
    }

    const [newAccount] = await db
        .insert(descoAccounts)
        .values({
            userId: session.user.id,
            accountNo,
            meterNo: resolvedMeterNo,
            label: label ?? `Account ${accountNo}`,
        })
        .returning();

    // Trigger background sync if a meter number is available
    if (newAccount?.meterNo) {
        after(async () => {
            console.log(`[ACCOUNTS] Starting background sync for new account ${newAccount.accountNo}...`);
            await syncAccountConsumption(newAccount.id, newAccount.accountNo, newAccount.meterNo!, 30);
        });
    }

    return NextResponse.json({ data: newAccount }, { status: 201 });
}
