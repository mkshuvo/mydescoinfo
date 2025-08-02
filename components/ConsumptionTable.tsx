import React from 'react';

interface DailyDifference {
    unitDifference: number;
    date: string;
    difference: number;
}

interface ConsumptionTableProps {
    dailyDifferences: DailyDifference[];
}

const ConsumptionTable: React.FC<ConsumptionTableProps> = ({ dailyDifferences }) => {
    const sortedDailyDifferences = [...dailyDifferences].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return (
        <div className="text-black text-4xl overflow-x-auto m-2">
            <h2 className="text-5xl font-bold mt-2 mb-1 text-blue-50">Daily Consumption Differences</h2>
            <table className="min-w-full bg-white border border-gray-300 rounded-md shadow-lg">
                <thead>
                <tr className="bg-gray-200 text-gray-700">
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Consumed Taka</th>
                    <th className="p-2 text-left">Consumed Unit</th>
                </tr>
                </thead>
                <tbody>
                {sortedDailyDifferences.map((dayDifference, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}>
                        <td className="p-2">{dayDifference.date}</td>
                        <td className="p-2">৳{dayDifference.difference.toFixed(2)}</td>
                        <td className="p-2">{dayDifference.unitDifference.toFixed(2)}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default ConsumptionTable;
