import React from 'react';
import type { BalanceInfo } from '@/Interfaces/getBalance';

interface BalanceCardProps {
    balanceData: BalanceInfo | null;
    loading: boolean;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balanceData, loading }) => {
    if (loading) {
        return (
            <div className="bg-surface-container-low rounded-xl p-8 kinetic-glow">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-surface-container-highest rounded-lg">
                        <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
                    </div>
                    <h2 className="font-label text-sm text-on-surface-variant uppercase tracking-wider">Current Balance</h2>
                </div>
                <p className="text-5xl font-headline font-bold text-primary animate-pulse">৳ ...</p>
            </div>
        );
    }

    if (!balanceData) {
        return (
            <div className="bg-surface-container-low rounded-xl p-8 kinetic-glow">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-surface-container-highest rounded-lg">
                        <span className="material-symbols-outlined text-on-surface-variant text-xl">account_balance_wallet</span>
                    </div>
                    <h2 className="font-label text-sm text-on-surface-variant uppercase tracking-wider">Current Balance</h2>
                </div>
                <p className="text-5xl font-headline font-bold text-on-surface-variant">৳ 0.00</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-primary/20 to-surface-container-low rounded-xl p-8 border border-primary/10 kinetic-glow">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-surface-container-highest rounded-lg">
                    <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
                </div>
                <h2 className="font-label text-sm text-on-surface-variant uppercase tracking-wider">Current Balance</h2>
            </div>
            <p className="text-5xl font-headline font-bold text-on-surface">
                ৳ {balanceData.balance?.toFixed(2) ?? '0.00'}
            </p>
        </div>
    );
};

export default BalanceCard;
