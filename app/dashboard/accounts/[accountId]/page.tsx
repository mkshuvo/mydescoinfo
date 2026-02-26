'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDescoData } from '@/lib/hooks/useDescoData';
import BalanceCard from '@/components/BalanceCard';
import ConsumptionCard from '@/components/ConsumptionCard';
import AccountInfoCard from '@/components/AccountInfoCard';
import ConsumptionTable from '@/components/ConsumptionTable';
import type { DescoAccount } from '@/lib/db/schema';
import Link from 'next/link';

export default function AccountDetailPage() {
    const params = useParams();
    const accountId = params.accountId as string;

    const [account, setAccount] = useState<DescoAccount | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                const res = await fetch('/api/accounts');
                if (!res.ok) throw new Error('Failed to fetch accounts');
                const data = await res.json();
                const found = (data.data as DescoAccount[])?.find(
                    (a: DescoAccount) => a.id === accountId
                );
                if (!found) throw new Error('Account not found');
                setAccount(found);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchAccount();
    }, [accountId]);

    const {
        balanceData,
        dailyDifferences,
        recentConsumption,
        loadingBalance,
        loadingConsumption,
        errorBalance,
        errorConsumption,
        refetch,
    } = useDescoData(
        account?.accountNo ?? null,
        account?.meterNo ?? null
    );

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncMessage(null);
        try {
            const res = await fetch(`/api/accounts/${accountId}/sync`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Sync failed');
            setSyncMessage(`✓ Synced ${data.recordsProcessed || 0} days of data`);
            if (data.meterNo) {
                setAccount(prev => prev ? { ...prev, meterNo: data.meterNo } : prev);
            }
            refetch(); // Reload the UI with the fresh DB data
            setTimeout(() => setSyncMessage(null), 5000); // Clear success message after 5s
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Sync failed';
            setSyncMessage(`❌ ${msg}`);
        } finally {
            setIsSyncing(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 text-center text-gray-400">
                Loading account details...
            </div>
        );
    }

    if (error || !account) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 text-center">
                <p className="text-red-400 text-lg">{error ?? 'Account not found'}</p>
                <Link
                    href="/dashboard"
                    className="text-green-400 hover:text-green-300 mt-4 inline-block"
                >
                    ← Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            <div className="mb-6">
                <Link
                    href="/dashboard"
                    className="text-green-400 hover:text-green-300 text-sm transition-colors"
                >
                    ← Dashboard
                </Link>
            </div>

            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-white">
                        {account.label ?? `Account ${account.accountNo}`}
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Account #{account.accountNo} • Meter {account.meterNo ?? 'N/A'}
                    </p>
                </div>

                <div className="flex flex-col items-end">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSyncing ? (
                            <>
                                <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                                Syncing History...
                            </>
                        ) : (
                            '⬇️ Sync 30-Day History'
                        )}
                    </button>
                    {!account.meterNo && (
                        <p className="text-xs mt-2 text-yellow-500">
                            Meter missing. Sync to auto-resolve.
                        </p>
                    )}
                    {syncMessage && (
                        <p className={`text-xs mt-2 ${syncMessage.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                            {syncMessage}
                        </p>
                    )}
                </div>
            </div>

            {/* Balance & Consumption Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    {loadingBalance && (
                        <p className="text-gray-400">Loading balance...</p>
                    )}
                    {errorBalance && (
                        <p className="text-red-400">Error: {errorBalance}</p>
                    )}
                    <BalanceCard balanceData={balanceData} loading={loadingBalance} />
                </div>
                <div>
                    <ConsumptionCard recentConsumption={recentConsumption} />
                </div>
            </div>

            {/* Account Info */}
            {balanceData && (
                <AccountInfoCard
                    meterNo={balanceData.meterNo}
                    accountNo={balanceData.accountNo}
                    currentMonthConsumption={balanceData.currentMonthConsumption}
                    readingTime={balanceData.readingTime}
                />
            )}

            {/* Consumption Table */}
            {loadingConsumption && (
                <p className="mt-4 text-center text-gray-400">
                    Loading daily consumption data...
                </p>
            )}
            {errorConsumption && (
                <p className="mt-4 text-center text-red-400">
                    Error: {errorConsumption}
                </p>
            )}
            {dailyDifferences.length > 0 && (
                <ConsumptionTable dailyDifferences={dailyDifferences} />
            )}
            {!loadingConsumption &&
                !errorConsumption &&
                dailyDifferences.length === 0 && (
                    <p className="mt-4 text-center text-gray-400">
                        No daily consumption data available for the last 30 days.
                    </p>
                )}
        </div>
    );
}
