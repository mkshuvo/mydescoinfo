import React, { useState, useEffect } from 'react';
import { BalanceInfo } from '../Interfaces/getBalance';

interface BalanceCardProps {
    accountNo: string;
    meterNo: string;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ accountNo, meterNo }) => {
    const [balanceData, setBalanceData] = useState<BalanceInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `https://prepaid.desco.org.bd/api/tkdes/customer/getBalance?accountNo=${accountNo}&meterNo=${meterNo}`,
                    {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'Mozilla/5.0'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }

                const data = await response.json();
                if (data.code === 200 && data.data) {
                    setBalanceData(data.data);
                } else {
                    throw new Error('Invalid API response format');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch balance');
                console.error('Error fetching balance:', err);
            } finally {
                setLoading(false);
            }
        };

        if (accountNo && meterNo) {
            fetchBalance();
        }
    }, [accountNo, meterNo]);

    if (loading) {
        return (
            <div className="col-span-6 md:col-span-6 px-2">
                <div className="flex bg-blue-200 p-4 rounded-md shadow-lg">
                    <div className="bg-red-500 w-2 h-30"></div>
                    <div className="ml-4">
                        <h2 className="text-2xl text-black font-bold">Current Balance</h2>
                        <p className="text-9xl font-bold text-blue-800">
                            ৳...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="col-span-6 md:col-span-6 px-2">
                <div className="flex bg-red-200 p-4 rounded-md shadow-lg">
                    <div className="bg-red-500 w-2 h-30"></div>
                    <div className="ml-4">
                        <h2 className="text-2xl text-black font-bold">Current Balance</h2>
                        <p className="text-3xl font-bold text-red-800">
                            Error: {error}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!balanceData) {
        return (
            <div className="col-span-6 md:col-span-6 px-2">
                <div className="flex bg-blue-200 p-4 rounded-md shadow-lg">
                    <div className="bg-red-500 w-2 h-30"></div>
                    <div className="ml-4">
                        <h2 className="text-2xl text-black font-bold">Current Balance</h2>
                        <p className="text-9xl font-bold text-blue-800">
                            ৳0.00
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="col-span-6 md:col-span-6 px-2">
            <div className="flex bg-blue-200 p-4 rounded-md shadow-lg">
                <div className="bg-red-500 w-2 h-30"></div>
                <div className="ml-4">
                    <h2 className="text-2xl text-black font-bold">Current Balance</h2>
                    <p className="text-9xl font-bold text-blue-800">
                        ৳{balanceData.balance?.toFixed(2) || '0.00'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BalanceCard;
