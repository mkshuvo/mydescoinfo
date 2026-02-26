'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth/client';
import Link from 'next/link';
import type { DescoAccount } from '@/lib/db/schema';

interface AccountWithLiveData extends DescoAccount {
    liveBalance?: number | null;
    liveConsumption?: number | null;
    loadingLive?: boolean;
}

export default function DashboardPage() {
    const { data: session } = authClient.useSession();
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

    useEffect(() => {
        fetchAccounts();
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

            // Fetch live balance for each account
            for (const acct of accts) {
                if (acct.meterNo) {
                    fetchLiveDataForAccount(acct);
                }
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
            const balanceRes = await fetch(
                `/api/descoProxy?endpoint=getBalance&accountNo=${account.accountNo}&meterNo=${account.meterNo}`
            );
            if (balanceRes.ok) {
                const balanceData = await balanceRes.json();
                setAccounts((prev) =>
                    prev.map((a) =>
                        a.id === account.id
                            ? {
                                ...a,
                                liveBalance: balanceData.data?.balance ?? null,
                                liveConsumption: balanceData.data?.currentMonthConsumption ?? null,
                                loadingLive: false,
                            }
                            : a
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

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400 mt-1">
                        Welcome back, {session?.user?.name ?? 'User'}
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-green-600/20"
                >
                    + Add Account
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="text-center text-gray-400 py-12">
                    <p className="text-lg">Loading your accounts...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && accounts.length === 0 && (
                <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
                    <div className="text-6xl mb-4">⚡</div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        No DESCO accounts linked
                    </h2>
                    <p className="text-gray-400 mb-6">
                        Add your DESCO prepaid account number to start tracking
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
                    >
                        + Add Your First Account
                    </button>
                </div>
            )}

            {/* Account Cards Grid */}
            {!loading && accounts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.map((account) => (
                        <Link
                            key={account.id}
                            href={`/dashboard/accounts/${account.id}`}
                            className="group"
                        >
                            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-green-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-green-600/5">
                                {/* Label & Actions */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors">
                                            {account.label ?? `Account ${account.accountNo}`}
                                        </h3>
                                        <p className="text-sm text-gray-500">#{account.accountNo}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!account.meterNo && (
                                            <span className="text-xs bg-yellow-600/20 text-yellow-500 px-2 py-0.5 rounded">
                                                No Meter
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleRemoveAccount(account.id);
                                            }}
                                            className="text-gray-600 hover:text-red-400 transition-colors p-1"
                                            title="Remove account"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                {/* Balance */}
                                <div className="mb-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                        Current Balance
                                    </p>
                                    {account.loadingLive ? (
                                        <p className="text-2xl font-bold text-gray-600">৳ ...</p>
                                    ) : account.liveBalance !== undefined && account.liveBalance !== null ? (
                                        <p className="text-3xl font-bold text-green-400">
                                            ৳ {account.liveBalance.toFixed(2)}
                                        </p>
                                    ) : (
                                        <p className="text-2xl font-bold text-gray-600">৳ --</p>
                                    )}
                                </div>

                                {/* Consumption */}
                                <div className="flex items-center justify-between text-sm">
                                    <div>
                                        <p className="text-gray-500">This Month</p>
                                        <p className="text-white font-medium">
                                            {account.liveConsumption !== undefined && account.liveConsumption !== null
                                                ? `৳ ${account.liveConsumption.toFixed(2)}`
                                                : '--'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-500">Meter</p>
                                        <p className="text-white font-medium">
                                            {account.meterNo ?? 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Add Account Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6">Add DESCO Account</h2>

                        {addError && (
                            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4">
                                {addError}
                            </div>
                        )}

                        <form onSubmit={handleAddAccount} className="space-y-4">
                            <div>
                                <label htmlFor="addAccountNo" className="block text-sm font-medium text-gray-300 mb-1">
                                    Account Number *
                                </label>
                                <input
                                    id="addAccountNo"
                                    type="text"
                                    required
                                    value={newAccountNo}
                                    onChange={(e) => setNewAccountNo(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                                    placeholder="e.g. 25013973"
                                />
                            </div>

                            <div>
                                <label htmlFor="addMeterNo" className="block text-sm font-medium text-gray-300 mb-1">
                                    Meter Number (optional)
                                </label>
                                <input
                                    id="addMeterNo"
                                    type="text"
                                    value={newMeterNo}
                                    onChange={(e) => setNewMeterNo(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                                    placeholder="Auto-resolved if left blank"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave blank to auto-fetch from DESCO
                                </p>
                            </div>

                            <div>
                                <label htmlFor="addLabel" className="block text-sm font-medium text-gray-300 mb-1">
                                    Label (optional)
                                </label>
                                <input
                                    id="addLabel"
                                    type="text"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                                    placeholder="e.g. Home, Office"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setAddError(null);
                                        setNewMeterNo('');
                                    }}
                                    className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={adding}
                                    className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-500 disabled:bg-green-800 text-white font-semibold rounded-lg transition-colors"
                                >
                                    {adding ? 'Adding...' : 'Add Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
