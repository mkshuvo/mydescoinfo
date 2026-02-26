import React from 'react';

interface ConsumptionCardProps {
    recentConsumption: number;
}

const ConsumptionCard: React.FC<ConsumptionCardProps> = ({ recentConsumption }) => {
    return (
        <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 border border-amber-700/30 p-6 rounded-2xl shadow-lg">
            <h2 className="text-lg text-amber-300 font-semibold mb-2">Yesterday&apos;s Consumption</h2>
            <p className="text-5xl font-bold text-amber-400">
                ৳ {recentConsumption.toFixed(2)}
            </p>
        </div>
    );
};

export default ConsumptionCard;
