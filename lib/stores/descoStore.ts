import { create } from 'zustand';
import type { BalanceInfo } from '@/Interfaces/getBalance';
import type { DailyConsumptionInfo } from '@/Interfaces/getCustomerDailyConsumption';
import type { DescoAccount } from '@/lib/db/schema';

interface DescoState {
    // Selected account
    selectedAccountId: string | null;
    selectedAccount: DescoAccount | null;

    // DESCO data for the selected account
    balanceData: BalanceInfo | null;
    dailyConsumptionData: DailyConsumptionInfo[] | null;

    // Loading states
    loadingBalance: boolean;
    loadingConsumption: boolean;

    // Error states
    errorBalance: string | null;
    errorConsumption: string | null;

    // Actions
    setSelectedAccount: (account: DescoAccount | null) => void;
    setBalanceData: (data: BalanceInfo | null) => void;
    setDailyConsumptionData: (data: DailyConsumptionInfo[] | null) => void;
    setLoadingBalance: (loading: boolean) => void;
    setLoadingConsumption: (loading: boolean) => void;
    setErrorBalance: (error: string | null) => void;
    setErrorConsumption: (error: string | null) => void;
    reset: () => void;
}

const initialState = {
    selectedAccountId: null,
    selectedAccount: null,
    balanceData: null,
    dailyConsumptionData: null,
    loadingBalance: false,
    loadingConsumption: false,
    errorBalance: null,
    errorConsumption: null,
};

export const useDescoStore = create<DescoState>()((set) => ({
    ...initialState,

    setSelectedAccount: (account) =>
        set({
            selectedAccount: account,
            selectedAccountId: account?.id ?? null,
            // Reset data when switching accounts
            balanceData: null,
            dailyConsumptionData: null,
            errorBalance: null,
            errorConsumption: null,
        }),

    setBalanceData: (data) => set({ balanceData: data }),
    setDailyConsumptionData: (data) => set({ dailyConsumptionData: data }),
    setLoadingBalance: (loading) => set({ loadingBalance: loading }),
    setLoadingConsumption: (loading) => set({ loadingConsumption: loading }),
    setErrorBalance: (error) => set({ errorBalance: error }),
    setErrorConsumption: (error) => set({ errorConsumption: error }),
    reset: () => set(initialState),
}));
