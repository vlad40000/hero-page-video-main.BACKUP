import 'server-only';
import { normalizeSerialNumber, stripSerialNoise } from './normalize';
import { resolveDecoderFamily, DECODER_FAMILIES } from './brand-family';

// --- Constants & Rulesets ---

const GE_MONTH_MAP = {
  A: 1, D: 2, F: 3, G: 4, H: 5, L: 6, M: 7, R: 8, S: 9, T: 10, V: 11, Z: 12
};

const GE_YEAR_MAP = {
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
  Z: [1988, 2000, 2012, 2024]
};

const WHIRLPOOL_YEAR_MAP = {
  K: [2000], L: [2001], M: [2002], P: [2003], R: [2004],
  S: [2005], T: [2006], U: [2007], W: [2008], Y: [2009],
  A: [1991, 2021], B: [1992, 2022], C: [1993, 2023], D: [1994, 2024],
  E: [1995], F: [1996], G: [1997], H: [1998], J: [1999],
  '0': [1980, 2010], '1': [1981, 2011], '2': [1982, 2012], '3': [1983, 2013],
  '4': [1984, 2014], '5': [1985, 2015], '6': [1986, 2016], '7': [1987, 2017],
  '8': [1988, 2018], '9': [1989, 2019]
};

const MAYTAG_YEAR_MAP = {
  A: [1978, 2002], B: [1966, 1990, 2014], C: [1979, 2003],
  D: [1967, 1991], E: [1980, 2004], F: [1968, 1992],
  G: [1981, 2005], H: [1969, 1993], J: [1982, 2006],
  K: [1970, 1994], L: [1983, 2007], M: [1971, 1995],
  N: [1980, 2008], P: [1985, 2009], Q: [1972, 1996],
  R: [1986, 2010], S: [1973, 1997], T: [1987, 2011],
  U: [1974, 1998], V: [1988, 2012], W: [1975, 1999],
  X: [1989, 2013], Y: [1976, 2000], Z: [1977, 2001]
};

const MAYTAG_MONTH_MAP = {
  A: 1, B: 1, C: 2, D: 2, E: 3, F: 3,
  G: 4, H: 4, J: 5, K: 5, L: 6, M: 6,
  N: 7, Q: 7, P: 8, S: 8, R: 9, U: 9,
  T: 10, W: 10, V: 11, Y: 11, X: 12, Z: 12
};

const SAMSUNG_YEAR_MAP = {
  R: [2001, 2021], T: [2002, 2022], W: [2003, 2023], X: [2004, 2024],
  Y: [2005], A: [2006], L: [2006], P: [2007], Q: [2008],
  S: [2009], Z: [2010], B: [2011], C: [2012], D: [2013],
  E: [2014], G: [2015], H: [2016], J: [2017], K: [2018],
  M: [2019], N: [2020]
};

const SAMSUNG_MONTH_MAP = {
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  A: 10, B: 11, C: 12
};

const SMART_ERA_START = 2010;
const GE_MODERN_BREAKER_START = 2012;
const BOSCH_FD_MIN_YEAR = 1984;
const ALLIANCE_RES_START = 1990;
const ALLIANCE_LOOKBACK_YEARS = 45;
const CURRENT_YEAR = new Date().getFullYear();
const MAX_YEAR = CURRENT_YEAR + 1;

const SMART_FEATURES = ['wifi', 'smartthings', 'thinq', 'homeconnect', 'bluetooth'];
const REVISION_SUFFIXES = ['/AA', '/02', 'REV', 'VER', 'V2'];

// --- Helper Functions ---

function getCandidateDecades(yearDigit) {
  const digit = parseInt(yearDigit, 10);
  if (isNaN(digit)) return [];
  return [1990 + digit, 2000 + digit, 2010 + digit, 2020 + digit].filter(y => y <= MAX_YEAR);
}

function resolveConfidence(candidates, hardEliminatorsApplied, source) {
  if (candidates.length === 0) return 'low';
  if (source === 'BOSCH_BSH' && candidates.length === 1) return 'high';
  if (candidates.length === 1 && hardEliminatorsApplied) return 'high';
  if (candidates.length === 1) return 'high';
  return 'low';
}

/**
 * Core Serial Decoder
 */
