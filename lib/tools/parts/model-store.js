import { sql } from '@/lib/tools/parts/db';
import { findWarehouseModelCache } from '@/lib/tools/parts/warehouse-store';
import { evaluateModelCacheEligibility } from '@/lib/appliance-intelligence/verification/cache-eligibility';

/**
 * Repository for model-first appliance parts persistence.
 */

export function isReusableModelCache(payload, options = {}) {
  const parts = Array.isArray(payload?.parts) ? payload.parts : [];
  if (parts.length === 0) return false;

  const minParts = Number(options.minParts || 20);
  const status = String(payload?.status || '').trim().toLowerCase();
  const completeness = payload?.completeness || {};
  const sectionCount = Number(completeness.sectionCount || 0);
  const completeStatus = ['bom_complete', 'complete', 'target_met'].includes(status);
  const completeFlags = Boolean(completeness.partsComplete || completeness.bomComplete);
  const scoreComplete = Number(completeness.score || 0) >= 90;

  return sectionCount > 0 && (
    parts.length >= minParts ||
    ((completeStatus || completeFlags || scoreComplete) && parts.length >= 5)
  );
}

function toModelStorePayload(row) {
  return {
    summary: row.summary || '',
    status: row.status || null,
    parts: Array.isArray(row.parts) ? row.parts : [],
    sources: Array.isArray(row.sources) ? row.sources : [],
    canonicalModel: row.canonical_model,
    truthSource: row.truth_source || 'Manufacturer-first',
    sourceStrategy: row.source_strategy || 'manufacturer-first',
    fallbackSources: row.fallback_sources || [],
    providerPlan: row.provider_plan_json || null,
    completeness: {
      score: row.completeness_score || 0,
      rawRowCount: row.raw_row_count || 0,
      masterRowCount: row.master_row_count || 0,
      sectionCount: row.section_count || 0,
      flags: row.conflict_flags || [],
      cacheTable: 'appliance_parts_cache',
    },
    updatedAt: row.updated_at,
  };
}

export async function findModelInStore(normalizedModel) {
  try {
    const rows = await sql`
      SELECT 
        summary, 
        status,
        parts_json as parts, 
        sources_json as sources, 
        canonical_model,
        completeness_score,
        raw_row_count,
        master_row_count,
        section_count,
        truth_source,
        source_strategy,
        fallback_sources,
        provider_plan_json,
        conflict_flags,
        updated_at
      FROM appliance_parts_cache
      WHERE normalized_model = ${normalizedModel}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return await findWarehouseModelCache(normalizedModel);
    }

    sql`
      UPDATE appliance_parts_cache
      SET last_used_at = NOW()
      WHERE normalized_model = ${normalizedModel};
    `.catch((e) => console.error('Last used update error', e));

    const primary = toModelStorePayload(rows[0]);
    if (isReusableModelCache(primary)) return primary;

    return (await findWarehouseModelCache(normalizedModel)) || primary;
  } catch (error) {
    console.error('findModelInStore error', error);
    return await findWarehouseModelCache(normalizedModel);
  }
}

export async function upsertModelToStore({
  normalizedModel,
  rawModel,
  payload,
}) {
  const eligibility = evaluateModelCacheEligibility(payload);
  if (!eligibility.eligible) {
    console.warn(`[Cache Guard] Skipping upsert for ${normalizedModel}: ${eligibility.reason} (Severity: ${eligibility.severity})`);
    return { skipped: true, reason: eligibility.reason };
  }

  const {
    parts = [],
    summary = '',
    status = 'parts_partial',
    sources = [],
    canonicalModel = null,
    completeness = {},
    truthSource = 'Manufacturer-first',
    sourceStrategy = 'manufacturer-first',
    fallbackSources = [],
    providerPlan = null,
  } = payload;

  try {
    await sql`
      INSERT INTO appliance_parts_cache (
        normalized_model,
        raw_model,
        canonical_model,
        summary,
        status,
        parts_json,
        sources_json,
        completeness_score,
        raw_row_count,
        master_row_count,
        section_count,
        truth_source,
        source_strategy,
        fallback_sources,
        provider_plan_json,
        conflict_flags,
        updated_at,
        last_used_at
      )
      VALUES (
        ${normalizedModel},
        ${rawModel},
        ${canonicalModel},
        ${summary},
        ${status},
        ${JSON.stringify(parts)}::jsonb,
        ${JSON.stringify(sources)}::jsonb,
        ${completeness.score || 0},
        ${completeness.rawRowCount || 0},
        ${completeness.masterRowCount || 0},
        ${completeness.sectionCount || 0},
        ${truthSource},
        ${sourceStrategy},
        ${JSON.stringify(fallbackSources || [])}::jsonb,
        ${providerPlan ? JSON.stringify(providerPlan) : null}::jsonb,
        ${JSON.stringify(completeness.flags || [])}::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (normalized_model) DO UPDATE SET
        raw_model = EXCLUDED.raw_model,
        canonical_model = EXCLUDED.canonical_model,
        summary = EXCLUDED.summary,
        status = EXCLUDED.status,
        parts_json = EXCLUDED.parts_json,
        sources_json = EXCLUDED.sources_json,
        completeness_score = EXCLUDED.completeness_score,
        raw_row_count = EXCLUDED.raw_row_count,
        master_row_count = EXCLUDED.master_row_count,
        section_count = EXCLUDED.section_count,
        truth_source = EXCLUDED.truth_source,
        source_strategy = EXCLUDED.source_strategy,
        fallback_sources = EXCLUDED.fallback_sources,
        provider_plan_json = EXCLUDED.provider_plan_json,
        conflict_flags = EXCLUDED.conflict_flags,
        updated_at = NOW(),
        last_used_at = NOW();
    `;
  } catch (error) {
    console.error('upsertModelToStore error', error);
  }
}
