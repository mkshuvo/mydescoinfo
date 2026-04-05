import React from 'react';
import type { DailyConsumptionDifference } from '@/Interfaces/getCustomerDailyConsumption';

interface ConsumptionTableProps {
    dailyDifferences: DailyConsumptionDifference[];
}

const ConsumptionTable: React.FC<ConsumptionTableProps> = ({ dailyDifferences }) => {
    const sorted = [...dailyDifferences].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <div className="mt-6 bg-surface-container-low rounded-xl overflow-hidden kinetic-glow">
            <div className="p-6 border-b border-outline-variant/10">
                <h2 className="font-headline text-2xl font-bold text-on-surface">Daily Consumption</h2>
            </div>
            <div className="overflow-x-auto max-h-96 custom-scrollbar">
                <table className="min-w-full">
                    <thead className="sticky top-0 bg-surface-container">
                        <tr className="text-on-surface-variant text-sm uppercase tracking-widest">
                            <th className="px-6 py-4 text-left font-label">Date</th>
                            <th className="px-6 py-4 text-right font-label">Consumed (৳)</th>
                            <th className="px-6 py-4 text-right font-label">Consumed (kWh)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((day, index) => (
                            <tr
                                key={day.date}
                                className={`border-t border-outline-variant/10 transition-colors ${
                                    index % 2 === 0 ? 'bg-surface-container-low' : 'bg-surface-container-low/50'
                                } hover:bg-surface-container-high`}
                            >
                                <td className="px-6 py-4 text-on-surface font-body">{day.date}</td>
                                <td className="px-6 py-4 text-right text-primary font-headline font-bold">
                                    ৳ {day.difference.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right text-tertiary font-headline font-bold">
                                    {day.unitDifference.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ConsumptionTable;
