import { sql } from '@/lib/tools/parts/db';
import { cleanText, normalizeModelToken, normalizePartNumber } from '@/lib/tools/parts/http';

function nonEmpty(value) {
  const text = cleanText(value);
  return text || null;
}

function arrayFromJson(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function jsonObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function centsRounded(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.round(numberValue * 100) / 100 : null;
}

function priceText(price) {
  return Number.isFinite(price) && price > 0 ? `$${price.toFixed(2)}` : null;
}

function uniqueStrings(values = []) {
  const out = [];
  const seen = new Set();

  for (const value of values) {
    const text = nonEmpty(value);
    if (!text) continue;

    const key = text.toUpperCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(text);
  }

  return out;
}

function sourceName(value, fallback) {
  return nonEmpty(value)?.toLowerCase() || fallback;
}

function partSource(row = {}, fallback) {
  return (
    nonEmpty(row.preferredSource) ||
    nonEmpty(row.preferred_source) ||
    nonEmpty(row.priceSource) ||
    nonEmpty(row.price_source) ||
    nonEmpty(row.source) ||
    nonEmpty(row.provider) ||
    fallback
  );
}

function partUrl(row = {}) {
  return (
    nonEmpty(row.retailPricingUrl) ||
    nonEmpty(row.retail_pricing_url) ||
    nonEmpty(row.price_url) ||
    nonEmpty(row.product_url) ||
    nonEmpty(row.provider_model_url) ||
    nonEmpty(row.provider_assembly_url) ||
    nonEmpty(row.diagram_url) ||
    null
  );
}

function normalizeWarehousePart(row = {}, sourceTable = 'parts_warehouse') {
  const rawPartNumber =
    row.canonicalPartNumber ||
    row.canonical_part_number ||
    row.partNumber ||
    row.part_number ||
    row.rawPartNumber ||
    row.raw_part_number ||
    row.current_service_part_number ||
    row.original_part_number;
  const partNumber = normalizePartNumber(rawPartNumber);
  if (!partNumber) return null;

  const name =
    nonEmpty(row.canonicalPartName) ||
    nonEmpty(row.canonical_part_name) ||
    nonEmpty(row.partName) ||
    nonEmpty(row.part_name) ||
    nonEmpty(row.name) ||
    nonEmpty(row.description) ||
    nonEmpty(row.rawPartName) ||
    nonEmpty(row.raw_part_name) ||
    partNumber;
  const section =
    nonEmpty(row.normalizedSection) ||
    nonEmpty(row.normalized_section) ||
    nonEmpty(row.section) ||
    nonEmpty(row.sectionName) ||
    nonEmpty(row.section_name) ||
    nonEmpty(row.section_name_clean) ||
    nonEmpty(row.section_label_raw) ||
    'General';
  const category =
    nonEmpty(row.normalizedCategory) ||
    nonEmpty(row.normalized_category) ||
    nonEmpty(row.category) ||
    nonEmpty(row.rawCategory) ||
    nonEmpty(row.raw_category) ||
    section;
  const source = partSource(row, sourceTable);
  const retailPrice = centsRounded(
    row.retailPrice ||
      row.retail_price ||
      row.price ||
      row.listed_price ||
      row.sellPrice
  );
  const retailPricingUrl = partUrl(row);
  const substitutes = uniqueStrings([
    row.substitutePartNumber,
    row.substitute_part_number,
    row.replacement_part_number,
    row.replacementPartNumber,
    row.current_service_part_number && normalizePartNumber(row.current_service_part_number) !== partNumber
      ? row.current_service_part_number
      : null,
    row.original_part_number && normalizePartNumber(row.original_part_number) !== partNumber
      ? row.original_part_number
      : null,
  ]).map((value) => normalizePartNumber(value));

  const providerRow = {
    ...row,
    source,
    section_name: section,
    sectionName: section,
    raw_part_number: partNumber,
    rawPartNumber: partNumber,
    raw_part_name: name,
    rawPartName: name,
    raw_category: category,
    rawCategory: category,
    evidenceUrl: retailPricingUrl,
  };

  return {
    canonicalPartNumber: partNumber,
    canonicalPartName: name,
    normalizedCategory: category,
    normalizedSection: section,
    preferredSource: source,
    partNumber,
    name,
    category,
    section,
    source,
    substitutes,
    substitutePartNumbers: substitutes,
    quantity: row.quantity || null,
    diagramRef: row.diagramRef || row.diagram_ref || row.diagram_number || null,
    serialApplicability: Array.isArray(row.serialApplicability)
      ? row.serialApplicability
      : Array.isArray(row.serial_applicability)
      ? row.serial_applicability
      : [],
    conflictFlags: Array.isArray(row.conflictFlags)
      ? row.conflictFlags
      : Array.isArray(row.conflict_flags)
      ? row.conflict_flags
      : [],
    providerRows: [providerRow],
    sourceConfidence: {
      [source]: {
        observed: true,
        sourceTable,
      },
    },
    hasConflicts: false,
    retailPrice,
    retailPriceText:
      nonEmpty(row.retailPriceText) ||
      nonEmpty(row.retail_price_text) ||
      priceText(retailPrice),
    retailAvailability:
      nonEmpty(row.retailAvailability) ||
      nonEmpty(row.retail_availability) ||
      nonEmpty(row.availability) ||
      null,
    retailPricingUrl,
    retailPriceSource:
      nonEmpty(row.retailPriceSource) ||
      nonEmpty(row.retail_price_source) ||
      nonEmpty(row.priceSource) ||
      source,
    retailPriceVerified: Boolean(retailPrice),
  };
}

function mergeParts(existing, incoming) {
  const providerRows = [
    ...(Array.isArray(existing.providerRows) ? existing.providerRows : []),
    ...(Array.isArray(incoming.providerRows) ? incoming.providerRows : []),
  ];
  const substitutes = uniqueStrings([
    ...(Array.isArray(existing.substitutes) ? existing.substitutes : []),
    ...(Array.isArray(incoming.substitutes) ? incoming.substitutes : []),
  ]);
  const betterPrice = incoming.retailPriceVerified && !existing.retailPriceVerified;

  return {
    ...existing,
    canonicalPartName:
      incoming.canonicalPartName && incoming.canonicalPartName.length > existing.canonicalPartName.length
        ? incoming.canonicalPartName
        : existing.canonicalPartName,
    normalizedCategory: existing.normalizedCategory || incoming.normalizedCategory,
    normalizedSection: existing.normalizedSection || incoming.normalizedSection,
    preferredSource: existing.preferredSource || incoming.preferredSource,
    name:
      incoming.name && incoming.name.length > existing.name.length
        ? incoming.name
        : existing.name,
    category: existing.category || incoming.category,
    section: existing.section || incoming.section,
    source: existing.source || incoming.source,
    substitutes,
    substitutePartNumbers: substitutes,
    providerRows,
    retailPrice: betterPrice ? incoming.retailPrice : existing.retailPrice,
    retailPriceText: betterPrice ? incoming.retailPriceText : existing.retailPriceText,
    retailAvailability: betterPrice ? incoming.retailAvailability : existing.retailAvailability,
    retailPricingUrl: betterPrice ? incoming.retailPricingUrl : existing.retailPricingUrl,
    retailPriceSource: betterPrice ? incoming.retailPriceSource : existing.retailPriceSource,
    retailPriceVerified: Boolean(existing.retailPriceVerified || incoming.retailPriceVerified),
  };
}

function normalizeParts(rows = [], sourceTable) {
  const byNumber = new Map();

  for (const row of rows) {
    const part = normalizeWarehousePart(row, sourceTable);
    if (!part) continue;

    const existing = byNumber.get(part.canonicalPartNumber);
    byNumber.set(part.canonicalPartNumber, existing ? mergeParts(existing, part) : part);
  }

  return [...byNumber.values()].sort((a, b) => (
    `${a.normalizedSection || ''} ${a.canonicalPartName}`.localeCompare(`${b.normalizedSection || ''} ${b.canonicalPartName}`)
  ));
}

function countSections(parts = []) {
  return new Set(parts.map((part) => nonEmpty(part.normalizedSection || part.section)).filter(Boolean)).size;
}

function statusFromRow(row = {}, parts = []) {
  const state = String(row.retrieval_state || row.status || '').trim().toLowerCase();
  if (['bom_complete', 'complete', 'target_met'].includes(state)) return 'bom_complete';
  if (row.parts_complete === true || row.bom_complete === true) return 'bom_complete';
  if (!parts.length) return 'no_result';
  return 'parts_partial';
}

function numberFromRow(...values) {
  for (const value of values) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }

  return 0;
}

