export type IdentityConfidence = "high" | "medium" | "low";

export type RouteIdentity = {
  brand: string | null;
  applianceType: string | null;
  brandFamily: string | null;
  confidence: IdentityConfidence;
  reason: string;
  manufactureHint?: string | null;
  rulesApplied: string[];
};

type TimeValue = {
  value: number;
  unit: "month" | "week";
};

type DecodeResult = {
  brandFamily: string;
  serial: string;
  candidates: number[];
  selectedYear: number | null;
  monthOrWeek: TimeValue | null;
  confidence: IdentityConfidence;
  reason: string;
  rulesApplied: string[];
};

const CURRENT_YEAR = new Date().getFullYear();

const GE_MONTH_MAP: Record<string, number> = {
  A: 1, D: 2, F: 3, G: 4, H: 5, L: 6,
  M: 7, R: 8, S: 9, T: 10, V: 11, Z: 12,
};

const GE_YEAR_MAP: Record<string, number[]> = {
  A: [1977, 1989, 2001, 2013, 2025],
  D: [1978, 1990, 2002, 2014, 2026],
  F: [1979, 1991, 2003, 2015],
  G: [1980, 1992, 2004, 2016],
  H: [1981, 1993, 2005, 2017],
  L: [1982, 1994, 2006, 2018],
  M: [1983, 1995, 2007, 2019],
  R: [1984, 1996, 2008, 2020],
  S: [1985, 1997, 2009, 2021],
  T: [1986, 1998, 2010, 2022],
  V: [1987, 1999, 2011, 2023],
  Z: [1988, 2000, 2012, 2024],
};

const WHIRLPOOL_YEAR_MAP: Record<string, number[]> = {
  K: [2000], L: [2001], M: [2002], P: [2003], R: [2004],
  S: [2005], T: [2006], U: [2007], W: [2008], Y: [2009],
  A: [1991, 2021], B: [1992, 2022], C: [1993, 2023], D: [1994, 2024],
  E: [1995], F: [1996], G: [1997], H: [1998], J: [1999],
  0: [1980, 2010], 1: [1981, 2011], 2: [1982, 2012], 3: [1983, 2013],
  4: [1984, 2014], 5: [1985, 2015], 6: [1986, 2016], 7: [1987, 2017],
  8: [1988, 2018], 9: [1989, 2019],
};

const SAMSUNG_MONTH_MAP: Record<string, number> = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, A: 10, B: 11, C: 12,
};

const SAMSUNG_YEAR_MAP: Record<string, number[]> = {
  R: [2001, 2021], T: [2002, 2022], W: [2003, 2023], X: [2004, 2024],
  Y: [2005], A: [2006], L: [2006], P: [2007], Q: [2008], S: [2009],
  Z: [2010], B: [2011], C: [2012], D: [2013], E: [2014], G: [2015],
  H: [2016], J: [2017], K: [2018], M: [2019], N: [2020],
};

function pickLatestPastYear(candidates: number[]) {
  const valid = candidates.filter((y) => y <= CURRENT_YEAR + 1);
  return valid.length ? Math.max(...valid) : null;
}

function inferBrandFromModel(model?: string | null): string | null {
  const m = String(model || "").toUpperCase().trim();
  if (!m) return null;

  if (/^(GTW|GFW|GFD|GDT|GDF|HTX|PTW|PFW|PDT|J[GB]|CGS|PVM|GNE|PFE|GSS)/.test(m)) return "GE";
  if (/^(WDT|WDF|KDT|KDTE|MDB|MVW|MHW|MED|WED|WRF|WRX|KRM|KRF|ED|GD)/.test(m)) return "Whirlpool";
  if (/^(RF|RS|WA|WF|DV|DVE|NE|ME|NX)/.test(m)) return "Samsung";
  if (/^(WM|WT|DLE|LDF|LDP|LMV|LSFX|LTCS)/.test(m)) return "LG";
  if (/^(FF|FG|FR|LF|EF|GL|CF|FGH|FPR)/.test(m)) return "Frigidaire";
  if (/^(SH|SHE|SGX|B36|WAT|WTG|HBL|HGS)/.test(m)) return "Bosch";
  if (/^(TR|DR|AWN|ADG)/.test(m)) return "Speed Queen";
  return null;
}

