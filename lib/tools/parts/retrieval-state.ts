export const BOM_RETRIEVAL_STATES = [
  'no_result',
  'identity_only',
  'sources_resolved',
  'parts_partial',
  'parts_complete_pricing_missing',
  'parts_complete_pricing_partial',
  'bom_complete',
  'failed',
] as const;

export type BomRetrievalState = typeof BOM_RETRIEVAL_STATES[number];

const STATE_SET = new Set<string>(BOM_RETRIEVAL_STATES);

export const BOM_RETRIEVAL_STATE_LABELS: Record<BomRetrievalState, string> = {
  no_result: 'No result',
  identity_only: 'Identity only',
  sources_resolved: 'Sources resolved',
  parts_partial: 'Parts partial',
  parts_complete_pricing_missing: 'Parts complete — pricing missing',
  parts_complete_pricing_partial: 'Parts complete — pricing partial',
  bom_complete: 'BOM complete',
  failed: 'Failed',
};

export const BOM_RETRIEVAL_STATE_DESCRIPTIONS: Record<BomRetrievalState, string> = {
  no_result: 'No usable appliance identity or source result has been established.',
  identity_only: 'The appliance identity is known, but no trusted source manifest or part rows are available yet.',
  sources_resolved: 'One or more candidate sources were found, but the BOM rows are not yet usable.',
  parts_partial: 'Some part rows exist, but coverage does not satisfy the trusted expected count or manifest coverage gate.',
  parts_complete_pricing_missing: 'Required part coverage is complete, but no verified retail pricing coverage has been established.',
  parts_complete_pricing_partial: 'Required part coverage is complete, and some verified retail pricing exists, but pricing coverage is incomplete.',
  bom_complete: 'Required part coverage and verified pricing coverage are complete.',
  failed: 'The retrieval pipeline failed or exhausted usable fallback paths.',
};

export const BOM_RETRIEVAL_TERMINAL_STATES = new Set<BomRetrievalState>([
  'no_result',
  'bom_complete',
  'failed',
]);

export function isBomRetrievalState(value: unknown): value is BomRetrievalState {
  return typeof value === 'string' && STATE_SET.has(value);
}

export function normalizeBomRetrievalState(
  value: unknown,
  fallback: BomRetrievalState = 'no_result',
): BomRetrievalState {
  if (isBomRetrievalState(value)) return value;

  const legacy = String(value || '').trim().toLowerCase();

  if (legacy === 'empty' || legacy === 'zero_rows') return 'no_result';
  if (legacy === 'blocked') return 'failed';
  if (legacy === 'below_floor' || legacy === 'partial' || legacy === 'needs_fallback') return 'parts_partial';
  if (legacy === 'target_met' || legacy === 'complete') return 'parts_complete_pricing_missing';
  if (legacy === 'synthesis_complete' || legacy === 'diagram_parsed') return 'parts_partial';
  if (legacy === 'bom_near_complete') return 'parts_complete_pricing_partial';

  return fallback;
}

export function isPubliclyCompleteBomState(state: BomRetrievalState): boolean {
  return state === 'bom_complete';
}

export function canReuseBomCacheState(state: BomRetrievalState): boolean {
  return state === 'bom_complete'
    || state === 'parts_complete_pricing_missing'
    || state === 'parts_complete_pricing_partial';
}

export function shouldContinueBomRetrieval(state: BomRetrievalState): boolean {
  return state === 'identity_only'
    || state === 'sources_resolved'
    || state === 'parts_partial'
    || state === 'parts_complete_pricing_missing'
    || state === 'parts_complete_pricing_partial';
}
