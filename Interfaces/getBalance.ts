export interface BalanceInfoResponse {
    code: number;
    desc: string;
    data: BalanceInfo;
}

export interface BalanceInfo {
    accountNo: string;
    meterNo: string;
    balance: number;
    currentMonthConsumption: number;
    readingTime: string;
}
