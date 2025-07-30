export interface DailyConsumptionResponse {
    code: number;
    desc: string;
    data: DailyConsumptionInfo[];
}

export interface DailyConsumptionInfo {
    accountNo: string;
    consumedTaka: number;
    consumedUnit: number;
    customerName: string;
    importReactiveEnergyIncrement: number;
    installationAddress: string;
    meterNo: string;
    date: string;
    phaseType: string;
    sanctionLoad: number;
    tariffSolution: string;
}

export interface DailyConsumptionDifference {
    date: string;
    difference: number;
    unitDifference: number;
}
