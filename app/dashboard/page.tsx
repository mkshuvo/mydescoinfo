'use client';

import React, { useState } from 'react';
import type { DescoAccount } from '@/lib/db/schema';
import DashboardHeader from '@/components/DashboardHeader';
import QuickStats from '@/components/QuickStats';
import EmptyState from '@/components/EmptyState';
import MeterCard from '@/components/MeterCard';
import AddMeterModal from '@/components/AddMeterModal';

interface AccountWithLiveData extends DescoAccount {
    liveBalance?: number | null;
    liveConsumption?: number | null;
    loadingLive?: boolean;
}

export default function DashboardPage() {
    const [accounts, setAccounts] = useState<AccountWithLiveData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state for adding accounts
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAccountNo, setNewAccountNo] = useState('');
    const [newMeterNo, setNewMeterNo] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    React.useEffect(() => {
        fetchAccounts();

        // Listen for Add Meter modal trigger from Navbar
        const handleOpenAddMeter = () => setShowAddModal(true);
        window.addEventListener('openAddMeterModal', handleOpenAddMeter);
        return () => window.removeEventListener('openAddMeterModal', handleOpenAddMeter);
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/accounts');
            if (!res.ok) throw new Error('Failed to fetch accounts');
            const data = await res.json();
            const accts: AccountWithLiveData[] = data.data ?? [];
            setAccounts(accts);

            // Fetch live data for all accounts in parallel using Promise.all
            const accountsWithMeterNo = accts.filter(acct => acct.meterNo);
            if (accountsWithMeterNo.length > 0) {
                Promise.all(accountsWithMeterNo.map(acct => fetchLiveDataForAccount(acct)))
                    .catch((err) => console.error('[Dashboard] Failed to fetch live data:', err));
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const fetchLiveDataForAccount = async (account: AccountWithLiveData) => {
        setAccounts((prev) =>
            prev.map((a) =>
                a.id === account.id ? { ...a, loadingLive: true } : a
            )
        );

        try {
            // Fetch balance from DB (auto-fallback to DESCO API if cache missing/stale)
            // Also fetch consumption data in parallel
            const [balanceRes, consumptionRes] = await Promise.all([
                fetch(`/api/balance?accountId=${account.id}`),
                fetch(`/api/consumption?accountId=${account.id}`).catch(() => null),
            ]);

            // Parse consumption data if available
            let hesternCost: number | null = null;
            if (consumptionRes) {
                try {
                    const consumptionData = await consumptionRes.json();
                    // First entry is most recent (yesterday/Hestern)
                    if (consumptionData.data && consumptionData.data.length > 0) {
                        hesternCost = consumptionData.data[0]?.dailyTakaDiff ?? null;
                    }
                } catch {
                    // Silently fail - hestern cost is optional
                }
            }

            if (balanceRes.ok) {
                const balanceData = await balanceRes.json();
                setAccounts((prev) =>
                    prev.map((a) =>
                        a.id === account.id
                            ? {
                                ...a,
                                liveBalance: balanceData.data?.balance ?? null,
                                liveConsumption: hesternCost ?? balanceData.data?.currentMonthConsumption ?? null,
                                loadingLive: false,
                            }
                            : a
                    )
                );
            } else {
                // Balance API error, mark as not loading
                setAccounts((prev) =>
                    prev.map((a) =>
                        a.id === account.id ? { ...a, loadingLive: false } : a
                    )
                );
            }
        } catch {
            setAccounts((prev) =>
                prev.map((a) =>
                    a.id === account.id ? { ...a, loadingLive: false } : a
                )
            );
        }
    };

    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddError(null);
        setAdding(true);

        try {
            const res = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountNo: newAccountNo,
                    meterNo: newMeterNo || undefined,
                    label: newLabel || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setAddError(data.message ?? 'Failed to add account.');
                setAdding(false);
                return;
            }

            setShowAddModal(false);
            setNewAccountNo('');
            setNewMeterNo('');
            setNewLabel('');
            fetchAccounts();
        } catch {
            setAddError('An error occurred while adding the account.');
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveAccount = async (id: string) => {
        if (!confirm('Remove this account from your dashboard?')) return;

        await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
        setAccounts((prev) => prev.filter((a) => a.id !== id));
    };

    const closeModal = () => {
        setShowAddModal(false);
        setAddError(null);
        setNewAccountNo('');
        setNewMeterNo('');
        setNewLabel('');
    };

    // Calculate totals for quick stats
    const totalSpend = accounts.reduce((sum, acc) => sum + (acc.liveConsumption ?? 0), 0);

    // Low balance threshold (200 Taka)
    const LOW_BALANCE_THRESHOLD = 200;
    const lowBalanceMeters = accounts.filter(
        (acc) => acc.liveBalance !== null && acc.liveBalance !== undefined && acc.liveBalance < LOW_BALANCE_THRESHOLD
    ).length;

    // Peak usage threshold (500 Taka daily - considered high consumption)
    const PEAK_USAGE_THRESHOLD = 500;
    const peakUsageAlerts = accounts.filter(
        (acc) => acc.liveConsumption !== null && acc.liveConsumption !== undefined && acc.liveConsumption > PEAK_USAGE_THRESHOLD
    ).length;

    return (
        <div className="mx-auto max-w-7xl px-6 py-12">
            <DashboardHeader />

            <QuickStats
                totalSpend={totalSpend}
                lowBalanceMeters={lowBalanceMeters}
                peakUsageAlerts={peakUsageAlerts}
            />

            {/* Error */}
            {error && (
                <div className="bg-error/10 border-l-4 border-error text-error px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="text-center text-on-surface-variant py-12">
                    <p className="text-lg">Loading your meters...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && accounts.length === 0 && (
                <EmptyState onAddClick={() => setShowAddModal(true)} />
            )}

            {/* Account Cards Grid - Bento Layout */}
            {!loading && accounts.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {accounts.map((account) => (
                        <MeterCard
                            key={account.id}
                            id={account.id}
                            label={account.label}
                            accountNo={account.accountNo}
                            meterNo={account.meterNo}
                            liveBalance={account.liveBalance}
                            liveConsumption={account.liveConsumption}
                            loadingLive={account.loadingLive}
                            onRemove={handleRemoveAccount}
                        />
                    ))}
                </div>
            )}

            <AddMeterModal
                isOpen={showAddModal}
                onClose={closeModal}
                onSubmit={handleAddAccount}
                newAccountNo={newAccountNo}
                setNewAccountNo={setNewAccountNo}
                newMeterNo={newMeterNo}
                setNewMeterNo={setNewMeterNo}
                newLabel={newLabel}
                setNewLabel={setNewLabel}
                adding={adding}
                error={addError}
            />
        </div>
    );
}
