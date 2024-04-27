interface DailyConsumptionResponse {
    code: number;
    desc: string;
    data: DailyConsumptionInfo[];
}

interface DailyConsumptionInfo {
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
