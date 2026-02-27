export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/db';
import { descoAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { syncAccountConsumption } from '@/lib/utils/syncAccount';

/**
 * Daily cron job endpoint — intended to run at 8 AM BST (2 AM UTC).
 * Fetches last 30 days consumption for all active accounts and caches the results.
 *
 * Protected by CRON_SECRET Bearer token (validated in middleware.ts).
 */
export async function GET(request: NextRequest) {
    const db = getDb();
    // Additional cron secret check (belt + suspenders with middleware)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const activeAccounts = await db
        .select()
        .from(descoAccounts)
        .where(eq(descoAccounts.isActive, true));

    const results: Array<{
        accountNo: string;
        status: 'success' | 'skipped' | 'error';
        message?: string;
    }> = [];

    for (const account of activeAccounts) {
        if (!account.meterNo) {
            results.push({
                accountNo: account.accountNo,
                status: 'skipped',
                message: 'No meter number',
            });
            continue;
        }

        try {
            // Fetch last 30 days of consumption data
            const result = await syncAccountConsumption(
                account.id,
                account.accountNo,
                account.meterNo,
                30
            );

            if (result.success) {
                results.push({
                    accountNo: account.accountNo,
                    status: 'success',
                });
            } else {
                results.push({
                    accountNo: account.accountNo,
                    status: 'error',
                    message: result.message,
                });
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[CRON] Error processing ${account.accountNo}:`, error);
            results.push({
                accountNo: account.accountNo,
                status: 'error',
                message,
            });
        }
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const errorCount = results.filter((r) => r.status === 'error').length;
    const skippedCount = results.filter((r) => r.status === 'skipped').length;

    console.log(
        `[CRON] Daily consumption processed: ${successCount} success, ${errorCount} errors, ${skippedCount} skipped`
    );

    return NextResponse.json({
        processed: results.length,
        success: successCount,
        errors: errorCount,
        skipped: skippedCount,
        details: results,
    });
}
