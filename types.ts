export interface GroundingSource {
    title: string;
    uri: string;
}

export interface ApplianceData {
    identification: {
        brand: string;
        category: string;
        model?: string;
        serial?: string;
        manufactureDateRange: string;
        manufactureDateLogic: string;
        manufactureYear: number;
        manufactureMonth: number;
        originalMSRP: string;
        confidence: number;
    };
    groundingSources: GroundingSource[];
}

export enum AppStatus {
    IDLE = 'IDLE',
    LOADING = 'LOADING',
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR'
}