function inferApplianceTypeFromModel(model?: string | null): string | null {
  const m = String(model || "").toUpperCase().trim();
  if (!m) return null;

  if (/^(GTW|PTW|MVW|WT|WA|TR|AWN)/.test(m)) return "Washer";
  if (/^(GFW|PFW|MHW|WM|WF)/.test(m)) return "Front-load washer";
  if (/^(HTX|GFD|GTD|MED|WED|DV|DVE|DLE|DR)/.test(m)) return "Dryer";
  if (/^(GDT|GDF|WDT|WDF|KDT|KDTE|LDF|LDP|SH|SHE)/.test(m)) return "Dishwasher";
  if (/^(RF|RS|WRF|WRX|GNE|PFE|GSS|LSFX|LTCS|B36)/.test(m)) return "Refrigerator";
  if (/^(JGB|CGS|FG|FPR|HGS)/.test(m)) return "Range";
  if (/^(PVM|LMV|ME)/.test(m)) return "Microwave";
  return null;
}

function decodeGe(serial: string): DecodeResult | null {
  const s = serial.toUpperCase().replace(/[-\s]/g, "");
  const match = /^([ADFGHLMRSTVZ])([ADFGHLMRSTVZ])[A-Z0-9]{6,}$/.exec(s);
  if (!match) return null;

  const month = GE_MONTH_MAP[match[1]];
  const years = GE_YEAR_MAP[match[2]] || [];
  const selectedYear = pickLatestPastYear(years);

  return {
    brandFamily: "GE_FAMILY",
    serial: s,
    candidates: years,
    selectedYear,
    monthOrWeek: month ? { value: month, unit: "month" } : null,
    confidence: selectedYear ? "high" : "medium",
    reason: "GE serial pattern matched.",
    rulesApplied: ["matched_GE", "decoded_GE_month_year"],
  };
}

function decodeWhirlpool(serial: string): DecodeResult | null {
  const s = serial.toUpperCase().replace(/[-\s]/g, "");
  const match = /^[A-Z]([A-Z0-9])(\d{2})[A-Z0-9]+$/.exec(s);
  if (!match) return null;

  const years = WHIRLPOOL_YEAR_MAP[match[1]] || [];
  const selectedYear = pickLatestPastYear(years);
  const week = Number(match[2]);

  return {
    brandFamily: "WHIRLPOOL_FAMILY",
    serial: s,
    candidates: years,
    selectedYear,
    monthOrWeek: week >= 1 && week <= 53 ? { value: week, unit: "week" } : null,
    confidence: selectedYear ? "medium" : "low",
    reason: "Whirlpool-family serial pattern matched.",
    rulesApplied: ["matched_Whirlpool", "decoded_Whirlpool_week_year"],
  };
}

function decodeSamsung(serial: string): DecodeResult | null {
  const s = serial.toUpperCase().replace(/[-\s]/g, "");
  let match = /^[A-Z0-9]{7}([A-Z0-9])([1-9A-C])[A-Z0-9]{6}$/.exec(s);
  if (!match) {
    match = /^[A-Z0-9]{3}([A-Z0-9])([1-9A-C])[A-Z0-9]{6}$/.exec(s);
  }
  if (!match) return null;

  const years = SAMSUNG_YEAR_MAP[match[1]] || [];
  const selectedYear = pickLatestPastYear(years);
  const month = SAMSUNG_MONTH_MAP[match[2]];

  return {
    brandFamily: "SAMSUNG",
    serial: s,
    candidates: years,
    selectedYear,
    monthOrWeek: month ? { value: month, unit: "month" } : null,
    confidence: selectedYear ? "medium" : "low",
    reason: "Samsung serial pattern matched.",
    rulesApplied: ["matched_Samsung", "decoded_Samsung_month_year"],
  };
}

