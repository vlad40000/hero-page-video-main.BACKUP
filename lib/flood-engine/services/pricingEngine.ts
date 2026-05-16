// Deterministic Asset Pricing Engine v1.3.0 (single-file drop-in)
//
// Drop-in target (in this repo):
//   /lib/flood-engine/services/pricingEngine.ts
//
// Back-compat:
// - Keeps: export interface PricingInputs, PricingResult, calculateResaleValue()
// - Existing call sites (InventoryForm) continue working with no changes.
// - Adds optional inputs for appliance type + salvage override modes.
//
// Salvage rules (per your requirement):
// - Default salvage floor is ALWAYS applied (ui_pct).
// - Manual/scrap modes are USER-selected (AI does not set them).
// - Manual/scrap can only RAISE the floor, never reduce it.

export type ApplianceType = "Refrigerator" | "Washer" | "Dryer" | "Range/Stove" | "Dishwasher";
export type SalvageMode = "ui_pct" | "manual_usd" | "scrap" | "off";
export type ScrapPick = "min" | "mid" | "max";

export interface PricingInputs {
  p0: number; // Original MSRP in USD
  brand: string;
  condition: string;
  ageMonths: number;

  // Optional (recommended): use your category string ("Washers", "Refrigerators", etc.)
  applianceType?: ApplianceType;
  category?: string;

  // Optional: user-controlled salvage behavior
  salvageMode?: SalvageMode;        // default: "ui_pct"
  salvageManualUsd?: number | null; // used when salvageMode="manual_usd"
  scrapPick?: ScrapPick;            // used when salvageMode="scrap" (default "mid")

  // Optional: parts addback (manual entries)
  parts?: Array<{ label?: string; valueUsd: number }>;
}

export interface PricingResult {
  finalPrice: number;               // USD
  baseValue: number;                // USD (depreciated, pre-salvage-floor)
  salvageValue: number;             // USD (FINAL salvage floor after user override)
  depreciationFactor: number;       // 0..1
  effectiveDepreciationBps: number; // annual bps

  // Extra (non-breaking): audit/debug info you can persist if desired
  audit?: {
    engineVersion: "appliance_resale_v1.3.0";
    applianceType: ApplianceType;
    brandKey: BrandKey;
    conditionKey: ConditionKey;
    salvageFloorSource: string; // ui_pct | manual_usd | scrap_min|mid|max
    salvageFloorUsdUi: number;
    salvageFloorUsdFinal: number;
    partsAddbackUsd: number;
  };
}

const ENGINE_VERSION = "appliance_resale_v1.3.0" as const;

// ----------------------------
// Tables (v1.3.0-style)
// ----------------------------
type BrandKey = "Maytag" | "Whirlpool" | "GE" | "Bosch" | "LG" | "Samsung" | "Frigidaire" | "Kenmore" | "Other";
type ConditionKey = "Excellent" | "Good" | "Fair" | "Poor";

const BRAND_TABLE: Record<BrandKey, { d_brand_bps: number; m_brand_bps: number; salvage_floor_bps: number }> = {
  Maytag:     { d_brand_bps: 950,  m_brand_bps: 250, salvage_floor_bps: 1400 },
  Whirlpool:  { d_brand_bps: 1000, m_brand_bps: 250, salvage_floor_bps: 1200 },
  GE:         { d_brand_bps: 1000, m_brand_bps: 250, salvage_floor_bps: 1200 },
  Bosch:      { d_brand_bps: 900,  m_brand_bps: 300, salvage_floor_bps: 1500 },
  LG:         { d_brand_bps: 1150, m_brand_bps: 150, salvage_floor_bps: 1000 },
  Samsung:    { d_brand_bps: 1250, m_brand_bps: 100, salvage_floor_bps: 900 },
  Frigidaire: { d_brand_bps: 1250, m_brand_bps: 100, salvage_floor_bps: 900 },
  Kenmore:    { d_brand_bps: 1350, m_brand_bps: 50,  salvage_floor_bps: 800 },
  Other:      { d_brand_bps: 1400, m_brand_bps: 0,   salvage_floor_bps: 500 },
};

const CONDITION_TABLE: Record<ConditionKey, number> = {
  Excellent: 0,
  Good: 200,
  Fair: 450,
  Poor: 800,
};

const CONDITION_EARLY_MONTHS: Record<ConditionKey, number> = {
  Excellent: 18,
  Good: 24,
  Fair: 30,
  Poor: 36,
};

