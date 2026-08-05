export interface GroundingSource {
    title: string;
    uri: string;
}

export interface ApplianceData {
    identification: {
        brand: string;
        category: string;
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

export interface DiagnosticResult {
    issue: string;
    partName: string;
    partNumber: string;
    partPrice: number;
    laborHours: number;
    probability: string;
    description: string;
    verificationStatus?: 'model_part_verified' | 'targeted_part_search_verified' | 'price_only_unverified_fitment' | 'unverified' | string;
    verificationConfidence?: number;
    matchedPartNumber?: string | null;
    partPriceSource?: string | null;
    partPriceVerified?: boolean;
    partPricingUrl?: string | null;
    partAvailability?: string | null;
    contextWarnings?: string[];
    provenance?: GroundingSource[];
}
