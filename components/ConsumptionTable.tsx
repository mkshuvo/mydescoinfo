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
        <div className="mt-6 overflow-x-auto">
            <h2 className="text-2xl font-bold mb-4 text-white">Daily Consumption</h2>
            <table className="min-w-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <thead>
                    <tr className="bg-gray-800 text-gray-300 text-sm uppercase tracking-wider">
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-right">Consumed (৳)</th>
                        <th className="px-4 py-3 text-right">Consumed (kWh)</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((day, index) => (
                        <tr
                            key={day.date}
                            className={`border-t border-gray-800 ${index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/50'
                                } hover:bg-gray-800/50 transition-colors`}
                        >
                            <td className="px-4 py-3 text-gray-300">{day.date}</td>
                            <td className="px-4 py-3 text-right text-green-400 font-medium">
                                ৳ {day.difference.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-blue-400 font-medium">
                                {day.unitDifference.toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ConsumptionTable;
