export type ListingPlacement = 'website' | 'facebook' | 'ebay' | 'amazon';

export type ApplianceWarningSeverity = 'warning' | 'error';

export interface ApplianceWarning {
    code: string;
    severity: ApplianceWarningSeverity;
    message: string;
    field?: string;
}

export interface ApplianceProvenanceEntry {
    source: string;
    field: string;
    value?: string | number | boolean | null;
    note: string;
}

export interface ConfidenceSummary {
    score: number;
    level: 'high' | 'medium' | 'low';
}

export interface NormalizedApplianceIdentity {
    brand: string;
    model: string;
    serial: string;
    category: string;
    partNumbers: string[];
}

export interface PriceReference {
    suggestedPrice?: number;
    source?: string;
}

export interface MarketFloodValidationInput {
    id?: string;
    title?: string | null;
    brand?: string | null;
    model?: string | null;
    serial?: string | null;
    category?: string | null;
    condition?: string | null;
    price?: number | string | null;
    originalPrice?: number | string | null;
    ageMonths?: number | string | null;
    imageUrl?: string | null;
    imageUploadState?: 'idle' | 'ready' | 'uploading' | 'local-preview';
}

export interface MarketFloodValidationOptions {
    mode?: 'submit' | 'generation';
    priceReference?: PriceReference;
}

export interface MarketFloodValidationResult {
    normalized: NormalizedApplianceIdentity;
    warnings: ApplianceWarning[];
    hardInvalids: ApplianceWarning[];
    confidence: ConfidenceSummary;
    provenance: ApplianceProvenanceEntry[];
    canSubmit: boolean;
    canGenerate: boolean;
}
