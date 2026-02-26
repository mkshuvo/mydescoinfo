'use client';

import { useEffect, useCallback } from 'react';
import { useDescoStore } from '@/lib/stores/descoStore';
import type { BalanceInfo } from '@/Interfaces/getBalance';
import type { DailyConsumptionInfo } from '@/Interfaces/getCustomerDailyConsumption';
import { calculateDailyDifferences } from '@/lib/utils/consumption';

const PROXY_API_BASE_URL = '/api/descoProxy';

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
    meterNo: string | null
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

    const fetchBalance = useCallback(async () => {
        if (!accountNo || !meterNo) return;

        setLoadingBalance(true);
        setErrorBalance(null);

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
    }, [accountNo, meterNo, setBalanceData, setLoadingBalance, setErrorBalance]);

    const fetchConsumption = useCallback(async () => {
        if (!accountNo || !meterNo) return;

        setLoadingConsumption(true);
        setErrorConsumption(null);

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
    }, [accountNo, meterNo, setDailyConsumptionData, setLoadingConsumption, setErrorConsumption]);

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
