import type {
    DailyConsumptionInfo,
    DailyConsumptionDifference,
} from '@/Interfaces/getCustomerDailyConsumption';

/**
 * Calculates daily taka/unit differences from cumulative consumption data.
 *
 * Taka resets on the 1st of each month (cumulative within the month).
 * Unit difference is always calculated from the previous day regardless of month boundary.
 */
export function calculateDailyDifferences(
    data: DailyConsumptionInfo[]
): DailyConsumptionDifference[] {
    if (data.length === 0) return [];

    const sortedData = [...data].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sortedData.map((day, index) => {
        const currentDate = new Date(day.date);
        const isFirstDayOfMonth = currentDate.getDate() === 1;
        const prevDay = sortedData[index - 1];

        // Taka difference — resets on 1st of each month
        let takaDifference: number;
        if (isFirstDayOfMonth || !prevDay) {
            takaDifference = day.consumedTaka;
        } else {
            const prevDate = new Date(prevDay.date);
            const isSameMonth = prevDate.getMonth() === currentDate.getMonth();
            takaDifference = isSameMonth
                ? day.consumedTaka - prevDay.consumedTaka
                : day.consumedTaka;
        }

        // Unit difference — always from previous day
        const unitDifference = prevDay
            ? day.consumedUnit - prevDay.consumedUnit
            : day.consumedUnit;

        return {
            date: day.date,
            difference: takaDifference,
            unitDifference,
        };
    });
}
