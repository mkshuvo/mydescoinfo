export interface CustomerInfoResponse {
    code: number;
    desc: string;
    data: CustomerInfo;
}

export interface CustomerInfo {
    accountNo: string;
    contactNo: string;
    customerName: string;
    feederName: string;
    installationAddress: string;
    installationDate: string;
    meterNo: string;
    phaseType: string;
    registerDate: string;
    sanctionLoad: number;
    tariffSolution: string;
    meterModel: string | null;
    transformer: string | null;
    SDName: string;
}
