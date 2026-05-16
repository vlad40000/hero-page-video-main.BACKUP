import 'server-only';

import { sql } from '@/lib/tools/parts/db';
import { normalizeModelNumber } from '@/lib/tools/parts/normalize';
import { normalizePartNumber } from '@/lib/tools/parts/http';
import { resolveEncompassPriceForPart } from '@/lib/tools/parts/pricing/encompass';

function nonEmpty(value) {
  const text = String(value || '').trim();
  return text || null;
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function toCents(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

function numberOrNull(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function sourceOf(input = {}) {
  return nonEmpty(input.source || input.preferredSource || input.preferred_source || input.firstSeenSource || input.lastSeenSource);
}

function partNumberOf(input = {}) {
  return normalizePartNumber(
    input.canonicalPartNumber ||
      input.canonical_part_number ||
      input.partNumber ||
      input.part_number ||
      input.rawPartNumber ||
      input.raw_part_number ||
      ''
  );
}

function partNameOf(input = {}) {
  return nonEmpty(
    input.canonicalPartName ||
      input.canonical_part_name ||
      input.partName ||
      input.part_name ||
      input.name ||
      input.rawPartName ||
      input.raw_part_name
  );
}

function categoryOf(input = {}) {
  return nonEmpty(input.normalizedCategory || input.normalized_category || input.category || input.rawCategory || input.raw_category);
}

function sectionOf(input = {}) {
  return nonEmpty(input.normalizedSection || input.normalized_section || input.section || input.sectionName || input.section_name);
}

function observedModelsOf(input = {}, fallbackModel = '') {
  return [
    input.canonicalModel,
    input.canonical_model,
    input.modelNumber,
    input.model_number,
    fallbackModel,
  ]
    .map((value) => normalizeModelNumber(String(value || '')))
    .filter(Boolean);
}

function providerRowsOf(input = {}) {
  const providerRows = input.providerRows || input.provider_rows;
  if (Array.isArray(providerRows) && providerRows.length > 0) return providerRows;

  const rawPayload = input.rawPayload || input.raw_payload;
  if (rawPayload) return [rawPayload];

  return [input].filter((row) => Object.keys(row || {}).length > 0);
}

function sourceConfidenceOf(input = {}, source = null) {
  const confidence = input.sourceConfidence || input.source_confidence;
  if (confidence && typeof confidence === 'object' && !Array.isArray(confidence)) return confidence;
  return source ? { [source]: { observed: true } } : {};
}

function rowToPartRegistryInput(part = {}, fallbackModel = '', fallbackSource = '') {
  const partNumber = partNumberOf(part);
  const source = sourceOf(part) || nonEmpty(fallbackSource);

  return {
    partNumber,
    rawPartNumber: nonEmpty(part.rawPartNumber || part.raw_part_number || part.partNumber || part.part_number || part.canonicalPartNumber || part.canonical_part_number) || partNumber,
    canonicalPartName: partNameOf(part),
    normalizedCategory: categoryOf(part),
    normalizedSection: sectionOf(part),
    observedModels: observedModelsOf(part, fallbackModel),
    substituteChain: asArray(part.substituteChain || part.substitute_chain || part.substitutes || part.substitutePartNumbers || part.substitute_part_numbers).map(normalizePartNumber).filter(Boolean),
    providerRows: providerRowsOf(part),
    sourceConfidence: sourceConfidenceOf(part, source),
    conflictFlags: asArray(part.conflictFlags || part.conflict_flags),
    firstSeenSource: source,
    lastSeenSource: source,
  };
}

function toPartRecord(row) {
  if (!row) return null;
  return {
    canonicalPartNumber: row.canonical_part_number,
    rawPartNumber: row.raw_part_number,
    canonicalPartName: row.canonical_part_name,
    normalizedCategory: row.normalized_category,
    normalizedSection: row.normalized_section,
    observedModels: row.observed_models || [],
    substituteChain: row.substitute_chain || [],
    providerRows: row.provider_rows || [],
    sourceConfidence: row.source_confidence || {},
    conflictFlags: row.conflict_flags || [],
    latestPriceCents: row.latest_price_cents,
    previousPriceCents: row.previous_price_cents,
    priceCurrency: row.price_currency || 'USD',
    priceSource: row.price_source,
    priceCheckedAt: row.price_checked_at,
    priceChangedAt: row.price_changed_at,
    pricePayload: row.price_payload || null,
    imageUrl: row.image_url || null,
    imageStatus: row.image_status || 'placeholder',
    imageSource: row.image_source || 'none',
    imageVerified: row.image_verified === true,
    imageUpdatedAt: row.image_updated_at || null,
    published: row.published === true,
    publishedAt: row.published_at || null,
    publishReason: row.publish_reason || null,
    validationConfidence: numberOrNull(row.validation_confidence),
    autoPublished: row.auto_published === true,
    autoPublishedAt: row.auto_published_at || null,
    autoPublishStatus: row.auto_publish_status || 'draft',
    autoPublishReason: row.auto_publish_reason || null,
    autoValidationConfidence: numberOrNull(row.auto_validation_confidence),
    autoPublishEvaluatedAt: row.auto_publish_evaluated_at || null,
    effectivePublishStatus: row.effective_publish_status || 'draft',
    effectivePublishSource: row.effective_publish_source || 'automatic_policy',
    adminPublishStatus: row.admin_publish_status || null,
    adminReviewStatus: row.admin_review_status || 'pending_admin_review',
    adminReviewRequired: row.admin_review_required !== false,
    adminReviewedAt: row.admin_reviewed_at || null,
    adminReviewedBy: row.admin_reviewed_by || null,
    adminReviewNotes: row.admin_review_notes || null,
    firstSeenSource: row.first_seen_source,
    lastSeenSource: row.last_seen_source,
    lookupCount: row.lookup_count || 0,
    lastLookupAt: row.last_lookup_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getPartNumberFromStore(partNumber, options = {}) {
  const canonicalPartNumber = normalizePartNumber(partNumber);
  if (!canonicalPartNumber) return null;

  try {
    const rows = await sql`
      SELECT *
      FROM part_number_registry
      WHERE canonical_part_number = ${canonicalPartNumber}
      LIMIT 1;
    `;

    if (rows.length === 0) return null;

    if (options.markLookup) {
      await sql`
        UPDATE part_number_registry
        SET lookup_count = lookup_count + 1,
            last_lookup_at = NOW(),
            updated_at = NOW()
        WHERE canonical_part_number = ${canonicalPartNumber};
      `;
    }

    return toPartRecord(rows[0]);
  } catch (error) {
    console.error('getPartNumberFromStore error', error);
    return null;
  }
}

export async function upsertPartNumberToStore(input = {}, options = {}) {
  const canonicalPartNumber = partNumberOf(input);
  if (!canonicalPartNumber) return null;

  const source = sourceOf(input);
  const observedModels = [...new Set(asArray(input.observedModels).map((value) => normalizeModelNumber(String(value || ''))).filter(Boolean))];
  const substituteChain = [...new Set(asArray(input.substituteChain).map(normalizePartNumber).filter(Boolean))];
  const providerRows = asArray(input.providerRows);
  const sourceConfidence = input.sourceConfidence && typeof input.sourceConfidence === 'object' ? input.sourceConfidence : sourceConfidenceOf(input, source);
  const conflictFlags = asArray(input.conflictFlags);

  try {
    await sql`
      INSERT INTO part_number_registry (
        canonical_part_number,
        raw_part_number,
        canonical_part_name,
        normalized_category,
        normalized_section,
        observed_models,
        substitute_chain,
        provider_rows,
        source_confidence,
        conflict_flags,
        first_seen_source,
        last_seen_source,
        updated_at
      )
      VALUES (
        ${canonicalPartNumber},
        ${nonEmpty(input.rawPartNumber) || canonicalPartNumber},
        ${nonEmpty(input.canonicalPartName)},
        ${nonEmpty(input.normalizedCategory)},
        ${nonEmpty(input.normalizedSection)},
        ${JSON.stringify(observedModels)}::jsonb,
        ${JSON.stringify(substituteChain)}::jsonb,
        ${JSON.stringify(providerRows)}::jsonb,
        ${JSON.stringify(sourceConfidence)}::jsonb,
        ${JSON.stringify(conflictFlags)}::jsonb,
        ${source},
        ${source},
        NOW()
      )
      ON CONFLICT (canonical_part_number) DO UPDATE SET
        raw_part_number = COALESCE(NULLIF(EXCLUDED.raw_part_number, ''), part_number_registry.raw_part_number),
        canonical_part_name = COALESCE(NULLIF(EXCLUDED.canonical_part_name, ''), part_number_registry.canonical_part_name),
        normalized_category = COALESCE(NULLIF(EXCLUDED.normalized_category, ''), part_number_registry.normalized_category),
        normalized_section = COALESCE(NULLIF(EXCLUDED.normalized_section, ''), part_number_registry.normalized_section),
        observed_models = (
          SELECT COALESCE(jsonb_agg(value), '[]'::jsonb)
          FROM (
            SELECT DISTINCT value
            FROM jsonb_array_elements_text(part_number_registry.observed_models || EXCLUDED.observed_models) AS merged(value)
            WHERE value <> ''
          ) AS deduped
        ),
        substitute_chain = (
          SELECT COALESCE(jsonb_agg(value), '[]'::jsonb)
          FROM (
            SELECT DISTINCT value
            FROM jsonb_array_elements_text(part_number_registry.substitute_chain || EXCLUDED.substitute_chain) AS merged(value)
            WHERE value <> ''
          ) AS deduped
        ),
        provider_rows = CASE
          WHEN jsonb_array_length(EXCLUDED.provider_rows) > 0 THEN EXCLUDED.provider_rows
          ELSE part_number_registry.provider_rows
        END,
        source_confidence = part_number_registry.source_confidence || EXCLUDED.source_confidence,
        conflict_flags = CASE
          WHEN jsonb_array_length(EXCLUDED.conflict_flags) > 0 THEN EXCLUDED.conflict_flags
          ELSE part_number_registry.conflict_flags
        END,
        last_seen_source = COALESCE(EXCLUDED.last_seen_source, part_number_registry.last_seen_source),
        updated_at = NOW();
    `;

    return options.returnRecord ? await getPartNumberFromStore(canonicalPartNumber) : null;
  } catch (error) {
    console.error('upsertPartNumberToStore error', error);
    return null;
  }
}

export async function refreshEncompassPriceForStoredPart(partNumber) {
  const canonicalPartNumber = normalizePartNumber(partNumber);
  if (!canonicalPartNumber) return null;

  try {
    const snapshot = await resolveEncompassPriceForPart({ partNumber: canonicalPartNumber });
    await applyEncompassPriceSnapshot(canonicalPartNumber, snapshot);
    return snapshot;
  } catch (error) {
    console.error('refreshEncompassPriceForStoredPart error', error);
    return null;
  }
}

export async function applyEncompassPriceSnapshot(partNumber, snapshot = null) {
  const canonicalPartNumber = normalizePartNumber(partNumber);
  if (!canonicalPartNumber) return null;

  const priceCents = toCents(snapshot?.retailPrice);
  const priceSource = nonEmpty(snapshot?.retailPriceSource) || 'supplier_catalog';

  try {
    await sql`
      UPDATE part_number_registry
      SET previous_price_cents = CASE
            WHEN ${priceCents}::integer IS NOT NULL
             AND latest_price_cents IS NOT NULL
             AND latest_price_cents <> ${priceCents}::integer
            THEN latest_price_cents
            ELSE previous_price_cents
          END,
          latest_price_cents = COALESCE(${priceCents}::integer, latest_price_cents),
          price_currency = 'USD',
          price_source = ${priceSource},
          price_checked_at = NOW(),
          price_changed_at = CASE
            WHEN ${priceCents}::integer IS NOT NULL
             AND (latest_price_cents IS NULL OR latest_price_cents <> ${priceCents}::integer)
            THEN NOW()
            ELSE price_changed_at
          END,
          price_payload = ${snapshot ? JSON.stringify(snapshot) : JSON.stringify({ verified: false, source: priceSource })}::jsonb,
          updated_at = NOW()
      WHERE canonical_part_number = ${canonicalPartNumber};
    `;
  } catch (error) {
    console.error('applyEncompassPriceSnapshot error', error);
  }

  return snapshot;
}

export async function ingestOrRefreshPartNumber(input = {}, options = {}) {
  const canonicalPartNumber = partNumberOf(input);
  if (!canonicalPartNumber) return null;

  const existing = await getPartNumberFromStore(canonicalPartNumber, { markLookup: true });

  await upsertPartNumberToStore({
    ...input,
    partNumber: canonicalPartNumber,
  });

  if (existing && options.refreshEncompassForExisting !== false) {
    await refreshEncompassPriceForStoredPart(canonicalPartNumber);
  } else if (!existing && options.refreshEncompassForNew !== false) {
    await refreshEncompassPriceForStoredPart(canonicalPartNumber);
  }

  return await getPartNumberFromStore(canonicalPartNumber);
}

export async function upsertPartNumbersForModel(canonicalModel, parts = [], sourceFallback = 'parts-context') {
  const model = normalizeModelNumber(String(canonicalModel || ''));
  const rows = (parts || [])
    .map((part) => rowToPartRegistryInput(part, model, sourceFallback))
    .filter((part) => part.partNumber);

  if (rows.length === 0) return;

  const CHUNK_SIZE = 25;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    await Promise.all(chunk.map((row) => upsertPartNumberToStore(row)));
  }
}
