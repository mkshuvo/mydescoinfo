import React from 'react';

interface QuickStatsProps {
    totalSpend?: number;
    lowBalanceMeters?: number;
    peakUsageAlerts?: number;
}

const QuickStats: React.FC<QuickStatsProps> = ({
    totalSpend = 0,
    lowBalanceMeters = 0,
    peakUsageAlerts = 0,
}) => {
    return (
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface-container-high rounded-xl p-6 border-l-4 border-primary">
                <p className="text-on-surface-variant font-label text-sm mb-2">Total daily Spend</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-primary font-headline text-xl">৳</span>
                    <span className="text-4xl font-headline font-bold tracking-tight">
                        {totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>
            <div className="bg-surface-container-high rounded-xl p-6 border-l-4 border-tertiary">
                <p className="text-on-surface-variant font-label text-sm mb-2">Low Balance Meters</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-headline font-bold tracking-tight">{lowBalanceMeters}</span>
                    <span className="text-tertiary font-headline text-xl">
                        {lowBalanceMeters === 1 ? 'meter' : 'meters'}
                    </span>
                </div>
            </div>
            <div className="bg-surface-container-high rounded-xl p-6 border-l-4 border-error">
                <p className="text-on-surface-variant font-label text-sm mb-2">Peak Usage Alerts</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-headline font-bold tracking-tight">{peakUsageAlerts}</span>
                    <span className="text-on-surface-variant font-headline text-xl">
                        {peakUsageAlerts === 0 ? 'All Normal' : 'detected'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default QuickStats;
