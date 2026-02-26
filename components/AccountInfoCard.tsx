import React from 'react';

interface AccountInfoProps {
    meterNo: string;
    accountNo: string;
    currentMonthConsumption: number;
    readingTime: string;
}

const AccountInfoCard: React.FC<AccountInfoProps> = ({
    meterNo,
    accountNo,
    currentMonthConsumption,
    readingTime,
}) => {
    const items = [
        { label: 'Meter No', value: meterNo },
        { label: 'Account No', value: accountNo },
        { label: 'Monthly Consumption', value: `৳ ${currentMonthConsumption}` },
        { label: 'Last Reading', value: readingTime },
    ];

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mt-6">
            <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => (
                    <div key={item.label}>
                        <p className="text-sm text-gray-500 uppercase tracking-wider">
                            {item.label}
                        </p>
                        <p className="text-lg text-white font-medium mt-1">{item.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AccountInfoCard;