function formatManufactureHint(decoded: DecodeResult | null): string | null {
  if (!decoded?.selectedYear) return null;
  if (!decoded.monthOrWeek) return `${decoded.selectedYear}`;
  if (decoded.monthOrWeek.unit === "month") return `${decoded.selectedYear} • month ${decoded.monthOrWeek.value}`;
  return `${decoded.selectedYear} • week ${decoded.monthOrWeek.value}`;
}

export function buildRouteIdentity(input: {
  model?: string | null;
  serial?: string | null;
  resultBrand?: string | null;
  resultProductType?: string | null;
}): RouteIdentity {
  const model = String(input.model || "").trim().toUpperCase();
  const serial = String(input.serial || "").trim().toUpperCase();

  const brandFromModel = inferBrandFromModel(model);
  const typeFromModel = inferApplianceTypeFromModel(model);

  let decoded: DecodeResult | null = null;

  if (serial) {
    if (brandFromModel === "GE") decoded = decodeGe(serial);
    else if (brandFromModel === "Whirlpool") decoded = decodeWhirlpool(serial);
    else if (brandFromModel === "Samsung") decoded = decodeSamsung(serial);
    else decoded = decodeGe(serial) || decodeWhirlpool(serial) || decodeSamsung(serial);
  }

  const finalBrand = input.resultBrand || brandFromModel || decoded?.brandFamily?.replace("_FAMILY", "") || null;
  const finalType = input.resultProductType || typeFromModel || null;

  const rulesApplied = [
    ...(brandFromModel ? ["model_brand_inference"] : []),
    ...(typeFromModel ? ["model_type_inference"] : []),
    ...(decoded?.rulesApplied || []),
  ];

  const confidence: IdentityConfidence =
    input.resultBrand && input.resultProductType
      ? "high"
      : decoded?.confidence || (brandFromModel || typeFromModel ? "medium" : "low");

  return {
    brand: finalBrand,
    applianceType: finalType,
    brandFamily: decoded?.brandFamily || (brandFromModel ? `${brandFromModel.toUpperCase()}_FAMILY` : null),
    confidence,
    reason:
      decoded?.reason ||
      (brandFromModel || typeFromModel ? "Model-family heuristics matched." : "Not enough route-local identity evidence."),
    manufactureHint: formatManufactureHint(decoded),
    rulesApplied,
  };
}

function normalizeRoot(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function modelFamilyRoot(model: string) {
  const n = normalizeRoot(model);
  const digits = n.match(/\d+/)?.[0] || "";
  const prefix = n.replace(/\d.*$/, "");
  return `${prefix}:${digits}`;
}

export function filterRevisionCandidates(
  searchedModel: string,
  candidates?: Array<{ revision: string; label: string; confidence?: number }>
) {
  if (!searchedModel || !Array.isArray(candidates) || !candidates.length) return [];
  const searchRoot = modelFamilyRoot(searchedModel);

  return candidates.filter((candidate) => {
    const label = String(candidate.label || candidate.revision || "").toUpperCase();
    if (!label) return false;
    return modelFamilyRoot(label) === searchRoot;
  });
}

export function routeStatusLabel(status?: string, filteredCandidateCount = 0) {
  if (filteredCandidateCount === 0 && status === "variant_resolution_needed") return "Needs shop review";
  if (status === "bom_complete") return "Verified parts found";
  if (status === "parts_partial") return "Likely parts found";
  if (status === "variant_resolution_needed") return "Needs exact revision";
  if (status === "needs_fallback") return "Searching deeper";
  return "No confirmed parts yet";
}
