interface BalanceInfoResponse {
    code: number;
    desc: string;
    data: BalanceInfo;
}

interface BalanceInfo {
    accountNo: string;
    meterNo: string;
    balance: number;
    currentMonthConsumption: number;
    readingTime: string;
}
