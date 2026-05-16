
// Resale Calculator Valuation Adapter
// Single source of truth: delegates to the shared Flood Engine pricing engine.
// UI compatibility: maintains the same ValuationResult / BRANDS / CONDITIONS shape.

import {
    calculateResaleValue,
    type PricingInputs,
} from "@/lib/flood-engine/services/pricingEngine";

export interface PartInput {
    id: string;
    name: string;
    cost: number;   // in dollars
    recovery: number; // 0-1
}

export interface ValuationResult {
    finalValue: number;    // cents
    baseValue: number;     // cents
    partsAddback: number;  // cents
    salvageValue: number;  // cents
    dEffBps: number;
    ageMonths: number;
    audit: AuditTrace;
}

export interface AuditLog {
    step: string;
    formula: string;
    result: string;
    note?: string;
}

export interface AuditTrace {
    logs: AuditLog[];
    brandParams: { d: number; m: number; s: number };
    conditionParams: { d: number };
    engineVersion?: string;
}

// --- Lookup Tables (kept for UI display in the Data tab) ---

export const BRANDS: Record<string, { d: number; m: number; s: number }> = {
    Maytag: { d: 950, m: 250, s: 1400 },
    Whirlpool: { d: 1000, m: 250, s: 1200 },
    GE: { d: 1000, m: 250, s: 1200 },
    Bosch: { d: 900, m: 300, s: 1500 },
    LG: { d: 1150, m: 150, s: 1000 },
    Samsung: { d: 1250, m: 100, s: 900 },
    Frigidaire: { d: 1250, m: 100, s: 900 },
    Kenmore: { d: 1350, m: 50, s: 800 },
    Other: { d: 1400, m: 0, s: 500 },
};

export const CONDITIONS: Record<string, number> = {
    Excellent: 0,
    Good: 200,
    Fair: 450,
    Poor: 800,
};

// --- Core Algorithm (adapter) ---

export function calculateValuation(
    p0: number,         // MSRP in dollars
    brandName: string,
    conditionName: string,
    ageMonths: number,
    parts: PartInput[]
): ValuationResult {
    // Convert parts to engine format
    const engineParts = parts.map((p) => ({
        label: p.name,
        valueUsd: p.cost * p.recovery,
    }));

    const inputs: PricingInputs = {
        p0,
        brand: brandName,
        condition: conditionName,
        ageMonths,
        parts: engineParts,
    };

    const result = calculateResaleValue(inputs);

    // Convert USD output to cents for UI
    const finalValue = Math.round(result.finalPrice * 100);
    const baseValue = Math.round(result.baseValue * 100);
    const salvageValue = Math.round(result.salvageValue * 100);
    const partsAddback = Math.round((result.audit?.partsAddbackUsd ?? 0) * 100);

    // Build a simplified audit log from the engine's structured output
    const brand = BRANDS[brandName] ?? BRANDS["Other"];
    const conditionPenalty = CONDITIONS[conditionName] ?? 200;
    const audit = result.audit;

    const logs: AuditLog[] = [
        {
            step: "1. Engine Version",
            formula: "Engine: appliance_resale_v1.3.0",
            result: audit?.engineVersion ?? "v1.3.0",
            note: "Unified Flood Engine pricing",
        },
        {
            step: "2. Parameter Lookup",
            formula: `Brand: ${audit?.brandKey ?? brandName}, Condition: ${audit?.conditionKey ?? conditionName}, Type: ${audit?.applianceType ?? "Washer"}`,
            result: `d_brand=${brand.d}, m_brand=${brand.m}, s_brand=${brand.s}, d_cond=${conditionPenalty}`,
            note: "Values in basis points (bps)",
        },
        {
            step: "3. Effective Rate",
            formula: `d_eff = d_brand + d_type_add + d_condition - m_brand`,
            result: `${result.effectiveDepreciationBps} bps (${(result.effectiveDepreciationBps / 100).toFixed(2)}%)`,
            note: "Clamped between 0% and 95%",
        },
        {
            step: "4. Depreciation Factor",
            formula: `Piecewise exponential decay over ${ageMonths} months`,
            result: result.depreciationFactor.toFixed(6),
            note: "Type-aware early/late band acceleration",
        },
        {
            step: "5. Base Value",
            formula: `base = round(MSRP * factor)`,
            result: `${baseValue}`,
            note: `$${(baseValue / 100).toFixed(2)} before parts`,
        },
        {
            step: "6. Parts Addback",
            formula: `part addback + age addback`,
            result: `${partsAddback}`,
            note: ageMonths > 96
                ? "Includes $100 default parts addback for machines over 8 years old"
                : parts.length === 0 ? "No replacement parts added" : `Total from ${parts.length} part(s)`,
        },
        {
            step: "7. Salvage Floor",
            formula: `salvage = MSRP * salvage_floor_bps / 10000`,
            result: `${salvageValue}`,
            note: `Source: ${audit?.salvageFloorSource ?? "ui_pct"} — Minimum value floor`,
        },
        {
            step: "8. Final Valuation",
            formula: `max(base + addbacks, salvage_floor) + parts`,
            result: `${finalValue}`,
            note: `Final result: $${(finalValue / 100).toFixed(2)}`,
        },
    ];

    return {
        finalValue,
        baseValue,
        partsAddback,
        salvageValue,
        dEffBps: result.effectiveDepreciationBps,
        ageMonths,
        audit: {
            logs,
            brandParams: brand,
            conditionParams: { d: conditionPenalty },
            engineVersion: audit?.engineVersion,
        },
    };
}