const TYPE_TABLE: Record<ApplianceType, { d_type_add_bps: number; salvage_add_bps: number; accel_add_bps: number }> = {
  Refrigerator: { d_type_add_bps: 0,    salvage_add_bps: 200, accel_add_bps: 150 },
  Washer:       { d_type_add_bps: 100,  salvage_add_bps: 0,   accel_add_bps: 200 },
  Dryer:        { d_type_add_bps: 50,   salvage_add_bps: 0,   accel_add_bps: 150 },
  "Range/Stove":{ d_type_add_bps: -100, salvage_add_bps: 300, accel_add_bps: 50  },
  Dishwasher:   { d_type_add_bps: 150,  salvage_add_bps: 0,   accel_add_bps: 200 },
};

// Scrap floors (USD ranges) — user selects salvage mode + pick
const SCRAP_FLOOR_USD_RANGE: Record<ApplianceType, { min: number; max: number }> = {
  Refrigerator: { min: 15.0, max: 35.0 },
  Washer:       { min: 12.0, max: 25.0 },
  Dryer:        { min: 8.0,  max: 15.0 },
  Dishwasher:   { min: 2.5,  max: 10.0 },
  "Range/Stove":{ min: 10.0, max: 20.0 },
};

// clamps (match your earlier v1.3 intent)
const D_EFF_MIN_BPS = 0;
const D_EFF_MAX_BPS = 9500;
const SALVAGE_MIN_BPS = 300;
const SALVAGE_MAX_BPS = 5000;

// ----------------------------
// Helpers
// ----------------------------
function clampInt(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.trunc(x)));
}

