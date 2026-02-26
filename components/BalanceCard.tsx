import React from 'react';
import type { BalanceInfo } from '@/Interfaces/getBalance';

interface BalanceCardProps {
    balanceData: BalanceInfo | null;
    loading: boolean;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balanceData, loading }) => {
    if (loading) {
        return (
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/30 p-6 rounded-2xl shadow-lg">
                <h2 className="text-lg text-blue-300 font-semibold mb-2">Current Balance</h2>
                <p className="text-5xl font-bold text-blue-200 animate-pulse">৳ ...</p>
            </div>
        );
    }

    if (!balanceData) {
        return (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/30 p-6 rounded-2xl shadow-lg">
                <h2 className="text-lg text-gray-400 font-semibold mb-2">Current Balance</h2>
                <p className="text-5xl font-bold text-gray-600">৳ 0.00</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-700/30 p-6 rounded-2xl shadow-lg">
            <h2 className="text-lg text-green-300 font-semibold mb-2">Current Balance</h2>
            <p className="text-5xl font-bold text-green-400">
                ৳ {balanceData.balance?.toFixed(2) ?? '0.00'}
            </p>
        </div>
    );
};

export default BalanceCard;
