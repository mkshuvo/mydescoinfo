'use client'
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { meterNoState, balanceState, dailyConsumptionState } from '../atoms/atoms';
// @ts-ignore
import { BalanceData } from '../Interfaces/getBalance';
// @ts-ignore
import { DailyConsumptionData, DailyConsumptionDifference } from '../Interfaces/getCustomerDailyConsumption';
// @ts-ignore
import { CustomerInfo } from '../Interfaces/getCustomerInfo';
import BalanceCard from "@/components/BalanceCard";
import ConsumptionCard from "@/components/ConsumptionCard";
import AccountInfoCard from "@/components/AccountInfoCard";
import ConsumptionTable from "@/components/ConsumptionTable";

const API_BASE_URL = 'http://prepaid.desco.org.bd/api/tkdes/customer/';

const DescoBill = () => {
    const [meterNo, setMeterNo] = useRecoilState<CustomerInfo['meterNo']>(meterNoState);
    const [balanceData, setBalanceData] = useRecoilState<BalanceData>(balanceState);
    // @ts-ignore
    const [dailyConsumptionData, setDailyConsumptionData] = useRecoilState<DailyConsumptionData[]>(dailyConsumptionState);
    const [dailyDifferences, setDailyDifferences] = useState<DailyConsumptionDifference[]>([]);
    const [recentConsumption, setRecentConsumption] = useState<number>(0);

    useEffect(() => {
        const fetchCustomerInfo = async () => {
            const response = await fetch(`${API_BASE_URL}getCustomerInfo?accountNo=25013973&meterNo=`);
            const data = await response.json();
            setMeterNo(data.data.meterNo);
        };

        fetchCustomerInfo();
    }, []);

    useEffect(() => {
        if (meterNo) {
            const fetchBalanceData = async () => {
                const response = await fetch(`${API_BASE_URL}getBalance?accountNo=25013973&meterNo=${meterNo}`);
                const data = await response.json();
                setBalanceData(data.data);
            };

            fetchBalanceData();
        }
    }, [meterNo]);

    useEffect(() => {
        if (meterNo) {
            const fetchDailyConsumptionData = async () => {
                const dateTo = new Date().toISOString().split('T')[0]; // Current date
                const dateFrom = new Date(); // Initialize with current date

                // Subtract 30 days from the current date to get the start date
                dateFrom.setDate(dateFrom.getDate() - 30);
                const formattedDateFrom = dateFrom.toISOString().split('T')[0];

                const response = await fetch(`${API_BASE_URL}getCustomerDailyConsumption?accountNo=25013973&meterNo=${meterNo}&dateFrom=${formattedDateFrom}&dateTo=${dateTo}`);
                const data = await response.json();
                setDailyConsumptionData(data.data);
            };

            fetchDailyConsumptionData();
        }
    }, [meterNo]);

    // Calculate daily consumption differences
    useEffect(() => {
        if (dailyConsumptionData && dailyConsumptionData.length > 1) {
            const differences = dailyConsumptionData.map((day, index) => {
                if (index === 0) return null; // Skip the first day as there is no previous day

                const difference = day.consumedTaka - dailyConsumptionData[index - 1].consumedTaka;
                const differenceUnit = day.consumedUnit - dailyConsumptionData[index -1].consumedUnit;
                return {
                    date: day.date,
                    difference: difference,
                    unitDifference: differenceUnit
                };
            }).filter(Boolean);

            setDailyDifferences(differences);
            if (differences.length > 0) {
                // @ts-ignore
                setRecentConsumption(differences[differences.length - 1].difference);
            }
        }
    }, [dailyConsumptionData]);

    return (
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <h1 className="text-5xl font-bold mb-4 ml-2">Customer Information</h1>
            <div className="grid grid-cols-12 gap-4">
                <BalanceCard balanceData={balanceData} />
                <ConsumptionCard  recentConsumption={recentConsumption}/>
            </div>

            <AccountInfoCard meterNo={balanceData.meterNo} accountNo={balanceData.accountNo} currentMonthConsumption={balanceData.currentMonthConsumption} readingTime={balanceData.readingTime} />


            <ConsumptionTable dailyDifferences={dailyDifferences} />
        </div>
    );
};

export default DescoBill;
