import React from 'react';

interface AccountInfoprops {
    meterNo: string;
    accountNo: string;
    currentMonthConsumption: number;
    readingTime: string;
}

const AccountInfoCard: React.FC<AccountInfoprops> = ({ meterNo, accountNo, currentMonthConsumption, readingTime }) => {
    return (
        <div className="flex flex-col md:flex-row">
            <div className="bg-green-200 text-black p-4 rounded-md shadow-lg w-full m-2">
                <div className="flex flex-col md:grid md:grid-cols-2 md:gap-4">
                    <div className="flex flex-col space-y-2">
                        <p className="font-semibold text-lg">Meter No:</p>
                        <p className="text-4xl">{meterNo}</p>
                    </div>
                    <div className="flex flex-col space-y-2">
                        <p className="font-semibold text-lg">Account No:</p>
                        <p className="text-4xl">{accountNo}</p>
                    </div>
                    <div className="flex flex-col space-y-2">
                        <p className="font-semibold text-lg">Current Month Consumption:</p>
                        <p className="text-4xl font-bold">৳{currentMonthConsumption}</p>
                    </div>
                    <div className="flex flex-col space-y-2">
                        <p className="font-semibold text-lg">Reading Time:</p>
                        <p className="text-4xl">{readingTime}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountInfoCard;
