import React from 'react';
// @ts-ignore
import { BalanceData } from '../Interfaces/getBalance';

interface BalanceCardProps {
    balanceData: BalanceData;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balanceData }) => {
    return (
        <div className="col-span-6 md:col-span-6 px-2">
            <div className="flex bg-green-200 p-4 rounded-md shadow-lg">
                <div className="bg-yellow-400 w-2 h-30"></div>
                <div className="ml-4">
                    <h2 className="text-2xl text-black font-bold">Balance</h2>
                    <p className="text-9xl font-bold text-green-800">
                        ৳{balanceData.balance.toFixed(2)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BalanceCard;
