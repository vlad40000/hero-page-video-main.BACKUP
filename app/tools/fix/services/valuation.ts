
// Appliance Auditor Valuation Adapter
// Single source of truth: delegates to the shared Flood Engine pricing engine.
// UI compatibility: maintains the same ValuationResult shape as before.

import {
    calculateResaleValue,
    type PricingInputs,
} from "@/lib/flood-engine/services/pricingEngine";

// Re-export condition options for the UI dropdown
export const CONDITION_OPTIONS = ["Excellent", "Good", "Fair", "Poor"];

// Utility helpers (kept for UI compatibility)
export const toCents = (usdStrOrNum: string | number): number => {
    const n = Number(usdStrOrNum);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100);
};

export const centsToUsd = (cents: number): string => {
    const abs = Math.abs(cents);
    const dollars = Math.floor(abs / 100);
    const rem = abs % 100;
    return `$${dollars.toLocaleString(undefined)}.${String(rem).padStart(2, "0")}`;
};

export const parseMoney = (str: string): number => {
    return parseFloat(str.replace(/[^0-9.]/g, "")) || 0;
};

export interface Part {
    name: string;
    costCents: number;
    recoveryBps: number;
}

export interface ValuationResult {
    finalCents: number;
    baseValueCents: number;
    partsAddbackCents: number;
    salvageCents: number;
    tradeInMaxCents: number;
    privateListCents: number;
    dEffBps: number;
    ageMonths: number;
    auditTrace: unknown;
}

/**
 * Adapter: wraps the shared pricingEngine for the Appliance Auditor UI.
 * Accepts p0 in CENTS (as the UI passes it), manufacture date for age calc,
 * and maps output back to the legacy ValuationResult shape.
 */
export const calculateValuation = (
    p0Cents: number,
    brandRaw: string,
    categoryRaw: string,
    manufactureYear: number,
    manufactureMonth: number,
    conditionName: string,
    parts: Part[] = []
): ValuationResult => {
    const now = new Date();
    const ageMonths = Math.max(
        0,
        now.getFullYear() * 12 + now.getMonth() - (manufactureYear * 12 + (manufactureMonth - 1))
    );

    // Convert parts to engine format (cents -> USD)
    const engineParts = parts.map((p) => ({
        label: p.name,
        valueUsd: (p.costCents * p.recoveryBps) / 10000 / 100,
    }));

    const inputs: PricingInputs = {
        p0: p0Cents / 100, // engine expects USD
        brand: brandRaw,
        condition: conditionName,
        ageMonths,
        category: categoryRaw,
        parts: engineParts,
    };

    const result = calculateResaleValue(inputs);

    // Convert engine USD output back to cents for UI
    const finalCents = Math.round(result.finalPrice * 100);
    const baseValueCents = Math.round(result.baseValue * 100);
    const salvageCents = Math.round(result.salvageValue * 100);
    const partsAddbackCents = Math.round((result.audit?.partsAddbackUsd ?? 0) * 100);

    // Dealer pricing models (kept from v1.2.0 for UI compatibility)
    const LIST_PREMIUM_BPS = 1500;
    const DISCOUNT_BPS = 1000;
    const MARGIN_BPS = 3000;

    const listCents = Math.round((finalCents * (10000 + LIST_PREMIUM_BPS)) / 10000);
    const expectedSellCents = Math.round((listCents * (10000 - DISCOUNT_BPS)) / 10000);
    const tradeInMaxCents = Math.max(
        Math.round((expectedSellCents * (10000 - MARGIN_BPS)) / 10000),
        salvageCents
    );

    return {
        finalCents,
        baseValueCents,
        partsAddbackCents,
        salvageCents,
        tradeInMaxCents,
        privateListCents: listCents,
        dEffBps: result.effectiveDepreciationBps,
        ageMonths,
        auditTrace: result.audit ?? null,
    };
};
