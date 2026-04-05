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
        { label: 'Meter No', value: meterNo, icon: 'speed' },
        { label: 'Account No', value: accountNo, icon: 'tag' },
        { label: 'Monthly Consumption', value: `৳ ${currentMonthConsumption.toFixed(2)}`, icon: 'bolt' },
        { label: 'Last Reading', value: readingTime, icon: 'schedule' },
    ];

    return (
        <div className="bg-surface-container-low rounded-xl p-6 mt-6 kinetic-glow">
            <h2 className="font-headline text-xl font-bold text-on-surface mb-6">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map((item) => (
                    <div key={item.label} className="border-l-4 border-primary pl-4">
                        <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest mb-1">
                            {item.label}
                        </p>
                        <p className="text-lg font-headline font-bold text-on-surface">{item.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AccountInfoCard;
