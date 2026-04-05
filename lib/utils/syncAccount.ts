import { getDb } from '@/lib/db/db';
import { dailyConsumptionCache } from '@/lib/db/schema';
import type { DailyConsumptionInfo } from '@/Interfaces/getCustomerDailyConsumption';
import type { BalanceInfo } from '@/Interfaces/getBalance';
import https from 'https';
import { fetchWithTimeout } from '@/lib/utils/fetchWithTimeout';

const DESCO_API_BASE_URL = 'https://prepaid.desco.org.bd/api/tkdes/customer';

// Agent to bypass SSL verification (DESCO API has certificate issues)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

interface ConsumptionApiResponse {
    code: number;
    data: DailyConsumptionInfo[];
}

interface BalanceApiResponse {
    code: number;
    data: BalanceInfo;
}

export async function syncAccountConsumption(
    accountId: string,
    accountNo: string,
    meterNo: string,
    daysToFetch: number = 30
): Promise<{ success: boolean; message?: string; recordsProcessed?: number }> {
    const db = getDb();

    // Calculate date range using Asia/Dhaka timezone (UTC+6)
    // This ensures we fetch data for the correct dates in local time
    const tz = 'Asia/Dhaka';
    
    // Get current date in Asia/Dhaka timezone
    const nowInDhaka = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
    
    // toDate: Yesterday (most recent complete day)
    const toDateObj = new Date(nowInDhaka);
    toDateObj.setDate(toDateObj.getDate() - 1);
    const toDate = toDateObj.toISOString().split('T')[0]!;

    // fromDate: daysToFetch + 1 days before yesterday (to calculate first day's diff)
    const fromDateObj = new Date(nowInDhaka);
    fromDateObj.setDate(fromDateObj.getDate() - (daysToFetch + 1));
    const fromDate = fromDateObj.toISOString().split('T')[0]!;

    try {
        // 1. Fetch consumption history with timeout
        const consumptionRes = await fetchWithTimeout(
            `${DESCO_API_BASE_URL}/getCustomerDailyConsumption?accountNo=${accountNo}&meterNo=${meterNo}&dateFrom=${fromDate}&dateTo=${toDate}`,
            {
                headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
                // @ts-expect-error - Agent is not in standard fetch types but works with Node.js
                agent: httpsAgent,
            }
        );

        if (!consumptionRes.ok) {
            throw new Error(`Consumption API returned ${consumptionRes.status}`);
        }

        const consumptionData: ConsumptionApiResponse = await consumptionRes.json();

        if (!consumptionData.data || consumptionData.data.length === 0) {
            return { success: false, message: 'No consumption data available' };
        }

        // Sort chronologically
        const sortedData = [...consumptionData.data].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // 2. Fetch current balance with timeout (optional, failure shouldn't block consumption caching)
        let currentBalance: number | null = null;
        try {
            const balanceRes = await fetchWithTimeout(
                `${DESCO_API_BASE_URL}/getBalance?accountNo=${accountNo}&meterNo=${meterNo}`,
                {
                    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
                    // @ts-expect-error - Agent is not in standard fetch types but works with Node.js
                    agent: httpsAgent,
                }
            );
            if (balanceRes.ok) {
                const balanceData: BalanceApiResponse = await balanceRes.json();
                currentBalance = balanceData.data?.balance ?? null;
            }
        } catch (err) {
            const timeoutMsg = err instanceof Error && err.message.includes('timeout') ? err.message : null;
            if (timeoutMsg) {
                console.warn(`[SYNC] Balance fetch timeout for ${accountNo}: ${timeoutMsg}`);
            } else {
                console.warn(`[SYNC] Failed to fetch balance for ${accountNo}`);
            }
        }

        // 3. Process and Insert/Update Cache
        let upsertCount = 0;

        for (let i = 1; i < sortedData.length; i++) {
            const currentDay = sortedData[i]!;
            const prevDay = sortedData[i - 1]!;

            const currentDateObj = new Date(currentDay.date);
            const prevDateObj = new Date(prevDay.date);
            const isFirstDayOfMonth = currentDateObj.getDate() === 1;
            const isSameMonth = prevDateObj.getMonth() === currentDateObj.getMonth();

            // Calculate Taka Diff - resets on 1st of month or when crossing month boundary
            let dailyTakaDiff = currentDay.consumedTaka;
            if (!isFirstDayOfMonth && isSameMonth) {
                dailyTakaDiff = currentDay.consumedTaka - prevDay.consumedTaka;
            }

            // Calculate Unit Diff - also resets on month boundary (units are cumulative within month)
            let dailyUnitDiff = currentDay.consumedUnit;
            if (!isFirstDayOfMonth && isSameMonth) {
                dailyUnitDiff = currentDay.consumedUnit - prevDay.consumedUnit;
            }

            // Upsert into DB
            await db
                .insert(dailyConsumptionCache)
                .values({
                    descoAccountId: accountId,
                    date: currentDay.date,
                    consumedTaka: String(currentDay.consumedTaka),
                    consumedUnit: String(currentDay.consumedUnit),
                    dailyTakaDiff: String(dailyTakaDiff),
                    dailyUnitDiff: String(dailyUnitDiff),
                    balance: currentBalance !== null ? String(currentBalance) : null,
                    rawJson: currentDay,
                })
                .onConflictDoUpdate({
                    target: [dailyConsumptionCache.descoAccountId, dailyConsumptionCache.date],
                    set: {
                        consumedTaka: String(currentDay.consumedTaka),
                        consumedUnit: String(currentDay.consumedUnit),
                        dailyTakaDiff: String(dailyTakaDiff),
                        dailyUnitDiff: String(dailyUnitDiff),
                        balance: currentBalance !== null ? String(currentBalance) : null,
                        rawJson: currentDay,
                    },
                });

            upsertCount++;
        }

        return {
            success: true,
            recordsProcessed: upsertCount
        };

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown sync error';
        console.error(`[SYNC] Error processing ${accountNo}:`, message);
        return { success: false, message };
    }
}