export async function decodeSerialNumber(inputSerial, options = {}) {
  const { 
    brand, 
    model, 
    hard_lower_bound_year, 
    observed_features = [], 
    refrigerant_label 
  } = options;

  const normalized = stripSerialNoise(inputSerial);
  const brandFamily = resolveDecoderFamily(brand, model);
  
  const result = {
    brandFamily,
    serial: normalized,
    candidatesBefore: [],
    remainingCandidates: [],
    selectedYear: null,
    timeValue: null,
    confidence: 'low',
    resolutionReason: '',
    rulesApplied: [],
    decoded: { month: null, week: null, year: null }
  };

  if (!normalized || brandFamily === DECODER_FAMILIES.UNKNOWN) {
    result.resolutionReason = "Missing serial or unknown brand family";
    return result;
  }

  // --- 1. Family-Specific Waterfall ---
  let rawCandidates = [];
  let month = null;
  let week = null;

  try {
    switch (brandFamily) {
      case DECODER_FAMILIES.GE_FAMILY: {
        const match = normalized.match(/^([A-Z])([A-Z])[A-Z0-9]{6,}/);
        if (match) {
          month = GE_MONTH_MAP[match[1]];
          rawCandidates = GE_YEAR_MAP[match[2]] || [];
          if (month) result.timeValue = { unit: 'month', value: month };
        }
        break;
      }

      case DECODER_FAMILIES.WHIRLPOOL_FAMILY: {
        const match = normalized.match(/^[A-Z]([A-Z0-9])(\d{2})\d{5}/);
        if (match) {
          const yearCode = match[1];
          const weekNum = parseInt(match[2], 10);
          if (weekNum >= 1 && weekNum <= 53) {
            week = weekNum;
            rawCandidates = WHIRLPOOL_YEAR_MAP[yearCode] || [];
            result.timeValue = { unit: 'week', value: week };
          }
        }
        break;
      }

      case DECODER_FAMILIES.MAYTAG_LEGACY: {
        const match = normalized.match(/.*([A-Z])([A-Z])$/); // Legacy year + month suffix
        if (match) {
          const yearCode = match[1];
          const monthCode = match[2];
          month = MAYTAG_MONTH_MAP[monthCode];
          rawCandidates = MAYTAG_YEAR_MAP[yearCode] || [];
          result.timeValue = { unit: 'month', value: month };
        }
        break;
      }

      case DECODER_FAMILIES.ELECTROLUX_FAMILY: {
        const match = normalized.match(/^[A-Z0-9]{2}(\d)(\d{2})\d{5}/);
        if (match) {
          const weekNum = parseInt(match[2], 10);
          if (weekNum >= 1 && weekNum <= 53) {
            week = weekNum;
            rawCandidates = getCandidateDecades(match[1]);
            result.timeValue = { unit: 'week', value: week };
          }
        }
        break;
      }

      case DECODER_FAMILIES.LG: {
        const match = normalized.match(/^(\d)(\d{2})[A-Z0-9]+/);
        if (match) {
          rawCandidates = getCandidateDecades(match[1]);
          const variant = parseInt(match[2], 10);
          if (variant >= 1 && variant <= 12) {
            month = variant;
            result.timeValue = { unit: 'month', value: month };
          } else if (variant >= 1 && variant <= 53) {
            week = variant;
            result.timeValue = { unit: 'week', value: week };
          }
        }
        break;
      }

      case DECODER_FAMILIES.BOSCH_BSH: {
        const match = normalized.match(/^FD(\d{2})(\d{2})\d+/);
        if (match) {
          const fdYY = parseInt(match[1], 10);
          const fdMM = parseInt(match[2], 10);
          if (fdMM >= 1 && fdMM <= 12) {
            month = fdMM;
            const baseYear = (fdYY + 20);
            const candidates = [1900 + baseYear, 2000 + baseYear].filter(y => y >= BOSCH_FD_MIN_YEAR && y <= MAX_YEAR);
            rawCandidates = candidates;
            result.timeValue = { unit: 'month', value: month };
          }
        }
        break;
      }

      case DECODER_FAMILIES.SAMSUNG: {
        // 15-char then 11-char fallback
        let sm = normalized.match(/^[A-Z0-9]{7}([A-Z0-9])([1-9ABC])/);
        if (!sm) sm = normalized.match(/^[A-Z0-9]{3}([A-Z0-9])([1-9ABC])/);
        
        if (sm) {
          const yCode = sm[1];
          const mCode = sm[2];
          const years = SAMSUNG_YEAR_MAP[yCode];
          month = SAMSUNG_MONTH_MAP[mCode];
          if (years) rawCandidates = years;
          if (month) result.timeValue = { unit: 'month', value: month };
        }
        break;
      }

      case DECODER_FAMILIES.ALLIANCE: {
        const match = normalized.match(/^(\d{2})(\d{2})\d+/);
        if (match) {
          const yy = parseInt(match[1], 10);
          const mm = parseInt(match[2], 10);
          if (mm >= 1 && mm <= 12) {
            month = mm;
            const startYear = Math.max(ALLIANCE_RES_START, MAX_YEAR - ALLIANCE_LOOKBACK_YEARS + 1);
            rawCandidates = [];
            for (let y = startYear; y <= MAX_YEAR; y += 1) {
              if (y % 100 === yy) rawCandidates.push(y);
            }
            result.timeValue = { unit: 'month', value: month };
          }
        }
        break;
      }
    }
  } catch (err) {
    result.resolutionReason = `Decoder error: ${err.message}`;
    return result;
  }

  result.candidatesBefore = [...rawCandidates];

  // --- 2. Hard Eliminators ---
  let filtered = [...rawCandidates];
  const filters = [];

  if (hard_lower_bound_year) {
    const prev = filtered.length;
    filtered = filtered.filter(y => y >= hard_lower_bound_year);
    if (filtered.length < prev) filters.push('hard_lower_bound_year');
  }

  const hasSmart = observed_features.some(f => SMART_FEATURES.includes(f.toLowerCase()));
  if (hasSmart) {
    const prev = filtered.length;
    filtered = filtered.filter(y => y >= SMART_ERA_START);
    if (filtered.length < prev) filters.push('smart_features_floor');
  }

  if (refrigerant_label === 'R600A') {
    const prev = filtered.length;
    filtered = filtered.filter(y => y >= SMART_ERA_START);
    if (filtered.length < prev) filters.push('modern_refrigerant_floor');
  }

  const isModernGE = brandFamily === DECODER_FAMILIES.GE_FAMILY && 
    observed_features.some(f => ['qr_code', 'url_printed', 'slate_finish'].includes(f.toLowerCase()));
  
  if (isModernGE) {
    const prev = filtered.length;
    filtered = filtered.filter(y => y >= GE_MODERN_BREAKER_START);
    if (filtered.length < prev) filters.push('ge_modern_breaker');
  }

  result.remainingCandidates = filtered;
  result.rulesApplied = filters;

  if (filtered.length === 0) {
    result.selectedYear = null;
    result.confidence = 'low';
    result.resolutionReason = rawCandidates.length > 0 ? "Hard eliminators removed all candidates" : "Pattern match failed or invalid codes";
    return result;
  }

  // --- 3. Soft Cues & Selection ---
  let selected = null;
  const cues = [];

  // Heuristic: newest is default
  selected = Math.max(...filtered);
  // console.log(`[DEBUG] Initial selection (max): ${selected} from ${filtered.join(',')}`);

  const hasNewCue = observed_features.some(f => ['qr_code', 'url_printed', 'modern_style'].includes(f.toLowerCase()));
  const hasOldCue = observed_features.includes('vintage_style');
  const hasRevision = REVISION_SUFFIXES.some(s => model?.toUpperCase().includes(s));

  if (hasOldCue) {
    selected = Math.min(...filtered);
    cues.push('vintage_style_bias');
  } else {
    selected = Math.max(...filtered);
    if (hasNewCue || hasRevision) {
      cues.push('modern_style_bias');
    }
    
  }

  result.selectedYear = selected;
  result.decoded = { year: selected, month, week };
  result.confidence = resolveConfidence(filtered, filters.length > 0, brandFamily);
  result.resolutionReason = cues.length > 0 ? `Resolved via ${cues.join(', ')}` : "Singleton or default newest selection";

  return result;
}
