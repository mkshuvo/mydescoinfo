import React from 'react';

interface ConsumptionCardProps {
    recentConsumption: number;
}

const ConsumptionCard: React.FC<ConsumptionCardProps> = ({ recentConsumption }) => {
    return (
        <div className="col-span-6 md:col-span-6 px-2">
            <div className="flex bg-green-200 p-4 rounded-md shadow-lg">
                <div className="bg-yellow-400 w-2 h-30"></div>
                <div className="ml-4">
                    <h2 className="text-2xl text-black font-bold">Consumed</h2>
                    <p className="text-9xl font-bold text-green-800">
                        ৳{recentConsumption.toFixed(2)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ConsumptionCard;
