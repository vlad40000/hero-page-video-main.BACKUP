import 'server-only';

import { GoogleGenerativeAI } from '@google/generative-ai';

const HEAVY_MODEL = 'gemini-3-flash-preview';
const LITE_MODEL = 'gemini-3.1-flash-lite-preview';
const DEFAULT_WINDOW_MS = 3000;
const DEFAULT_WAIT_TIMEOUT_MS = 15000;

let geminiClient = null;

function numberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function stringEnv(name, fallback) {
  const value = String(process.env[name] || '').trim();
  return value || fallback;
}

function cleanEnvValue(value) {
  return value?.trim().replace(/^["']|["']$/g, '');
}

function maxUnit(policy, tierPolicy) {
  return (
    tierPolicy.maxCallsPerRequest ??
    tierPolicy.maxCallsPerJob ??
    tierPolicy.maxCallsPerListing ??
    tierPolicy.maxCallsPerItem ??
    policy.maxCallsPerRequest ??
    policy.maxCallsPerJob ??
    policy.maxCallsPerListing ??
    policy.maxCallsPerItem ??
    Infinity
  );
}

function unitLimitEnvName(prefix, tier, unitKey) {
  const suffixes = {
    maxCallsPerRequest: 'CALLS_PER_REQUEST',
    maxCallsPerJob: 'CALLS_PER_JOB',
    maxCallsPerListing: 'CALLS_PER_LISTING',
    maxCallsPerItem: 'CALLS_PER_ITEM',
  };

  const suffix = suffixes[unitKey] || unitKey.replace(/[A-Z]/g, '_$&').replace(/^_/, '').toUpperCase();
  return `${prefix}_MAX_${tier}_${suffix}`;
}

function heavyPolicy(prefix, unitKey, unitLimit, defaults = {}) {
  return {
    model: stringEnv(`${prefix}_HEAVY_MODEL`, defaults.model || HEAVY_MODEL),
    maxConcurrent: numberEnv(`${prefix}_HEAVY_MAX_CONCURRENT`, defaults.maxConcurrent ?? 1),
    maxCallsPerWindow: numberEnv(`${prefix}_HEAVY_MAX_CALLS_PER_WINDOW`, defaults.maxCallsPerWindow ?? 1),
    [unitKey]: numberEnv(unitLimitEnvName(prefix, 'HEAVY', unitKey), unitLimit),
  };
}

function litePolicy(prefix, unitKey, unitLimit, defaults = {}) {
  return {
    model: stringEnv(`${prefix}_LITE_MODEL`, defaults.model || LITE_MODEL),
    maxConcurrent: numberEnv(`${prefix}_LITE_MAX_CONCURRENT`, defaults.maxConcurrent ?? 2),
    maxCallsPerWindow: numberEnv(`${prefix}_LITE_MAX_CALLS_PER_WINDOW`, defaults.maxCallsPerWindow ?? 2),
    [unitKey]: numberEnv(unitLimitEnvName(prefix, 'LITE', unitKey), unitLimit),
  };
}

export const GEMINI_BUCKETS = [
  'bom.heavy',
  'bom.lite',
  'bom.heavy_grounded',
  'bom.lite_grounded',
  'diag.heavy',
  'diag.lite',
  'diag.heavy_grounded',
  'diag.lite_grounded',
  'parts.heavy',
  'parts.lite',
  'parts.heavy_grounded',
  'parts.lite_grounded',
  'catalog.heavy',
  'catalog.lite',
  'catalog.lite_grounded',
  'ebay.heavy',
  'ebay.lite',
  'ebay.heavy_grounded',
  'ebay.lite_grounded',
  'market.heavy',
  'market.lite',
  'market.lite_grounded',
  'identity.heavy',
  'identity.lite',
  'inventory.heavy',
  'inventory.lite',
  'sales.heavy',
  'sales.lite',
  'repair_replace.heavy',
  'repair_replace.lite',
  'resale.heavy',
  'resale.lite',
  'portfolio.heavy',
  'portfolio.lite',
  'triage.heavy',
  'triage.lite',
  'calculators.heavy',
  'calculators.lite',
  'calculators.lite_grounded',
  'global',
];

export const TOOL_MODEL_POLICIES = {
  bom: {
    windowMs: numberEnv('BOM_WINDOW_MS', DEFAULT_WINDOW_MS),
    maxCallsPerJob: numberEnv('BOM_MAX_CALLS_PER_JOB', 12),
    heavy: heavyPolicy('BOM', 'maxCallsPerJob', 2),
    lite: litePolicy('BOM', 'maxCallsPerJob', 10),
    grounded: {
      maxCallsPerJob: numberEnv('BOM_MAX_GROUNDED_CALLS_PER_JOB', 3),
    },
  },

  diagnosis: {
    windowMs: numberEnv('DIAG_WINDOW_MS', DEFAULT_WINDOW_MS),
    maxCallsPerRequest: numberEnv('DIAG_MAX_CALLS_PER_REQUEST', 4),
    heavy: heavyPolicy('DIAG', 'maxCallsPerRequest', 1),
    lite: litePolicy('DIAG', 'maxCallsPerRequest', 3, {
      maxCallsPerWindow: 1,
    }),
    grounded: {
      maxCallsPerRequest: numberEnv('DIAG_MAX_GROUNDED_CALLS_PER_REQUEST', 1),
    },
  },

  partFinder: {
    windowMs: numberEnv('PARTS_WINDOW_MS', DEFAULT_WINDOW_MS),
    maxCallsPerRequest: numberEnv('PARTS_MAX_CALLS_PER_REQUEST', 5),
    heavy: heavyPolicy('PARTS', 'maxCallsPerRequest', 1),
    lite: litePolicy('PARTS', 'maxCallsPerRequest', 4),
    grounded: {
      maxCallsPerRequest: numberEnv('PARTS_MAX_GROUNDED_CALLS_PER_REQUEST', 2),
    },
  },

  partsCatalog: {
    windowMs: numberEnv('CATALOG_WINDOW_MS', DEFAULT_WINDOW_MS),
    maxCallsPerRequest: numberEnv('CATALOG_MAX_CALLS_PER_REQUEST', 1),
    heavy: heavyPolicy('CATALOG', 'maxCallsPerRequest', 0, {
      maxConcurrent: 0,
      maxCallsPerWindow: 0,
    }),
    lite: litePolicy('CATALOG', 'maxCallsPerRequest', 1),
    grounded: {
      maxCallsPerRequest: numberEnv('CATALOG_MAX_GROUNDED_CALLS_PER_REQUEST', 1),
    },
  },

  ebay: {
    windowMs: numberEnv('EBAY_WINDOW_MS', DEFAULT_WINDOW_MS),
    maxCallsPerListing: numberEnv('EBAY_MAX_CALLS_PER_LISTING', 5),
    heavy: heavyPolicy('EBAY', 'maxCallsPerListing', 1),
    lite: litePolicy('EBAY', 'maxCallsPerListing', 4),
    grounded: {
      maxCallsPerListing: numberEnv('EBAY_MAX_GROUNDED_CALLS_PER_LISTING', 1),
    },
  },

  market: {
    windowMs: numberEnv('MARKET_WINDOW_MS', DEFAULT_WINDOW_MS),
    maxCallsPerItem: numberEnv('MARKET_MAX_CALLS_PER_ITEM', 3),
    heavy: heavyPolicy('MARKET', 'maxCallsPerItem', 0, {
      maxConcurrent: 0,
      maxCallsPerWindow: 0,
    }),
    lite: litePolicy('MARKET', 'maxCallsPerItem', 3),
    grounded: {
      maxCallsPerItem: numberEnv('MARKET_MAX_GROUNDED_CALLS_PER_ITEM', 1),
    },
  },

  identity: {
    windowMs: numberEnv('IDENTITY_WINDOW_MS', DEFAULT_WINDOW_MS),
    maxCallsPerRequest: numberEnv('IDENTITY_MAX_CALLS_PER_REQUEST', 2),
    heavy: heavyPolicy('IDENTITY', 'maxCallsPerRequest', 1),
    lite: litePolicy('IDENTITY', 'maxCallsPerRequest', 1, {
      maxConcurrent: 1,
      maxCallsPerWindow: 1,
    }),
    grounded: {
      maxCallsPerRequest: numberEnv('IDENTITY_MAX_GROUNDED_CALLS_PER_REQUEST', 0),
    },
  },

  calculators: {
    windowMs: numberEnv('CALCULATORS_WINDOW_MS', DEFAULT_WINDOW_MS),
    maxCallsPerRequest: numberEnv('CALCULATORS_MAX_CALLS_PER_REQUEST', 1),
    heavy: heavyPolicy('CALCULATORS', 'maxCallsPerRequest', 0, {
      maxConcurrent: 0,
      maxCallsPerWindow: 0,
    }),
    lite: litePolicy('CALCULATORS', 'maxCallsPerRequest', 1, {
      maxConcurrent: 1,
      maxCallsPerWindow: 1,
    }),
    grounded: {
      maxCallsPerRequest: numberEnv('CALCULATORS_MAX_GROUNDED_CALLS_PER_REQUEST', 1),
    },
  },

  repairReplace: {
    windowMs: numberEnv('REPAIR_REPLACE_WINDOW_MS', DEFAULT_WINDOW_MS),
    maxCallsPerRequest: numberEnv('REPAIR_REPLACE_MAX_CALLS_PER_REQUEST', 2),
    heavy: heavyPolicy('REPAIR_REPLACE', 'maxCallsPerRequest', 1),
    lite: litePolicy('REPAIR_REPLACE', 'maxCallsPerRequest', 1, {
      maxConcurrent: 1,
      maxCallsPerWindow: 1,
    }),
    grounded: {
      maxCallsPerRequest: numberEnv('REPAIR_REPLACE_MAX_GROUNDED_CALLS_PER_REQUEST', 0),
    },
  },

  resale: {
    windowMs: numberEnv('RESALE_WINDOW_MS', DEFAULT_WINDOW_MS),
    maxCallsPerRequest: numberEnv('RESALE_MAX_CALLS_PER_REQUEST', 2),
    heavy: heavyPolicy('RESALE', 'maxCallsPerRequest', 0, {
      maxConcurrent: 0,
      maxCallsPerWindow: 0,
    }),
    lite: litePolicy('RESALE', 'maxCallsPerRequest', 2),
    grounded: {
      maxCallsPerRequest: numberEnv('RESALE_MAX_GROUNDED_CALLS_PER_REQUEST', 0),
    },
  },

  portfolio: {
    windowMs: numberEnv('PORTFOLIO_WINDOW_MS', DEFAULT_WINDOW_MS),
    maxCallsPerRequest: numberEnv('PORTFOLIO_MAX_CALLS_PER_REQUEST', 4),
    heavy: heavyPolicy('PORTFOLIO', 'maxCallsPerRequest', 1),
    lite: litePolicy('PORTFOLIO', 'maxCallsPerRequest', 3),
    grounded: {
      maxCallsPerRequest: numberEnv('PORTFOLIO_MAX_GROUNDED_CALLS_PER_REQUEST', 0),
    },
  },

  triage: {
    windowMs: numberEnv('TRIAGE_WINDOW_MS', DEFAULT_WINDOW_MS),
    maxCallsPerRequest: numberEnv('TRIAGE_MAX_CALLS_PER_REQUEST', 3),
    heavy: heavyPolicy('TRIAGE', 'maxCallsPerRequest', 1),
    lite: litePolicy('TRIAGE', 'maxCallsPerRequest', 2),
    grounded: {
      maxCallsPerRequest: numberEnv('TRIAGE_MAX_GROUNDED_CALLS_PER_REQUEST', 0),
    },
  },

  inventory: {
    windowMs: numberEnv('INVENTORY_WINDOW_MS', DEFAULT_WINDOW_MS),
    maxCallsPerRequest: numberEnv('INVENTORY_MAX_CALLS_PER_REQUEST', 1),
    heavy: heavyPolicy('INVENTORY', 'maxCallsPerRequest', 0, {
      maxConcurrent: 0,
      maxCallsPerWindow: 0,
    }),
    lite: litePolicy('INVENTORY', 'maxCallsPerRequest', 1, {
      maxConcurrent: 1,
      maxCallsPerWindow: 1,
    }),
    grounded: {
      maxCallsPerRequest: numberEnv('INVENTORY_MAX_GROUNDED_CALLS_PER_REQUEST', 0),
    },
  },

  sales: {
    windowMs: numberEnv('SALES_WINDOW_MS', DEFAULT_WINDOW_MS),
    maxCallsPerRequest: numberEnv('SALES_MAX_CALLS_PER_REQUEST', 2),
    heavy: heavyPolicy('SALES', 'maxCallsPerRequest', 1),
    lite: litePolicy('SALES', 'maxCallsPerRequest', 1, {
      maxConcurrent: 1,
      maxCallsPerWindow: 1,
    }),
    grounded: {
      maxCallsPerRequest: numberEnv('SALES_MAX_GROUNDED_CALLS_PER_REQUEST', 0),
    },
  },

  global: {
    windowMs: numberEnv('GEMINI_GLOBAL_WINDOW_MS', DEFAULT_WINDOW_MS),
    maxCallsPerRequest: Infinity,
    heavy: heavyPolicy('GEMINI_GLOBAL', 'maxCallsPerRequest', Infinity, {
      model: HEAVY_MODEL,
      maxConcurrent: numberEnv('GEMINI_GLOBAL_MAX_CONCURRENT', 6),
      maxCallsPerWindow: numberEnv('GEMINI_GLOBAL_MAX_CALLS_PER_WINDOW', 6),
    }),
    lite: litePolicy('GEMINI_GLOBAL', 'maxCallsPerRequest', Infinity, {
      model: LITE_MODEL,
      maxConcurrent: numberEnv('GEMINI_GLOBAL_MAX_CONCURRENT', 6),
      maxCallsPerWindow: numberEnv('GEMINI_GLOBAL_MAX_CALLS_PER_WINDOW', 6),
    }),
    grounded: {
      maxCallsPerRequest: Infinity,
    },
  },
};

export const GEMINI_GLOBAL_POLICY = {
  windowMs: numberEnv('GEMINI_GLOBAL_WINDOW_MS', DEFAULT_WINDOW_MS),
  maxConcurrent: numberEnv('GEMINI_GLOBAL_MAX_CONCURRENT', 6),
  maxCallsPerWindow: numberEnv('GEMINI_GLOBAL_MAX_CALLS_PER_WINDOW', 6),
};

const TOOL_ALIASES = {
  bom: 'bom',
  catalog: 'partsCatalog',
  partscatalog: 'partsCatalog',
  parts_catalog: 'partsCatalog',
  partfinder: 'partFinder',
  partsfinder: 'partFinder',
  parts: 'partFinder',
  diag: 'diagnosis',
  diagnosis: 'diagnosis',
  fix: 'diagnosis',
  ebay: 'ebay',
  market: 'market',
  identity: 'identity',
  image: 'identity',
  vision: 'identity',
  calculator: 'calculators',
  calculators: 'calculators',
  age: 'calculators',
  sizeguide: 'calculators',
  tempguide: 'calculators',
  repairreplace: 'repairReplace',
  repair_vs_replace: 'repairReplace',
  resale: 'resale',
  portfolio: 'portfolio',
  triage: 'triage',
  inventory: 'inventory',
  sales: 'sales',
  wholesale: 'sales',
  global: 'global',
};

const bucketStates = new Map();
const requestStates = new Map();
const globalState = {
  active: 0,
  calls: [],
};

export class GeminiBudgetExceededError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'GeminiBudgetExceededError';
    this.details = details;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowMs() {
  return Date.now();
}

function pruneWindow(calls, windowMs, now = nowMs()) {
  const cutoff = now - windowMs;
  while (calls.length > 0 && calls[0] <= cutoff) calls.shift();
}

function normalizeKey(value) {
  return String(value || '').trim().replace(/[-\s]+/g, '_').toLowerCase();
}

export function normalizeGeminiToolName(tool) {
  const key = normalizeKey(tool || 'global');
  return TOOL_ALIASES[key] || TOOL_ALIASES[key.replace(/_/g, '')] || 'global';
}

function tierFromBucket(bucket, model) {
  const text = String(bucket || '').toLowerCase();
  if (text.includes('lite')) return 'lite';
  if (text.includes('heavy')) return 'heavy';
  return String(model || '').toLowerCase().includes('lite') ? 'lite' : 'heavy';
}

function isGroundedBucket(bucket, grounded) {
  return Boolean(grounded || String(bucket || '').toLowerCase().includes('grounded'));
}

function scopedBucketKey(tool, bucket, tier, grounded) {
  const normalizedBucket = bucket || `${normalizeGeminiToolName(tool)}.${tier}${grounded ? '_grounded' : ''}`;
  return `${normalizeGeminiToolName(tool)}.${tier}${grounded ? '_grounded' : ''}:${normalizedBucket}`;
}

function getState(key) {
  if (!bucketStates.has(key)) {
    bucketStates.set(key, {
      active: 0,
      calls: [],
    });
  }
  return bucketStates.get(key);
}

function requestUnitKey(tool, context = {}) {
  const rawId =
    context.requestId ||
    context.jobId ||
    context.listingId ||
    context.itemId ||
    context.traceId ||
    null;

  return rawId ? `${normalizeGeminiToolName(tool)}:${String(rawId).slice(0, 120)}` : null;
}

function getRequestState(key) {
  const now = nowMs();
  if (!requestStates.has(key)) {
    requestStates.set(key, {
      createdAt: now,
      calls: 0,
      heavy: 0,
      lite: 0,
      grounded: 0,
    });
  }

  const state = requestStates.get(key);
  if (now - state.createdAt > 10 * 60 * 1000) {
    state.createdAt = now;
    state.calls = 0;
    state.heavy = 0;
    state.lite = 0;
    state.grounded = 0;
  }
  return state;
}

function requestLimitExceeded({ policy, tierPolicy, tier, grounded, requestKey }) {
  if (!requestKey) return null;

  const state = getRequestState(requestKey);
  const unitLimit = maxUnit(policy, {});
  const tierLimit = maxUnit(policy, tierPolicy);
  const groundedLimit = grounded ? maxUnit(policy, policy.grounded || {}) : Infinity;

  if (state.calls >= unitLimit) return `request call cap reached (${state.calls}/${unitLimit})`;
  if (state[tier] >= tierLimit) return `${tier} request cap reached (${state[tier]}/${tierLimit})`;
  if (grounded && state.grounded >= groundedLimit) {
    return `grounded request cap reached (${state.grounded}/${groundedLimit})`;
  }

  return null;
}

function reserveRequest({ tier, grounded, requestKey }) {
  if (!requestKey) return;
  const state = getRequestState(requestKey);
  state.calls += 1;
  state[tier] += 1;
  if (grounded) state.grounded += 1;
}

function rollbackRequest({ tier, grounded, requestKey }) {
  if (!requestKey) return;
  const state = getRequestState(requestKey);
  state.calls = Math.max(0, state.calls - 1);
  state[tier] = Math.max(0, state[tier] - 1);
  if (grounded) state.grounded = Math.max(0, state.grounded - 1);
}

function resolveRequestedModel(requestedModel, tierPolicy) {
  const model = String(requestedModel || '').trim();
  if (!model) return tierPolicy.model;

  if (model === HEAVY_MODEL || model === LITE_MODEL) return tierPolicy.model;
  return model;
}

export function resolveGeminiModelForTool({ tool = 'global', bucket = '', model = '', grounded = false } = {}) {
  const toolName = normalizeGeminiToolName(tool);
  const tier = tierFromBucket(bucket, model);
  const policy = TOOL_MODEL_POLICIES[toolName] || TOOL_MODEL_POLICIES.global;
  const tierPolicy = policy[tier] || policy.lite || TOOL_MODEL_POLICIES.global.lite;

  if (isGroundedBucket(bucket, grounded) && policy.grounded && maxUnit(policy, policy.grounded) <= 0) {
    return null;
  }

  return resolveRequestedModel(model, tierPolicy);
}

function validateBucketAllowed({ toolName, bucketKey, tier, tierPolicy }) {
  if ((tierPolicy.maxConcurrent ?? 0) <= 0 || (tierPolicy.maxCallsPerWindow ?? 0) <= 0) {
    throw new GeminiBudgetExceededError(`Gemini bucket ${bucketKey} is disabled.`, {
      tool: toolName,
      tier,
      bucket: bucketKey,
    });
  }
}

async function acquireSlot({ toolName, bucketKey, tier, grounded, policy, tierPolicy, requestKey, waitTimeoutMs }) {
  validateBucketAllowed({ toolName, bucketKey, tier, tierPolicy });

  const requestReason = requestLimitExceeded({ policy, tierPolicy, tier, grounded, requestKey });
  if (requestReason) {
    throw new GeminiBudgetExceededError(`Gemini ${toolName} budget exceeded: ${requestReason}.`, {
      tool: toolName,
      tier,
      bucket: bucketKey,
      requestKey,
    });
  }

  const bucketState = getState(bucketKey);
  const startedAt = nowMs();
  const policyWindowMs = policy.windowMs || DEFAULT_WINDOW_MS;
  const globalWindowMs = GEMINI_GLOBAL_POLICY.windowMs || DEFAULT_WINDOW_MS;

  while (true) {
    const now = nowMs();
    pruneWindow(bucketState.calls, policyWindowMs, now);
    pruneWindow(globalState.calls, globalWindowMs, now);

    const bucketOpen =
      bucketState.active < tierPolicy.maxConcurrent &&
      bucketState.calls.length < tierPolicy.maxCallsPerWindow;
    const globalOpen =
      globalState.active < GEMINI_GLOBAL_POLICY.maxConcurrent &&
      globalState.calls.length < GEMINI_GLOBAL_POLICY.maxCallsPerWindow;

    if (bucketOpen && globalOpen) {
      bucketState.active += 1;
      bucketState.calls.push(now);
      globalState.active += 1;
      globalState.calls.push(now);
      reserveRequest({ tier, grounded, requestKey });
      return;
    }

    if (now - startedAt >= waitTimeoutMs) {
      throw new GeminiBudgetExceededError(`Gemini ${toolName} budget wait timed out.`, {
        tool: toolName,
        tier,
        bucket: bucketKey,
        waitTimeoutMs,
        bucketActive: bucketState.active,
        globalActive: globalState.active,
      });
    }

    const bucketDelay = bucketState.calls.length
      ? Math.max(25, policyWindowMs - (now - bucketState.calls[0]) + 10)
      : 25;
    const globalDelay = globalState.calls.length
      ? Math.max(25, globalWindowMs - (now - globalState.calls[0]) + 10)
      : 25;
    await sleep(Math.min(250, bucketDelay, globalDelay));
  }
}

function releaseSlot(bucketKey) {
  const bucketState = getState(bucketKey);
  bucketState.active = Math.max(0, bucketState.active - 1);
  globalState.active = Math.max(0, globalState.active - 1);
}

function extractUsage(result) {
  const response = result?.response || result;
  const usage = response?.usageMetadata || response?.usage_metadata || null;
  if (!usage) return null;

  return {
    promptTokenCount: usage.promptTokenCount ?? usage.prompt_token_count ?? null,
    candidatesTokenCount: usage.candidatesTokenCount ?? usage.candidates_token_count ?? null,
    totalTokenCount: usage.totalTokenCount ?? usage.total_token_count ?? null,
  };
}

function logCall(entry) {
  if (process.env.GEMINI_POLICY_LOG === 'off') return;

  console.info('[gemini-policy]', JSON.stringify({
    event: 'gemini_call',
    ...entry,
  }));
}

function usageContext(context = {}) {
  const safeContext = context && typeof context === 'object' ? context : {};
  return {
    requestId: safeContext.requestId || null,
    jobId: safeContext.jobId || null,
    listingId: safeContext.listingId || null,
    itemId: safeContext.itemId || null,
    traceId: safeContext.traceId || null,
  };
}

export function getGeminiApiKey() {
  const key = cleanEnvValue(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  if (!key) throw new Error('Missing GEMINI API key');
  return key;
}

export function getGeminiClient() {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(getGeminiApiKey());
  }
  return geminiClient;
}

export async function runGeminiForTool({
  tool = 'global',
  bucket = '',
  model = '',
  grounded = false,
  requestContext = {},
  waitTimeoutMs = numberEnv('GEMINI_POLICY_WAIT_TIMEOUT_MS', DEFAULT_WAIT_TIMEOUT_MS),
} = {}, operation) {
  if (typeof operation !== 'function') {
    throw new TypeError('runGeminiForTool requires an operation function.');
  }

  const safeRequestContext = requestContext && typeof requestContext === 'object' ? requestContext : {};
  const toolName = normalizeGeminiToolName(tool);
  const tier = tierFromBucket(bucket, model);
  const policy = TOOL_MODEL_POLICIES[toolName] || TOOL_MODEL_POLICIES.global;
  const tierPolicy = policy[tier] || policy.lite || TOOL_MODEL_POLICIES.global.lite;
  const isGrounded = isGroundedBucket(bucket, grounded);
  const bucketKey = scopedBucketKey(toolName, bucket, tier, isGrounded);
  const requestKey = requestUnitKey(toolName, safeRequestContext);
  const resolvedModel = resolveRequestedModel(model, tierPolicy);
  const startedAt = nowMs();

  await acquireSlot({
    toolName,
    bucketKey,
    tier,
    grounded: isGrounded,
    policy,
    tierPolicy,
    requestKey,
    waitTimeoutMs,
  });

  try {
    const result = await operation({
      model: resolvedModel,
      tool: toolName,
      tier,
      bucket: bucketKey,
      requestKey,
    });

    logCall({
      tool: toolName,
      tier,
      bucket: bucketKey,
      model: resolvedModel,
      grounded: isGrounded,
      ok: true,
      latencyMs: nowMs() - startedAt,
      usage: extractUsage(result),
      route: safeRequestContext.route || null,
      requestKey,
      context: usageContext(safeRequestContext),
    });

    return result;
  } catch (error) {
    rollbackRequest({ tier, grounded: isGrounded, requestKey });
    logCall({
      tool: toolName,
      tier,
      bucket: bucketKey,
      model: resolvedModel,
      grounded: isGrounded,
      ok: false,
      latencyMs: nowMs() - startedAt,
      error: error instanceof Error ? error.name : 'Error',
      route: safeRequestContext.route || null,
      requestKey,
      context: usageContext(safeRequestContext),
    });
    throw error;
  } finally {
    releaseSlot(bucketKey);
  }
}