function fallbackSourcesFromRow(row = {}) {
  const value = row.fallback_sources;
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') return arrayFromJson(value);
  return [];
}

function sourceSummarySources(row = {}) {
  const summary = jsonObject(row.source_summary);
  const out = [];

  for (const [key, value] of Object.entries(summary)) {
    if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
      out.push({ title: key, uri: value });
    } else if (value && typeof value === 'object') {
      const uri = nonEmpty(value.url || value.uri || value.sourceUrl);
      if (uri) out.push({ title: key, uri });
    }
  }

  return out;
}

function buildSources(row = {}, profile = {}, sourceTable) {
  const sources = [
    { title: sourceTable, uri: '' },
    ...sourceSummarySources(row),
    ...(profile.encompassUrls || []).map((item) => ({
      title: `encompass:${item.brand || item.encompass_route || 'model-url'}`,
      uri: item.url,
    })),
    ...(profile.providerRoutes || []).flatMap((item) => ([
      item.provider_model_url ? { title: `${item.provider || 'provider'} model route`, uri: item.provider_model_url } : null,
      item.provider_assembly_url ? { title: `${item.provider || 'provider'} assembly route`, uri: item.provider_assembly_url } : null,
    ].filter(Boolean))),
    ...(profile.modelSourceUrls || []).map((item) => ({
      title: `${item.source || 'source'} ${item.url_type || 'url'}`,
      uri: item.url,
    })),
  ];
  const seen = new Set();

  return sources.filter((source) => {
    const key = `${source.title || ''}|${source.uri || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return source.title || source.uri;
  });
}

async function optionalRows(label, queryPromise) {
  try {
    return await queryPromise;
  } catch (error) {
    console.error(`warehouse ${label} error`, error);
    return [];
  }
}

export async function getWarehouseModelProfile(normalizedModel) {
  const model = normalizeModelToken(normalizedModel);
  if (!model) {
    return {
      model: null,
      encompassUrls: [],
      providerRoutes: [],
      modelSourceUrls: [],
    };
  }

  const [modelRows, encompassUrls, providerRoutes, modelSourceUrls] = await Promise.all([
    optionalRows('appliance_models', sql`
      SELECT
        id,
        normalized_model,
        raw_model,
        brand,
        product_type,
        appliance_type,
        trusted_total_part_count,
        expected_part_count,
        actual_part_count,
        actual_canonical_part_count,
        retrieval_state,
        bom_complete,
        parts_complete,
        pricing_complete,
        truth_source,
        truth_source_url,
        updated_at
      FROM appliance_models
      WHERE upper(regexp_replace(coalesce(normalized_model, model_number, raw_model, ''), '[^A-Za-z0-9]', '', 'g')) = ${model}
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 1;
    `),
    optionalRows('encompass_model_urls', sql`
      SELECT brand, encompass_route, encompass_id, normalized_model, model_number, url, created_at
      FROM encompass_model_urls
      WHERE upper(regexp_replace(coalesce(normalized_model, model_number, ''), '[^A-Za-z0-9]', '', 'g')) = ${model}
      ORDER BY created_at DESC NULLS LAST
      LIMIT 5;
    `),
    optionalRows('provider_model_routes', sql`
      SELECT provider, provider_model_url, provider_assembly_url, source_status, updated_at
      FROM provider_model_routes
      WHERE upper(regexp_replace(coalesce(model, ''), '[^A-Za-z0-9]', '', 'g')) = ${model}
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 5;
    `),
    optionalRows('model_source_urls', sql`
      SELECT msu.source, msu.url_type, msu.url, msu.status, msu.last_checked_at
      FROM model_source_urls msu
      INNER JOIN appliance_models am ON am.id = msu.model_id
      WHERE upper(regexp_replace(coalesce(am.normalized_model, am.model_number, am.raw_model, ''), '[^A-Za-z0-9]', '', 'g')) = ${model}
      ORDER BY msu.last_checked_at DESC NULLS LAST
      LIMIT 5;
    `),
  ]);

  return {
    model: modelRows[0] || null,
    encompassUrls,
    providerRoutes,
    modelSourceUrls,
  };
}

async function buildModelPayload({ normalizedModel, rawModel, row, sourceTable, parts }) {
  const normalizedParts = normalizeParts(parts, sourceTable);
  if (!normalizedParts.length) return null;

  const profile = await getWarehouseModelProfile(normalizedModel);
  const profileModel = profile.model || {};
  const sectionCount = countSections(normalizedParts);
  const status = statusFromRow({ ...profileModel, ...row }, normalizedParts);
  const expectedPartsTotal = numberFromRow(
    row.expected_parts_total,
    row.trusted_total_part_count,
    profileModel.trusted_total_part_count,
    profileModel.expected_part_count
  );
  const actualUniqueParts = numberFromRow(
    row.actual_unique_parts,
    row.actual_canonical_part_count,
    profileModel.actual_canonical_part_count,
    profileModel.actual_part_count,
    normalizedParts.length
  );
  const coveragePct = numberFromRow(row.coverage_pct);
  const completenessScore = coveragePct || (expectedPartsTotal > 0 ? Math.round((actualUniqueParts / expectedPartsTotal) * 100) : 0);
  const truthSource =
    nonEmpty(row.truth_source) ||
    nonEmpty(profileModel.truth_source) ||
    nonEmpty(row.source_strategy) ||
    sourceTable;

  return {
    summary:
      nonEmpty(row.summary) ||
      `Stored parts intelligence for ${rawModel || normalizedModel} from ${sourceTable}.`,
    status,
    parts: normalizedParts,
    sources: buildSources(row, profile, sourceTable),
    canonicalModel:
      nonEmpty(row.normalized_model) ||
      nonEmpty(row.model) ||
      nonEmpty(profileModel.normalized_model) ||
      normalizedModel,
    brand: nonEmpty(row.brand) || nonEmpty(profileModel.brand) || null,
    productType:
      nonEmpty(row.category) ||
      nonEmpty(row.appliance_type) ||
      nonEmpty(profileModel.product_type) ||
      nonEmpty(profileModel.appliance_type) ||
      null,
    truthSource,
    sourceStrategy: nonEmpty(row.source_strategy) || sourceName(truthSource, 'warehouse-cache'),
    fallbackSources: fallbackSourcesFromRow(row),
    providerPlan: {
      source: 'parts-warehouse',
      cacheTable: sourceTable,
      profile,
    },
    completeness: {
      score: completenessScore,
      rawRowCount: numberFromRow(row.raw_row_count, row.actual_unique_parts, normalizedParts.length),
      masterRowCount: normalizedParts.length,
      sectionCount,
      flags: [],
      expectedPartsTotal,
      actualUniqueParts,
      partsComplete: row.parts_complete === true || profileModel.parts_complete === true,
      bomComplete: row.bom_complete === true || profileModel.bom_complete === true,
      pricingComplete: row.pricing_complete === true || profileModel.pricing_complete === true,
      cacheTable: sourceTable,
    },
    updatedAt: row.updated_at || row.last_verified_at || profileModel.updated_at || null,
  };
}

async function findModelPartsCache(model) {
  const rows = await optionalRows('model_parts_cache lookup', sql`
    SELECT
      normalized_model,
      brand,
      category,
      parts,
      updated_at,
      retrieval_state,
      expected_parts_total,
      actual_unique_parts,
      coverage_pct,
      source_strategy,
      source_summary,
      appliance_type,
      truth_source,
      fallback_sources,
      trusted_total_part_count,
      actual_canonical_part_count,
      parts_complete
    FROM model_parts_cache
    WHERE upper(regexp_replace(coalesce(normalized_model, ''), '[^A-Za-z0-9]', '', 'g')) = ${model}
    ORDER BY updated_at DESC NULLS LAST
    LIMIT 1;
  `);
  const row = rows[0];
  if (!row) return null;

  return buildModelPayload({
    normalizedModel: model,
    rawModel: row.normalized_model || model,
    row,
    sourceTable: 'model_parts_cache',
    parts: arrayFromJson(row.parts),
  });
}

async function findApplianceBom(model) {
  const rows = await optionalRows('appliance_boms lookup', sql`
    SELECT model, parts, msrp, recall_count, updated_at
    FROM appliance_boms
    WHERE upper(regexp_replace(coalesce(model, ''), '[^A-Za-z0-9]', '', 'g')) = ${model}
    ORDER BY updated_at DESC NULLS LAST
    LIMIT 1;
  `);
  const row = rows[0];
  if (!row) return null;

  return buildModelPayload({
    normalizedModel: model,
    rawModel: row.model || model,
    row,
    sourceTable: 'appliance_boms',
    parts: arrayFromJson(row.parts),
  });
}

async function findMasterParts(model) {
  const rows = await optionalRows('model_parts_master lookup', sql`
    SELECT
      canonical_model,
      canonical_part_number,
      canonical_part_name,
      normalized_section,
      normalized_category,
      preferred_source,
      substitute_chain,
      serial_applicability,
      source_confidence,
      conflict_flags,
      provider_rows,
      updated_at
    FROM model_parts_master
    WHERE upper(regexp_replace(coalesce(canonical_model, ''), '[^A-Za-z0-9]', '', 'g')) = ${model}
    ORDER BY normalized_section, canonical_part_name;
  `);
  if (!rows.length) return null;

  return buildModelPayload({
    normalizedModel: model,
    rawModel: model,
    row: {
      normalized_model: model,
      status: 'bom_complete',
      truth_source: 'model_parts_master',
      actual_unique_parts: rows.length,
      updated_at: rows[0]?.updated_at,
      parts_complete: true,
    },
    sourceTable: 'model_parts_master',
    parts: rows,
  });
}

async function findProviderSeedRows(model) {
  const rows = await optionalRows('provider_part_seed_rows lookup', sql`
    SELECT
      brand,
      model,
      appliance_type,
      fuel_type,
      provider,
      provider_model_url,
      provider_assembly_url,
      diagram_url,
      section_label_raw,
      section_name_clean,
      normalized_section,
      diagram_number,
      original_part_number,
      current_service_part_number,
      description,
      nla_status,
      replacement_note,
      image_url,
      source_status,
      created_at
    FROM provider_part_seed_rows
    WHERE upper(regexp_replace(coalesce(model, ''), '[^A-Za-z0-9]', '', 'g')) = ${model}
    ORDER BY source_row ASC NULLS LAST, created_at DESC NULLS LAST
    LIMIT 300;
  `);
  if (!rows.length) return null;

  return buildModelPayload({
    normalizedModel: model,
    rawModel: rows[0]?.model || model,
    row: {
      normalized_model: model,
      brand: rows[0]?.brand,
      appliance_type: rows[0]?.appliance_type,
      truth_source: 'provider_part_seed_rows',
      source_strategy: 'operator-seeded-provider-bom',
      actual_unique_parts: rows.length,
      updated_at: rows[0]?.created_at,
    },
    sourceTable: 'provider_part_seed_rows',
    parts: rows,
  });
}

export async function findWarehouseModelCache(normalizedModel) {
  const model = normalizeModelToken(normalizedModel);
  if (!model) return null;

  try {
    return (
      (await findModelPartsCache(model)) ||
      (await findApplianceBom(model)) ||
      (await findMasterParts(model)) ||
      (await findProviderSeedRows(model))
    );
  } catch (error) {
    console.error('findWarehouseModelCache error', error);
    return null;
  }
}

function snapshotFromRow(row, sourceTable) {
  if (!row) return null;

  const retailPrice = centsRounded(row.listed_price || row.price);
  if (!retailPrice) return null;

  const source =
    nonEmpty(row.primary_source) ||
    nonEmpty(row.source) ||
    sourceTable;
  const url = nonEmpty(row.product_url) || nonEmpty(row.price_url) || null;
  const checkedAt =
    row.checked_at ||
    row.captured_at ||
    row.source_observed_at ||
    new Date().toISOString();

  return {
    partNumber: normalizePartNumber(row.part_number),
    retailPrice,
    retailPriceText: priceText(retailPrice),
    retailAvailability: nonEmpty(row.availability),
    retailPricingUrl: url,
    retailPriceSource: source,
    retailPriceVerified: true,
    retailPricedAt: checkedAt instanceof Date ? checkedAt.toISOString() : checkedAt,
    priceCacheHit: true,
    priceCacheTable: sourceTable,
    pricingEvidence: [{
      supplier: source,
      method: sourceTable,
      url,
      partMentioned: true,
      priceFound: true,
      checkedAt: checkedAt instanceof Date ? checkedAt.toISOString() : checkedAt,
      raw: row.raw || null,
    }],
  };
}

async function findPartPriceSnapshot(partNumber, model) {
  const rows = await optionalRows('part_price_snapshot lookup', sql`
    SELECT
      part_number,
      normalized_model,
      primary_source,
      listed_price,
      currency,
      availability,
      product_url,
      product_title,
      match_type,
      price_status,
      checked_at,
      source_observed_at,
      raw
    FROM part_price_snapshot
    WHERE upper(regexp_replace(coalesce(part_number, ''), '[^A-Za-z0-9]', '', 'g')) = ${partNumber}
      AND (
        ${model || null}::text IS NULL
        OR coalesce(normalized_model, '') = ''
        OR upper(regexp_replace(coalesce(normalized_model, ''), '[^A-Za-z0-9]', '', 'g')) = ${model}
      )
    ORDER BY
      CASE
        WHEN ${model || null}::text IS NOT NULL
          AND upper(regexp_replace(coalesce(normalized_model, ''), '[^A-Za-z0-9]', '', 'g')) = ${model}
        THEN 0
        ELSE 1
      END,
      checked_at DESC NULLS LAST
    LIMIT 1;
  `);

  return snapshotFromRow(rows[0], 'part_price_snapshot');
}

async function findPartPricing(partNumber, model) {
  const scopedRows = model
    ? await optionalRows('part_pricing scoped lookup', sql`
        SELECT
          pp.part_number,
          pp.price,
          pp.currency,
          pp.availability,
          pp.price_url,
          pp.source,
          pp.captured_at,
          am.normalized_model
        FROM part_pricing pp
        INNER JOIN appliance_models am ON am.id = pp.model_id
        WHERE upper(regexp_replace(coalesce(pp.part_number, ''), '[^A-Za-z0-9]', '', 'g')) = ${partNumber}
          AND upper(regexp_replace(coalesce(am.normalized_model, am.model_number, am.raw_model, ''), '[^A-Za-z0-9]', '', 'g')) = ${model}
        ORDER BY pp.captured_at DESC NULLS LAST
        LIMIT 1;
      `)
    : [];
  const scoped = snapshotFromRow(scopedRows[0], 'part_pricing');
  if (scoped) return scoped;

  const fallbackRows = await optionalRows('part_pricing fallback lookup', sql`
    SELECT part_number, price, currency, availability, price_url, source, captured_at
    FROM part_pricing
    WHERE upper(regexp_replace(coalesce(part_number, ''), '[^A-Za-z0-9]', '', 'g')) = ${partNumber}
    ORDER BY captured_at DESC NULLS LAST
    LIMIT 1;
  `);

  return snapshotFromRow(fallbackRows[0], 'part_pricing');
}

export async function getStoredPriceSnapshot(partNumber, options = {}) {
  const normalizedPartNumber = normalizePartNumber(partNumber);
  if (!normalizedPartNumber) return null;

  const model = normalizeModelToken(options.modelNumber || options.normalizedModel || '');

  try {
    return (
      (await findPartPriceSnapshot(normalizedPartNumber, model)) ||
      (await findPartPricing(normalizedPartNumber, model))
    );
  } catch (error) {
    console.error('getStoredPriceSnapshot error', error);
    return null;
  }
}

export async function getPartMarketSignal(partNumber, options = {}) {
  const normalizedPartNumber = normalizePartNumber(partNumber);
  if (!normalizedPartNumber) return null;

  const model = normalizeModelToken(options.modelNumber || options.normalizedModel || '');

  try {
    const rows = await optionalRows('part_market_signal lookup', sql`
      SELECT
        part_number,
        normalized_model,
        ebay_active_count,
        ebay_sold_count,
        sell_through_rate,
        median_sold_price,
        average_sold_price,
        active_min_price,
        active_max_price,
        net_expected,
        confidence,
        warnings,
        checked_at,
        raw
      FROM part_market_signal
      WHERE upper(regexp_replace(coalesce(part_number, ''), '[^A-Za-z0-9]', '', 'g')) = ${normalizedPartNumber}
        AND (
          ${model || null}::text IS NULL
          OR coalesce(normalized_model, '') = ''
          OR upper(regexp_replace(coalesce(normalized_model, ''), '[^A-Za-z0-9]', '', 'g')) = ${model}
        )
      ORDER BY
        CASE
          WHEN ${model || null}::text IS NOT NULL
            AND upper(regexp_replace(coalesce(normalized_model, ''), '[^A-Za-z0-9]', '', 'g')) = ${model}
          THEN 0
          ELSE 1
        END,
        checked_at DESC NULLS LAST
      LIMIT 1;
    `);

    return rows[0] || null;
  } catch (error) {
    console.error('getPartMarketSignal error', error);
    return null;
  }
}
