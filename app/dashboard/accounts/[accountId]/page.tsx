'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDescoData } from '@/lib/hooks/useDescoData';
import BalanceCard from '@/components/BalanceCard';
import ConsumptionCard from '@/components/ConsumptionCard';
import AccountInfoCard from '@/components/AccountInfoCard';
import ConsumptionTable from '@/components/ConsumptionTable';
import type { DescoAccount } from '@/lib/db/schema';
import type { BalanceInfo } from '@/Interfaces/getBalance';
import Link from 'next/link';

export default function AccountDetailPage() {
    const params = useParams();
    const accountId = params.accountId as string;

    const [account, setAccount] = useState<DescoAccount | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    const [liveBalanceData, setLiveBalanceData] = useState<BalanceInfo | null>(null);
    const [loadingLiveBalance, setLoadingLiveBalance] = useState(true);

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

    // Fetch live balance directly from DESCO API
    useEffect(() => {
        if (account?.accountNo && account?.meterNo) {
            fetchLiveBalance();
        }
    }, [account?.accountNo, account?.meterNo]);

    const fetchLiveBalance = async () => {
        if (!account?.accountNo || !account?.meterNo) return;

        setLoadingLiveBalance(true);
        try {
            const balanceRes = await fetch(
                `/api/descoProxy?endpoint=getBalance&accountNo=${account.accountNo}&meterNo=${account.meterNo}`
            );
            if (balanceRes.ok) {
                const balanceData = await balanceRes.json();
                setLiveBalanceData(balanceData.data ?? null);
            }
        } catch {
            // Silently fail - balance card handles null state
        } finally {
            setLoadingLiveBalance(false);
        }
    };

    const {
        balanceData,
        dailyDifferences,
        recentConsumption,
        loadingConsumption,
        errorBalance,
        errorConsumption,
        refetch,
    } = useDescoData(
        account?.accountNo ?? null,
        account?.meterNo ?? null,
        accountId
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
            refetch();
            setTimeout(() => setSyncMessage(null), 5000);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Sync failed';
            setSyncMessage(`❌ ${msg}`);
        } finally {
            setIsSyncing(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-7xl px-6 py-12 text-center">
                <div className="flex items-center justify-center gap-3 text-on-surface-variant">
                    <div className="w-3 h-3 bg-primary rounded-full pulse-dot"></div>
                    <span className="font-label uppercase tracking-wider">Loading meter data...</span>
                </div>
            </div>
        );
    }

    if (error || !account) {
        return (
            <div className="mx-auto max-w-7xl px-6 py-12 text-center">
                <p className="text-error text-lg font-headline">{error ?? 'Account not found'}</p>
                <Link
                    href="/dashboard"
                    className="text-primary hover:text-primary/80 mt-4 inline-block font-label uppercase tracking-wider transition-colors"
                >
                    ← Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-6 py-12">
            {/* Breadcrumb */}
            <div className="mb-6">
                <Link
                    href="/dashboard"
                    className="text-primary hover:text-primary/80 text-sm font-label uppercase tracking-wider transition-colors"
                >
                    ← Dashboard
                </Link>
            </div>

            {/* Balance & Consumption Cards - Prominent at top */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <BalanceCard balanceData={liveBalanceData} loading={loadingLiveBalance} />
                <ConsumptionCard recentConsumption={recentConsumption} />
            </div>

            {/* Error states */}
            {errorBalance && (
                <div className="bg-error/10 border-l-4 border-error text-error px-4 py-3 rounded-lg mb-6">
                    Error: {errorBalance}
                </div>
            )}

            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div>
                    <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-on-surface mb-2">
                        {account.label ?? `Account ${account.accountNo}`}
                    </h1>
                    <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1 rounded-full w-fit">
                        <div className="w-2 h-2 bg-primary rounded-full pulse-dot"></div>
                        <span className="font-label text-xs text-primary uppercase">Live</span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-3">
                        <Link
                            href={`/dashboard/accounts/${accountId}/usage`}
                            className="px-4 py-2 bg-surface-container-highest text-on-surface font-headline font-bold rounded-lg border border-outline-variant/30 hover:border-primary/50 transition-all duration-300 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">analytics</span>
                            Usage Analytics
                        </Link>
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="bg-primary text-on-primary px-4 py-2 rounded-lg font-headline font-bold hover:opacity-90 transition-all shadow-[0_0_20px_rgba(142,229,32,0.15)] disabled:opacity-50 volt-btn flex items-center gap-2"
                        >
                            {isSyncing ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm">sync</span>
                                    Sync History
                                </>
                            )}
                        </button>
                    </div>
                    {!account.meterNo && (
                        <p className="text-xs text-yellow-500 font-label uppercase tracking-wider">
                            Meter missing. Sync to auto-resolve.
                        </p>
                    )}
                    {syncMessage && (
                        <p className={`text-xs font-label uppercase tracking-wider ${syncMessage.startsWith('✓') ? 'text-primary' : 'text-error'}`}>
                            {syncMessage}
                        </p>
                    )}
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
                <div className="mt-8 text-center text-on-surface-variant py-8">
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-3 h-3 bg-tertiary rounded-full pulse-dot"></div>
                        <span className="font-label uppercase tracking-wider">Loading consumption data...</span>
                    </div>
                </div>
            )}
            {errorConsumption && (
                <div className="mt-8 text-center text-error py-8">
                    <p className="font-label uppercase tracking-wider">Error: {errorConsumption}</p>
                </div>
            )}
            {dailyDifferences.length > 0 && (
                <div className="mt-8">
                    <ConsumptionTable dailyDifferences={dailyDifferences} />
                </div>
            )}
            {!loadingConsumption &&
                !errorConsumption &&
                dailyDifferences.length === 0 && (
                    <div className="mt-8 text-center py-12 bg-surface-container-low rounded-xl kinetic-glow">
                        <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-4">data_array</span>
                        <p className="text-on-surface-variant font-label uppercase tracking-wider">
                            No daily consumption data available for the last 30 days.
                        </p>
                    </div>
                )}
        </div>
    );
}
