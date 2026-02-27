'use client';

import { useEffect, useCallback } from 'react';
import { useDescoStore } from '@/lib/stores/descoStore';
import type { BalanceInfo } from '@/Interfaces/getBalance';
import type { DailyConsumptionInfo } from '@/Interfaces/getCustomerDailyConsumption';
import { calculateDailyDifferences } from '@/lib/utils/consumption';

const PROXY_API_BASE_URL = '/api/descoProxy';
const DB_BALANCE_API = '/api/balance';
const DB_CONSUMPTION_API = '/api/consumption';

interface ApiResponse<T> {
    data: T;
    message?: string;
}

interface UseDescoDataResult {
    balanceData: BalanceInfo | null;
    dailyConsumptionData: DailyConsumptionInfo[] | null;
    dailyDifferences: ReturnType<typeof calculateDailyDifferences>;
    recentConsumption: number;
    loadingBalance: boolean;
    loadingConsumption: boolean;
    errorBalance: string | null;
    errorConsumption: string | null;
    refetch: () => void;
}

export function useDescoData(
    accountNo: string | null,
    meterNo: string | null,
    accountId: string | null = null
): UseDescoDataResult {
    const {
        balanceData,
        dailyConsumptionData,
        loadingBalance,
        loadingConsumption,
        errorBalance,
        errorConsumption,
        setBalanceData,
        setDailyConsumptionData,
        setLoadingBalance,
        setLoadingConsumption,
        setErrorBalance,
        setErrorConsumption,
    } = useDescoStore();

    const fetchBalanceFromDB = useCallback(async () => {
        if (!accountId) return { data: null, fromDb: false };

        try {
            const response = await fetch(`${DB_BALANCE_API}?accountId=${accountId}`);
            if (!response.ok) return { data: null, fromDb: false };
            const result = await response.json();
            if (result.data) {
                return { data: result.data, fromDb: true };
            }
        } catch {
            // Fall back to API
        }
        return { data: null, fromDb: false };
    }, [accountId]);

    const fetchConsumptionFromDB = useCallback(async () => {
        if (!accountId) return { data: null, fromDb: false };

        try {
            const response = await fetch(`${DB_CONSUMPTION_API}?accountId=${accountId}`);
            if (!response.ok) return { data: null, fromDb: false };
            const result = await response.json();
            if (result.data && result.data.length > 0) {
                return { data: result.data, fromDb: true };
            }
        } catch {
            // Fall back to API
        }
        return { data: null, fromDb: false };
    }, [accountId]);

    const fetchBalance = useCallback(async () => {
        if (!accountNo || !meterNo) return;

        setLoadingBalance(true);
        setErrorBalance(null);

        // Try DB first if accountId is available
        if (accountId) {
            const dbResult = await fetchBalanceFromDB();
            if (dbResult.data) {
                setBalanceData(dbResult.data);
                setLoadingBalance(false);
                return;
            }
        }

        // Fall back to DESCO API
        try {
            const response = await fetch(
                `${PROXY_API_BASE_URL}?endpoint=getBalance&accountNo=${accountNo}&meterNo=${meterNo}`
            );
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message ?? `Failed to fetch balance: ${response.status}`);
            }
            const result: ApiResponse<BalanceInfo> = await response.json();
            if (result.data) {
                setBalanceData(result.data);
            } else {
                throw new Error(result.message ?? 'Balance data not found in response');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch balance data.';
            setErrorBalance(message);
            console.error('Error fetching balance:', err);
        } finally {
            setLoadingBalance(false);
        }
    }, [accountNo, meterNo, accountId, setBalanceData, setLoadingBalance, setErrorBalance, fetchBalanceFromDB]);

    const fetchConsumption = useCallback(async () => {
        if (!accountNo || !meterNo) return;

        setLoadingConsumption(true);
        setErrorConsumption(null);

        // Try DB first if accountId is available
        if (accountId) {
            const dbResult = await fetchConsumptionFromDB();
            if (dbResult.data) {
                setDailyConsumptionData(dbResult.data);
                setLoadingConsumption(false);
                return;
            }
        }

        // Fall back to DESCO API
        try {
            const dateTo = new Date().toISOString().split('T')[0];
            const dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - 30);
            const formattedDateFrom = dateFrom.toISOString().split('T')[0];

            const response = await fetch(
                `${PROXY_API_BASE_URL}?endpoint=getCustomerDailyConsumption&accountNo=${accountNo}&meterNo=${meterNo}&dateFrom=${formattedDateFrom}&dateTo=${dateTo}`
            );
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message ?? `Failed to fetch consumption: ${response.status}`);
            }
            const result: ApiResponse<DailyConsumptionInfo[]> = await response.json();
            if (result.data) {
                setDailyConsumptionData(result.data);
            } else {
                throw new Error(result.message ?? 'Consumption data not found in response');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch consumption data.';
            setErrorConsumption(message);
            console.error('Error fetching consumption:', err);
        } finally {
            setLoadingConsumption(false);
        }
    }, [accountNo, meterNo, accountId, setDailyConsumptionData, setLoadingConsumption, setErrorConsumption, fetchConsumptionFromDB]);

    const refetch = useCallback(() => {
        fetchBalance();
        fetchConsumption();
    }, [fetchBalance, fetchConsumption]);

    useEffect(() => {
        if (accountNo && meterNo) {
            fetchBalance();
            fetchConsumption();
        }
    }, [accountNo, meterNo, fetchBalance, fetchConsumption]);

    const dailyDifferences = dailyConsumptionData
        ? calculateDailyDifferences(dailyConsumptionData)
        : [];

    const recentConsumption =
        dailyDifferences.length > 0
            ? dailyDifferences[dailyDifferences.length - 1]!.difference
            : 0;

    return {
        balanceData,
        dailyConsumptionData,
        dailyDifferences,
        recentConsumption,
        loadingBalance,
        loadingConsumption,
        errorBalance,
        errorConsumption,
        refetch,
    };
}