function toCentsUsd(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function centsToUsd(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

function norm(s: unknown): string {
  return String(s ?? "").trim().toLowerCase();
}

function inferBrandKey(brandRaw: string): BrandKey {
  const b = norm(brandRaw);

  if (!b) return "Other";
  if (b.includes("whirlpool") || b.includes("kitchenaid") || b.includes("amana") || b.includes("roper")) return "Whirlpool";
  if (b === "ge" || b.includes("general electric") || b.includes("hotpoint") || b.includes("profile") || b.includes("cafe")) return "GE";
  if (b.includes("maytag")) return "Maytag";
  if (b.includes("frigidaire") || b.includes("electrolux")) return "Frigidaire";
  if (b.includes("samsung")) return "Samsung";
  if (b === "lg" || b.includes(" life") || b.includes("lg ")) return "LG";
  if (b.includes("bosch")) return "Bosch";
  if (b.includes("kenmore")) return "Kenmore";

  // fall back: try direct table match
  for (const k of Object.keys(BRAND_TABLE) as BrandKey[]) {
    if (k !== "Other" && b.includes(k.toLowerCase())) return k;
  }
  return "Other";
}

function inferConditionKey(conditionRaw: string): ConditionKey {
  const c = norm(conditionRaw);

  // Flood Engine enum values: new | like-new | excellent | good | fair
  if (c.includes("like") || c === "new" || c === "like-new" || c === "excellent") return "Excellent";
  if (c === "good") return "Good";
  if (c === "fair" || c.includes("scratch")) return "Fair";
  if (c === "poor" || c.includes("broken") || c.includes("parts") || c.includes("salvage")) return "Poor";

  // default = Good (safe middle)
  return "Good";
}

function inferApplianceType(categoryRaw?: string): ApplianceType {
  const s = norm(categoryRaw);

  if (s.includes("dish")) return "Dishwasher";
  if (s.includes("refrig") || s.includes("fridge") || s.includes("freezer")) return "Refrigerator";
  if (s.includes("stove") || s.includes("range") || s.includes("oven") || s.includes("cooktop")) return "Range/Stove";
  if (s.includes("dry")) return "Dryer";
  if (s.includes("wash")) return "Washer";

  return "Washer";
}

function depreciationFactorAnnual(years: number, dBps: number): number {
  if (years <= 0) return 1.0;
  const d = dBps / 10000.0;
  const expo = -d * years;
  return Math.exp(expo);
}

function depreciationFactorPiecewise(ageMonths: number, earlyMonths: number, dLateBps: number, dEarlyBps: number) {
  const n1m = Math.max(0, Math.min(ageMonths, earlyMonths));
  const n2m = Math.max(0, ageMonths - earlyMonths);
  const y1 = n1m / 12.0;
  const y2 = n2m / 12.0;
  const f1 = depreciationFactorAnnual(y1, dEarlyBps);
  const f2 = depreciationFactorAnnual(y2, dLateBps);
  return { f_total: f1 * f2, f_early: f1, f_late: f2, n1m, n2m };
}

function scrapPickValueUsd(type: ApplianceType, pick: ScrapPick): number {
  const rng = SCRAP_FLOOR_USD_RANGE[type];
  if (!rng) return 0;
  if (pick === "min") return rng.min;
  if (pick === "max") return rng.max;
  return (rng.min + rng.max) / 2.0;
}

function applyUserSalvageFloor(args: {
  salvageFloorCentsUi: number;
  applianceType: ApplianceType;
  salvageMode?: SalvageMode;
  salvageManualUsd?: number | null;
  scrapPick?: ScrapPick;
}) {
  let mode = norm(args.salvageMode || "ui_pct") as SalvageMode;
  if (mode === "off") mode = "ui_pct";

  let finalCents = Math.trunc(args.salvageFloorCentsUi);
  let source = "ui_pct";

  if (mode === "manual_usd") {
    const manual = args.salvageManualUsd;
    if (typeof manual === "number" && Number.isFinite(manual) && manual > 0) {
      finalCents = Math.max(finalCents, toCentsUsd(manual));
      source = "manual_usd";
    }
    return { salvageFloorCentsFinal: finalCents, salvageFloorSource: source };
  }

  if (mode === "scrap") {
    const pick = (args.scrapPick || "mid") as ScrapPick;
    const scrapUsd = scrapPickValueUsd(args.applianceType, pick);
    if (scrapUsd > 0) {
      finalCents = Math.max(finalCents, toCentsUsd(scrapUsd));
      source = `scrap_${pick}`;
    }
    return { salvageFloorCentsFinal: finalCents, salvageFloorSource: source };
  }

  // ui_pct default
  return { salvageFloorCentsFinal: finalCents, salvageFloorSource: source };
}

// ----------------------------
// Main calculator (drop-in export)
// ----------------------------
export const calculateResaleValue = (inputs: PricingInputs): PricingResult => {
  const safeAgeMonths = Math.max(0, Math.trunc(Number(inputs.ageMonths) || 0));
  const P0_cents = toCentsUsd(inputs.p0);

  const brandKey = inferBrandKey(inputs.brand);
  const conditionKey = inferConditionKey(inputs.condition);
  const applianceType = inferApplianceType(inputs.category);

  const brandRow = BRAND_TABLE[brandKey] ?? BRAND_TABLE.Other;
  const typeRow = TYPE_TABLE[applianceType];
  const d_condition_bps = CONDITION_TABLE[conditionKey];

  // Effective depreciation (annual bps)
  const d_eff_raw_bps = brandRow.d_brand_bps + typeRow.d_type_add_bps + d_condition_bps - brandRow.m_brand_bps;
  const d_eff_bps = clampInt(d_eff_raw_bps, D_EFF_MIN_BPS, D_EFF_MAX_BPS);

  // Piecewise factor (early accel is type-based)
  const earlyMonths = CONDITION_EARLY_MONTHS[conditionKey];
  const d_early_bps = clampInt(d_eff_bps + typeRow.accel_add_bps, D_EFF_MIN_BPS, D_EFF_MAX_BPS);
  const df = depreciationFactorPiecewise(safeAgeMonths, earlyMonths, d_eff_bps, d_early_bps);

  const base_value_cents = Math.round(P0_cents * df.f_total);

  // Always-on modeled salvage floor (ui_pct)
  const salvage_eff_bps = clampInt(
    brandRow.salvage_floor_bps + typeRow.salvage_add_bps,
    SALVAGE_MIN_BPS,
    SALVAGE_MAX_BPS
  );
  const salvage_floor_cents_ui = Math.round((P0_cents * salvage_eff_bps) / 10000);

  // User-controlled salvage modes (manual/scrap can only raise)
  const salvageOverride = applyUserSalvageFloor({
    salvageFloorCentsUi: salvage_floor_cents_ui,
    applianceType,
    salvageMode: inputs.salvageMode,
    salvageManualUsd: inputs.salvageManualUsd ?? null,
    scrapPick: inputs.scrapPick,
  });
  const salvage_floor_cents_final = salvageOverride.salvageFloorCentsFinal;

  // Floor enforcement BEFORE parts, then add parts
  const fair_value_cents = Math.max(base_value_cents, salvage_floor_cents_final);

  const manual_parts_addback_cents = (inputs.parts || []).reduce((acc, p) => acc + toCentsUsd(p?.valueUsd ?? 0), 0);
  const age_based_parts_addback_cents = safeAgeMonths > 96 ? 10000 : 0;
  const parts_addback_cents = manual_parts_addback_cents + age_based_parts_addback_cents;
  const final_cents = fair_value_cents + parts_addback_cents;

  return {
    finalPrice: centsToUsd(final_cents),
    baseValue: centsToUsd(base_value_cents),
    salvageValue: centsToUsd(salvage_floor_cents_final),
    depreciationFactor: df.f_total,
    effectiveDepreciationBps: d_eff_bps,
    audit: {
      engineVersion: ENGINE_VERSION,
      applianceType,
      brandKey,
      conditionKey,
      salvageFloorSource: salvageOverride.salvageFloorSource,
      salvageFloorUsdUi: centsToUsd(salvage_floor_cents_ui),
      salvageFloorUsdFinal: centsToUsd(salvage_floor_cents_final),
      partsAddbackUsd: centsToUsd(parts_addback_cents),
    },
  };
};
