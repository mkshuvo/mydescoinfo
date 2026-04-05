'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { DescoAccount } from '@/lib/db/schema';
import { useDescoData } from '@/lib/hooks/useDescoData';

type Period = 7 | 30 | 90;

export default function UsageHistoryPage() {
    const params = useParams();
    const accountId = params.accountId as string;

    const [account, setAccount] = useState<DescoAccount | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<Period>(30);
    const [isSyncing, setIsSyncing] = useState(false);

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
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAccount();
    }, [accountId]);

    const {
        dailyDifferences,
        loadingConsumption,
        errorConsumption,
        refetch,
    } = useDescoData(
        account?.accountNo ?? null,
        account?.meterNo ?? null,
        accountId
    );

    const handleSync = async () => {
        if (!account?.accountNo || !account?.meterNo) return;

        setIsSyncing(true);
        try {
            const res = await fetch(`/api/accounts/${accountId}/sync`, { method: 'POST' });
            if (res.ok) {
                refetch();
            }
        } catch (err) {
            console.error('Sync failed:', err);
        } finally {
            setIsSyncing(false);
        }
    };

    // Filter data based on period - take the LAST N days (most recent), then sort ascending for display
    const filteredData = [...dailyDifferences]
        .slice(-period)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate stats
    const totalConsumption = filteredData.reduce((sum, d) => sum + d.difference, 0);
    const avgDaily = filteredData.length > 0 ? totalConsumption / filteredData.length : 0;
    const peakDay = filteredData.length > 0
        ? filteredData.reduce((max, d) => d.difference > max.difference ? d : max)
        : null;

    // Heaviest usage days
    const heaviestDays = [...dailyDifferences]
        .sort((a, b) => b.difference - a.difference)
        .slice(0, 5);

    // Chart data - take up to 30 days
    const chartData = filteredData.slice(-Math.min(period, 30));
    const maxValue = chartData.length > 0 ? Math.max(...chartData.map(d => Math.abs(d.difference)), 1) : 1;

    if (loading) {
        return (
            <div className="mx-auto max-w-7xl px-6 py-12 text-center">
                <div className="flex items-center justify-center gap-3 text-on-surface-variant">
                    <div className="w-3 h-3 bg-primary rounded-full pulse-dot"></div>
                    <span className="font-label uppercase tracking-wider">Loading analytics...</span>
                </div>
            </div>
        );
    }

    if (!account) {
        return (
            <div className="mx-auto max-w-7xl px-6 py-12 text-center">
                <p className="text-error font-headline">Account not found</p>
                <Link href="/dashboard" className="text-primary mt-4 inline-block">← Back to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-6 py-12">
            {/* Back Navigation & Title */}
            <div className="mb-12 flex flex-col gap-4">
                <Link
                    href={`/dashboard/accounts/${accountId}`}
                    className="flex items-center gap-2 text-primary hover:gap-3 transition-all duration-300 w-fit group"
                >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    <span className="font-label font-medium uppercase tracking-widest text-xs">Return to Meter Details</span>
                </Link>

                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="font-headline text-5xl font-bold tracking-tighter text-on-surface">Usage History</h1>
                        <p className="font-body text-on-surface-variant mt-2 max-w-xl">
                            Comprehensive analysis of energy consumption over the previous 30-day billing cycle.
                        </p>
                    </div>

                    {/* Period Selector */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPeriod(7)}
                            className={`px-4 py-2 rounded-lg text-sm font-label font-bold transition-colors ${
                                period === 7
                                    ? 'bg-primary text-on-primary'
                                    : 'bg-surface-container-highest text-on-surface hover:bg-surface-bright'
                            }`}
                        >
                            7 Days
                        </button>
                        <button
                            onClick={() => setPeriod(30)}
                            className={`px-4 py-2 rounded-lg text-sm font-label font-bold transition-colors ${
                                period === 30
                                    ? 'bg-primary text-on-primary'
                                    : 'bg-surface-container-highest text-on-surface hover:bg-surface-bright'
                            }`}
                        >
                            30 Days
                        </button>
                        <button
                            onClick={() => setPeriod(90)}
                            className={`px-4 py-2 rounded-lg text-sm font-label font-bold transition-colors ${
                                period === 90
                                    ? 'bg-primary text-on-primary'
                                    : 'bg-surface-container-highest text-on-surface hover:bg-surface-bright'
                            }`}
                        >
                            90 Days
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {errorConsumption && (
                <div className="bg-error/10 border-l-4 border-error text-error px-4 py-3 rounded-lg mb-6">
                    <p className="font-label text-sm uppercase tracking-wider">{errorConsumption}</p>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-8">
                {/* Hero Stats Row (Bento Style) */}
                <div className="col-span-12 lg:col-span-4 bg-surface-container-low p-8 rounded-xl flex flex-col justify-between">
                    <div>
                        <span className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant">Total Consumption</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="font-headline text-6xl font-bold tracking-tighter text-primary">{totalConsumption.toFixed(1)}</span>
                            <span className="font-headline text-xl text-on-surface-variant">kWh</span>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-outline-variant/10">
                        <div className="flex items-center gap-2 text-error">
                            <span className="material-symbols-outlined text-sm">trending_up</span>
                            <span className="font-label text-sm font-bold">+12.4% vs last period</span>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-surface-container-low p-8 rounded-xl flex flex-col justify-between">
                    <div>
                        <span className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant">Peak Demand</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="font-headline text-6xl font-bold tracking-tighter text-on-surface">{peakDay ? peakDay.difference.toFixed(1) : '0.0'}</span>
                            <span className="font-headline text-xl text-on-surface-variant">kWh/day</span>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-outline-variant/10">
                        <span className="font-body text-sm text-on-surface-variant italic">
                            {peakDay ? `Recorded on ${peakDay.date}` : 'No data'}
                        </span>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-surface-container-low p-8 rounded-xl flex flex-col justify-between border-l-4 border-tertiary">
                    <div>
                        <span className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant">Estimated Cost</span>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="font-headline text-6xl font-bold tracking-tighter text-tertiary">৳ {totalConsumption.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-outline-variant/10">
                        <div className="flex items-center gap-2 text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm">info</span>
                            <span className="font-label text-sm">Avg ৳{avgDaily.toFixed(2)}/day</span>
                        </div>
                    </div>
                </div>

                {/* Large Consumption Chart */}
                <div className="col-span-12 bg-surface-container p-8 rounded-xl min-h-[400px] relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-primary rounded-full"></div>
                                <span className="font-label text-sm font-bold">Electricity Consumption</span>
                            </div>
                        </div>

                        {/* Sync Button */}
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="bg-surface-container-highest text-on-surface px-4 py-2 rounded-lg font-label font-bold hover:bg-surface-bright transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSyncing ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm">sync</span>
                                    Sync
                                </>
                            )}
                        </button>
                    </div>

                    {/* Chart Area */}
                    {loadingConsumption ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="flex items-center gap-3 text-on-surface-variant">
                                <div className="w-3 h-3 bg-primary rounded-full pulse-dot"></div>
                                <span className="font-label uppercase tracking-wider">Loading data...</span>
                            </div>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-4">bar_chart</span>
                                <p className="font-label text-on-surface-variant uppercase tracking-wider">No consumption data available</p>
                                <button
                                    onClick={handleSync}
                                    className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg font-label text-sm font-bold hover:opacity-90 transition-all"
                                >
                                    Sync Data
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative h-64">
                            {/* Y-axis grid lines */}
                            <div className="absolute inset-0 chart-grid pointer-events-none" style={{
                                backgroundImage: 'linear-gradient(to bottom, rgba(71, 73, 65, 0.1) 1px, transparent 1px)',
                                backgroundSize: '100% 40px'
                            }}></div>

                            {/* Bar Chart - always visible with data or placeholder */}
                            <div className="absolute inset-0 flex items-end gap-[2px] px-2">
                                {chartData.length === 0 ? (
                                    // Show placeholder bars when no data
                                    Array.from({ length: 15 }).map((_, i) => (
                                        <div
                                            key={`placeholder-${i}`}
                                            className="flex-1 bg-primary/20 rounded-t"
                                            style={{ height: '15%' }}
                                        ></div>
                                    ))
                                ) : (
                                    chartData.map((day, index) => {
                                        // Normalize height - use logarithmic scale for better visibility
                                        const rawValue = Math.abs(day.difference);
                                        const heightPercent = rawValue > 0 ? Math.max((rawValue / maxValue) * 100, 5) : 5;
                                        const isToday = index === chartData.length - 1;
                                        return (
                                            <div
                                                key={day.date}
                                                className="flex-1 group/bar cursor-pointer relative flex flex-col justify-end"
                                                style={{ height: '100%' }}
                                            >
                                                {/* Bar - always show with minimum height */}
                                                <div
                                                    className={`w-full rounded-t transition-all duration-300 group-hover/bar:opacity-80 ${
                                                        isToday ? 'bg-primary shadow-[0_0_12px_rgba(142,229,32,0.4)]' : 'bg-primary/70'
                                                    }`}
                                                    style={{ height: `${heightPercent}%` }}
                                                    title={`${day.date}: ${day.difference.toFixed(2)} kWh`}
                                                ></div>
                                                {/* Hover tooltip */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-10">
                                                    <div className="bg-surface-container-highest px-3 py-2 rounded-lg shadow-lg whitespace-nowrap border border-outline-variant/20">
                                                        <p className="font-label text-xs text-on-surface-variant uppercase">{day.date}</p>
                                                        <p className="font-headline text-sm font-bold text-primary">{day.difference.toFixed(2)} kWh</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {/* X-axis labels */}
                    <div className="flex justify-between mt-4 text-on-surface-variant font-label text-xs uppercase tracking-wider">
                        <span>{chartData[0]?.date ?? ''}</span>
                        <span>{chartData[Math.floor(chartData.length / 2)]?.date ?? ''}</span>
                        <span>{chartData[chartData.length - 1]?.date ?? ''}</span>
                    </div>
                </div>

                {/* Efficiency Insight */}
                <div className="col-span-12 lg:col-span-6 bg-surface-container-low p-8 rounded-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-surface-container-highest rounded-lg">
                            <span className="material-symbols-outlined text-tertiary text-xl">energy_savings_leaf</span>
                        </div>
                        <h2 className="font-headline text-xl font-bold text-on-surface">Efficiency Insight</h2>
                    </div>
                    <div className="bg-surface-container-high/50 rounded-lg p-4">
                        <p className="text-on-surface font-body">
                            Your average daily consumption of{' '}
                            <span className="text-primary font-bold">৳ {avgDaily.toFixed(2)}</span>
                            {' '}is{' '}
                            {avgDaily < 150 ? (
                                <>
                                    <span className="text-tertiary font-bold">below average</span> compared to similar accounts in your region.
                                </>
                            ) : (
                                <>
                                    <span className="text-error font-bold">above average</span>. Consider implementing energy-saving measures.
                                </>
                            )}
                        </p>
                    </div>
                    {peakDay && (
                        <div className="mt-6 pt-6 border-t border-outline-variant/10">
                            <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest mb-1">
                                Peak Usage Day
                            </p>
                            <p className="font-headline text-lg font-bold text-on-surface">
                                {peakDay.date} — ৳ {peakDay.difference.toFixed(2)}
                            </p>
                        </div>
                    )}
                </div>

                {/* Heaviest Usage Days */}
                <div className="col-span-12 lg:col-span-6 bg-surface-container-low p-8 rounded-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-surface-container-highest rounded-lg">
                            <span className="material-symbols-outlined text-error text-xl">keyboard_arrow_down</span>
                        </div>
                        <h2 className="font-headline text-xl font-bold text-on-surface">Heaviest Usage Days</h2>
                    </div>
                    {heaviestDays.length === 0 ? (
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-2">event_note</span>
                            <p className="font-label text-on-surface-variant uppercase tracking-wider">No data available</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {heaviestDays.map((day, index) => (
                                <div
                                    key={day.date}
                                    className="flex items-center justify-between bg-surface-container-high/50 rounded-lg p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-surface-container-highest rounded flex items-center justify-center font-label text-xs text-on-surface-variant">
                                            {index + 1}
                                        </span>
                                        <span className="font-body text-on-surface">{day.date}</span>
                                    </div>
                                    <span className="font-headline font-bold text-primary">৳ {day.difference.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
