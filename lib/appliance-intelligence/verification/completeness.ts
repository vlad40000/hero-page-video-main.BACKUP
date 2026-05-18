import {
  BomCompletionGateResult,
  BomCompletionInput,
  evaluateBomCompletion,
} from '@/lib/tools/parts/bom-completion-gates';

function readNumber(payload: any, keys: string[]): number | null {
  for (const key of keys) {
    const value = key.split('.').reduce((obj, part) => obj?.[part], payload);
    if (value === undefined || value === null || value === '') continue;
    const parsed = typeof value === 'number' ? value : Number(String(value).replace(/,/g, '').trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function hasIdentity(payload: any): boolean {
  return Boolean(
    payload?.identityResolved ||
    payload?.normalizedModel ||
    payload?.normalized_model ||
    payload?.model ||
    payload?.modelNumber ||
    payload?.model_number ||
    payload?.model_identity?.normalized_model ||
    payload?.modelIdentity?.normalizedModel,
  );
}

function toCompletionInput(payload: any): BomCompletionInput {
  const completeness = payload?.completeness || {};
  const bomData = payload?.bom_data || payload?.bomData || {};
  const reconciliation = payload?.reconciliation || {};
  const rows = Array.isArray(payload?.rows)
    ? payload.rows
    : Array.isArray(payload?.parts)
      ? payload.parts
      : [];

  return {
    identityResolved: hasIdentity(payload),
    failed: payload?.failed === true || payload?.status === 'failed',
    existingState: payload?.retrievalState || payload?.retrieval_state || payload?.status || completeness?.status,

    trustedTotalPartCount: readNumber(payload, [
      'trustedTotalPartCount',
      'trusted_total_part_count',
      'trustedTotalCount',
      'completeness.trustedTotalPartCount',
      'completeness.trusted_total_part_count',
    ]),
    expectedPartCount: readNumber(payload, [
      'expectedPartCount',
      'expected_total',
      'bom_data.expected_total',
      'bomData.expectedTotal',
      'completeness.expectedPartCount',
      'completeness.expected_total',
    ]),
    actualCanonicalPartCount: readNumber(payload, [
      'actualCanonicalPartCount',
      'actualPartCount',
      'uniqueRowCount',
      'unique_part_numbers_found',
      'bom_data.unique_part_numbers_found',
      'bomData.uniquePartNumbersFound',
      'completeness.actualCanonicalPartCount',
      'completeness.actualPartCount',
    ]) ?? rows.length,

    manifestRowCount: readNumber(payload, [
      'manifestRowCount',
      'manifest_row_count',
      'completeness.manifestRowCount',
      'completeness.manifest_row_count',
    ]) ?? readNumber(bomData, ['total_rows_found']),
    requiredManifestRowCount: readNumber(payload, [
      'requiredManifestRowCount',
      'required_manifest_row_count',
      'completeness.requiredManifestRowCount',
      'completeness.required_manifest_row_count',
    ]),
    mappedRequiredManifestRowCount: readNumber(payload, [
      'mappedRequiredManifestRowCount',
      'mapped_required_manifest_row_count',
      'completeness.mappedRequiredManifestRowCount',
      'completeness.mapped_required_manifest_row_count',
    ]),
    unresolvedRequiredManifestRowCount: readNumber(payload, [
      'unresolvedRequiredManifestRowCount',
      'unresolved_required_manifest_row_count',
      'completeness.unresolvedRequiredManifestRowCount',
      'completeness.unresolved_required_manifest_row_count',
    ]) ?? (Array.isArray(reconciliation?.missing_from_source) ? reconciliation.missing_from_source.length : null),

    requiredPriceCount: readNumber(payload, [
      'requiredPriceCount',
      'required_price_count',
      'completeness.requiredPriceCount',
      'completeness.required_price_count',
    ]),
    verifiedPriceCount: readNumber(payload, [
      'verifiedPriceCount',
      'verified_price_count',
      'completeness.verifiedPriceCount',
      'completeness.verified_price_count',
    ]),
    sourceCount: readNumber(payload, [
      'sourceCount',
      'source_count',
      'sources.length',
      'completeness.sourceCount',
    ]),
    sectionCount: readNumber(payload, [
      'sectionCount',
      'section_count',
      'sectionsFound.length',
      'bom_data.assemblies.length',
      'bomData.assemblies.length',
      'completeness.sectionCount',
      'completeness.section_count',
    ]),
  };
}

export function evaluateBomPayloadCompleteness(payload: any): BomCompletionGateResult {
  return evaluateBomCompletion(toCompletionInput(payload));
}

export function evaluateCompleteness(payload: any): boolean {
  return evaluateBomPayloadCompleteness(payload).bomComplete;
}
