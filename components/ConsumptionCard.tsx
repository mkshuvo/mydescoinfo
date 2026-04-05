import React from 'react';

interface ConsumptionCardProps {
    recentConsumption: number;
}

const ConsumptionCard: React.FC<ConsumptionCardProps> = ({ recentConsumption }) => {
    return (
        <div className="bg-gradient-to-br from-tertiary/20 to-surface-container-low rounded-xl p-8 border border-tertiary/10 kinetic-glow">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-surface-container-highest rounded-lg">
                    <span className="material-symbols-outlined text-tertiary text-xl">energy_savings_leaf</span>
                </div>
                <h2 className="font-label text-sm text-on-surface-variant uppercase tracking-wider">Hestern Cost</h2>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-tertiary font-headline text-2xl font-light">৳</span>
                <span className="text-5xl font-headline font-bold text-on-surface">{recentConsumption.toFixed(2)}</span>
            </div>
        </div>
    );
};

export default ConsumptionCard;
