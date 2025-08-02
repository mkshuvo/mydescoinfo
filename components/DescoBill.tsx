'use client'
import { useEffect, useState, useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { meterNoState, balanceState, dailyConsumptionState } from '../atoms/atoms';
import { BalanceInfo } from '../Interfaces/getBalance';
import { DailyConsumptionInfo, DailyConsumptionDifference } from '../Interfaces/getCustomerDailyConsumption';
import { CustomerInfo } from '../Interfaces/getCustomerInfo';
import BalanceCard from "@/components/BalanceCard";
import ConsumptionCard from "@/components/ConsumptionCard";
import AccountInfoCard from "@/components/AccountInfoCard";
import ConsumptionTable from "@/components/ConsumptionTable";

const PROXY_API_BASE_URL = '/api/descoProxy';
const DEFAULT_ACCOUNT_NO = '25013973';
const INITIAL_METER_NO_FOR_INFO_FETCH = '661120112198'; // Used for initial customer info fetch

interface ApiResponse<T> {
    data: T;
    message?: string; // Optional error message from proxy
}

const DescoBill = () => {
    const [meterNo, setMeterNo] = useRecoilState<CustomerInfo['meterNo'] | null>(meterNoState);
    const [balanceData, setBalanceData] = useRecoilState<BalanceInfo | null>(balanceState);
    const [dailyConsumptionData, setDailyConsumptionData] = useRecoilState<DailyConsumptionInfo[] | null>(dailyConsumptionState);
    
    const [dailyDifferences, setDailyDifferences] = useState<any[]>([]);
    const [recentConsumption, setRecentConsumption] = useState<number>(0);

    const [loadingCustomerInfo, setLoadingCustomerInfo] = useState<boolean>(true);
    const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
    const [loadingConsumption, setLoadingConsumption] = useState<boolean>(false);
    const [usingScrapedData, setUsingScrapedData] = useState<boolean>(false);

    const [errorCustomerInfo, setErrorCustomerInfo] = useState<string | null>(null);
    const [errorBalance, setErrorBalance] = useState<string | null>(null);
    const [errorConsumption, setErrorConsumption] = useState<string | null>(null);

    // API Fetching Functions
    const fetchCustomerInfoFromApi = useCallback(async (accountNo: string, meterNoForApi: string): Promise<CustomerInfo> => {
        const response = await fetch(`${PROXY_API_BASE_URL}?endpoint=getCustomerInfo&accountNo=${accountNo}&meterNo=${meterNoForApi}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to fetch customer info: ${response.status}`);
        }
        const result: ApiResponse<CustomerInfo> = await response.json();
        if (result.data && result.data.meterNo) {
            return result.data;
        } else {
            throw new Error(result.message || 'Customer info not found or meterNo missing in response');
        }
    }, []);

    const fetchBalanceDataFromApi = useCallback(async (accountNo: string, meterNoForApi: string): Promise<BalanceInfo> => {
        const response = await fetch(`${PROXY_API_BASE_URL}?endpoint=getBalance&accountNo=${accountNo}&meterNo=${meterNoForApi}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to fetch balance data: ${response.status}`);
        }
        const result: ApiResponse<BalanceInfo> = await response.json();
        if (result.data) {
            return result.data;
        } else {
            throw new Error(result.message || 'Balance data not found in response');
        }
    }, []);

    const fetchDailyConsumptionDataFromApi = useCallback(async (accountNo: string, meterNoForApi: string, dateFrom: string, dateTo: string): Promise<DailyConsumptionInfo[]> => {
        const dateToFormatted = new Date(dateTo).toISOString().split('T')[0];
        const dateFromFormatted = new Date(dateFrom).toISOString().split('T')[0];
        const response = await fetch(`${PROXY_API_BASE_URL}?endpoint=getCustomerDailyConsumption&accountNo=${accountNo}&meterNo=${meterNoForApi}&dateFrom=${dateFromFormatted}&dateTo=${dateToFormatted}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to fetch daily consumption: ${response.status}`);
        }
        const result: ApiResponse<DailyConsumptionInfo[]> = await response.json();
        if (result.data) {
            return result.data;
        } else {
            throw new Error(result.message || 'Daily consumption data not found in response');
        }
    }, []);

    // Scraping fallback functions
    const scrapeDataAsFallback = useCallback(async (accountNo: string): Promise<{
        customerInfo: CustomerInfo;
        balance: BalanceInfo;
        dailyConsumption: DailyConsumptionInfo[];
    }> => {
        console.log('[SCRAPER] API failed, attempting to scrape data...');
        
        const response = await fetch('/api/descoScraper', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accountNo }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Scraping failed: ${response.status}`);
        }

        const scrapedData = await response.json();
        setUsingScrapedData(true);
        
        // Map scraped data to expected interfaces
        return {
            customerInfo: {
                accountNo: scrapedData.customerInfo.accountNo,
                contactNo: scrapedData.customerInfo.contactNo,
                customerName: scrapedData.customerInfo.customerName,
                feederName: scrapedData.customerInfo.feederName,
                installationAddress: scrapedData.customerInfo.installationAddress,
                installationDate: scrapedData.customerInfo.installationDate,
                meterNo: scrapedData.customerInfo.meterNo,
                phaseType: scrapedData.customerInfo.phaseType,
                registerDate: scrapedData.customerInfo.registerDate,
                sanctionLoad: scrapedData.customerInfo.sanctionLoad,
                tariffSolution: scrapedData.customerInfo.tariffSolution,
                meterModel: scrapedData.customerInfo.meterModel,
                transformer: scrapedData.customerInfo.transformer,
                SDName: scrapedData.customerInfo.SDName
            },
            balance: {
                accountNo: scrapedData.balance.accountNo,
                meterNo: scrapedData.balance.meterNo,
                balance: scrapedData.balance.balance,
                currentMonthConsumption: scrapedData.balance.currentMonthConsumption,
                readingTime: scrapedData.balance.readingTime
            },
            dailyConsumption: scrapedData.dailyConsumption.map((item: any) => ({
                accountNo: item.accountNo,
                meterNo: item.meterNo,
                consumedTaka: item.consumedTaka,
                consumedUnit: item.consumedUnit,
                customerName: item.customerName,
                date: item.date,
                importReactiveEnergyIncrement: item.importReactiveEnergyIncrement,
                installationAddress: scrapedData.customerInfo.installationAddress,
                phaseType: scrapedData.customerInfo.phaseType,
                sanctionLoad: scrapedData.customerInfo.sanctionLoad,
                tariffSolution: scrapedData.customerInfo.tariffSolution
            }))
        };
    }, [setUsingScrapedData]);

    useEffect(() => {
        const loadCustomerInfo = async () => {
            setLoadingCustomerInfo(true);
            setErrorCustomerInfo(null);
            try {
                const customerData = await fetchCustomerInfoFromApi(DEFAULT_ACCOUNT_NO, INITIAL_METER_NO_FOR_INFO_FETCH);
                setMeterNo(customerData.meterNo);
            } catch (err: any) {
                console.warn("API failed for customer info, trying scraper...", err);
                try {
                    const scrapedData = await scrapeDataAsFallback(DEFAULT_ACCOUNT_NO);
                    setMeterNo(scrapedData.customerInfo.meterNo);
                    // Also set other data since we have it from scraping
                    setBalanceData(scrapedData.balance);
                    setDailyConsumptionData(scrapedData.dailyConsumption);
                } catch (scrapeErr: any) {
                    setErrorCustomerInfo(scrapeErr.message || 'An unexpected error occurred while fetching customer info.');
                    console.error("Error fetching customer info:", scrapeErr);
                }
            }
            setLoadingCustomerInfo(false);
        };

        loadCustomerInfo();
    }, [fetchCustomerInfoFromApi, scrapeDataAsFallback, setMeterNo, setBalanceData, setDailyConsumptionData]);

    useEffect(() => {
        if (meterNo) {
            const loadBalanceData = async () => {
                setLoadingBalance(true);
                setErrorBalance(null);
                try {
                    const newBalanceData = await fetchBalanceDataFromApi(DEFAULT_ACCOUNT_NO, meterNo);
                    setBalanceData(newBalanceData);
                } catch (err: any) {
                    console.warn("API failed for balance data, trying scraper...", err);
                    try {
                        const scrapedData = await scrapeDataAsFallback(DEFAULT_ACCOUNT_NO);
                        setBalanceData(scrapedData.balance);
                    } catch (scrapeErr: any) {
                        setErrorBalance(scrapeErr.message || 'An unexpected error occurred while fetching balance data.');
                        console.error("Error fetching balance data:", scrapeErr);
                    }
                }
                setLoadingBalance(false);
            };

            loadBalanceData();
        }
    }, [meterNo, fetchBalanceDataFromApi, scrapeDataAsFallback, setBalanceData]);

    useEffect(() => {
        if (meterNo) {
            const loadDailyConsumptionData = async () => {
                setLoadingConsumption(true);
                setErrorConsumption(null);
                try {
                    const dateTo = new Date().toISOString().split('T')[0];
                    const dateFrom = new Date();
                    dateFrom.setDate(dateFrom.getDate() - 30);
                    const formattedDateFrom = dateFrom.toISOString().split('T')[0];

                    const newDailyConsumptionData = await fetchDailyConsumptionDataFromApi(DEFAULT_ACCOUNT_NO, meterNo, formattedDateFrom, dateTo);
                    setDailyConsumptionData(newDailyConsumptionData);
                } catch (err: any) {
                    console.warn("API failed for daily consumption, trying scraper...", err);
                    try {
                        const scrapedData = await scrapeDataAsFallback(DEFAULT_ACCOUNT_NO);
                        setDailyConsumptionData(scrapedData.dailyConsumption);
                    } catch (scrapeErr: any) {
                        setErrorConsumption(scrapeErr.message || 'An unexpected error occurred while fetching daily consumption.');
                        console.error("Error fetching daily consumption:", scrapeErr);
                    }
                }
                setLoadingConsumption(false);
            };

            loadDailyConsumptionData();
        }
    }, [meterNo, fetchDailyConsumptionDataFromApi, scrapeDataAsFallback, setDailyConsumptionData]);

    // Calculate daily consumption values
    useEffect(() => {
        if (dailyConsumptionData && dailyConsumptionData.length > 0) {
            // Sort data by date to ensure correct order
            const sortedData = [...dailyConsumptionData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            const dailyValues = sortedData.map((day, index) => {
                const currentDate = new Date(day.date);
                const isFirstDayOfMonth = currentDate.getDate() === 1;
                
                // Handle taka difference - resets on 1st of each month
                let takaDifference;
                if (isFirstDayOfMonth) {
                    takaDifference = day.consumedTaka;
                } else {
                    const prevDay = sortedData[index - 1];
                    if (prevDay) {
                        const prevDate = new Date(prevDay.date);
                        const isPrevDaySameMonth = prevDate.getMonth() === currentDate.getMonth();
                        takaDifference = isPrevDaySameMonth ? day.consumedTaka - prevDay.consumedTaka : day.consumedTaka;
                    } else {
                        takaDifference = day.consumedTaka;
                    }
                }
                
                // Handle unit difference - always calculate from previous day regardless of month
                let unitDifference;
                const prevDay = sortedData[index - 1];
                if (prevDay) {
                    unitDifference = day.consumedUnit - prevDay.consumedUnit;
                } else {
                    // First entry - show actual consumption as difference
                    unitDifference = day.consumedUnit;
                }
                
                return {
                    date: day.date,
                    difference: takaDifference,
                    unitDifference: unitDifference
                };
            });
            
            setDailyDifferences(dailyValues);
            
            // Set recent consumption to the last day's taka difference (monetary value)
            if (dailyValues.length > 0) {
                setRecentConsumption(dailyValues[dailyValues.length - 1].difference);
            }
        } else {
            setDailyDifferences([]);
            setRecentConsumption(0);
        }
    }, [dailyConsumptionData]);

    // Display loading states and error messages
    if (loadingCustomerInfo) return <div className="p-4 text-center">Loading customer information...</div>;
    if (errorCustomerInfo) return <div className="p-4 text-center text-red-500">Error: {errorCustomerInfo}</div>;
    if (!meterNo) return <div className="p-4 text-center">Meter number not available. Cannot fetch further details.</div>

    return (
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <h1 className="text-5xl font-bold mb-4 ml-2">Customer Information</h1>
            {usingScrapedData && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
                    <p className="font-bold">⚠️ Using Scraped Data</p>
                    <p>Data is being fetched from the website as the API is unavailable.</p>
                </div>
            )}
            
            {/* Balance and Consumption Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    {loadingBalance && <p>Loading balance...</p>}
                    {errorBalance && <p className="text-red-500">Error loading balance: {errorBalance}</p>}
                    {(meterNo && DEFAULT_ACCOUNT_NO) && <BalanceCard accountNo={DEFAULT_ACCOUNT_NO} meterNo={meterNo} />}
                </div>
                <div>
                    {loadingConsumption && <p>Loading consumption...</p>}
                    {/* ConsumptionCard might need its own loading/error or rely on recentConsumption being 0/updated */}
                    <ConsumptionCard recentConsumption={recentConsumption} />
                </div>
            </div>

            {/* Account Info Card */}
            {balanceData && (
                <AccountInfoCard 
                    meterNo={balanceData.meterNo} 
                    accountNo={balanceData.accountNo} 
                    currentMonthConsumption={balanceData.currentMonthConsumption} 
                    readingTime={balanceData.readingTime} 
                />
            )}
            {!balanceData && !loadingBalance && !errorBalance && <p>No balance data to display account information.</p>}

            {/* Consumption Table */}
            {loadingConsumption && <p className="mt-4 text-center">Loading daily consumption data...</p>}
            {errorConsumption && <p className="mt-4 text-center text-red-500">Error loading consumption data: {errorConsumption}</p>}
            {dailyDifferences.length > 0 && <ConsumptionTable dailyDifferences={dailyDifferences} />}
            {!loadingConsumption && !errorConsumption && dailyConsumptionData && dailyConsumptionData.length === 0 && <p className="mt-4 text-center">No daily consumption data available for the selected period.</p>}
            {!loadingConsumption && !errorConsumption && dailyConsumptionData && dailyConsumptionData.length === 1 && <p className="mt-4 text-center">Only one day of consumption data available; differences cannot be calculated.</p>}
        </div>
    );
};

export default DescoBill;
