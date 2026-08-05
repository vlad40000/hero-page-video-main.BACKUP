import type { BOMProviderEvidence } from "../tools/schemas";
import type { NormalizeCacheStatusResult } from "../verification/cache-status";

export type RetrievalEventType =
  | "cache_accepted"
  | "cache_skipped"
  | "cache_downgraded"
  | "variant_blocked";

export type RetrievalRunRecord = {
  normalizedModel: string;
  rawModel: string;
  sessionId: string | null;
  liveStatus: string;
  durableStatus: string;
  cacheEligible: boolean;
  skipReason: string;
  partsCount: number;
  sectionCount: number;
  providerEvidencesCount: number;
  hasNonInferredEvidence: boolean;
  retrievalTrace: Record<string, unknown> | null;
};

export type RetrievalEventRecord = {
  eventType: RetrievalEventType;
  stage: string | null;
  detail: Record<string, unknown>;
};

// ----- pure builders (no DB, fully testable) -----

export function buildRetrievalRunRecord({
  normalizedModel,
  rawModel,
  sessionId,
  payload,
  normalized,
}: {
  normalizedModel: string;
  rawModel: string;
  sessionId?: string | null;
  payload: unknown;
  normalized: NormalizeCacheStatusResult;
}): RetrievalRunRecord {
  const raw = payload as any;
  const parts = Array.isArray(raw?.parts) ? raw.parts : [];
  const sectionCount = Number(raw?.completeness?.sectionCount ?? 0);
  const evidences: BOMProviderEvidence[] = Array.isArray(raw?.providerEvidences)
    ? raw.providerEvidences
    : [];

  const hasNonInferredEvidence = evidences.some(
    (e) => e.sourceTruthKind === "manufacturer" || e.sourceTruthKind === "third_party"
  );

  return {
    normalizedModel,
    rawModel,
    sessionId: sessionId ?? null,
    liveStatus: String(raw?.status ?? ""),
    durableStatus: normalized.durableStatus,
    cacheEligible: normalized.cacheEligibleStatus,
    skipReason: normalized.reason,
    partsCount: parts.length,
    sectionCount,
    providerEvidencesCount: evidences.length,
    hasNonInferredEvidence,
    retrievalTrace: raw?.retrievalTrace ?? null,
  };
}

// Statuses whose promotion to bom_complete can be downgraded to parts_partial.
const PROMOTABLE_STATUSES = new Set(["complete", "target_met"]);

export function classifyRetrievalEvent(
  liveStatus: string,
  normalized: NormalizeCacheStatusResult
): RetrievalEventRecord {
  const live = String(liveStatus ?? "").toLowerCase().trim();
  const durable = normalized.durableStatus;

  if (live === "variant_resolution_needed") {
    return {
      eventType: "variant_blocked",
      stage: "variant_resolution",
      detail: { liveStatus: live, reason: normalized.reason },
    };
  }

  if (durable === "skip_cache" || !normalized.cacheEligibleStatus) {
    return {
      eventType: "cache_skipped",
      stage: null,
      detail: { liveStatus: live, durableStatus: durable, reason: normalized.reason },
    };
  }

  if (PROMOTABLE_STATUSES.has(live) && durable === "parts_partial") {
    return {
      eventType: "cache_downgraded",
      stage: null,
      detail: { liveStatus: live, durableStatus: durable, reason: normalized.reason },
    };
  }

  return {
    eventType: "cache_accepted",
    stage: null,
    detail: { liveStatus: live, durableStatus: durable, reason: normalized.reason },
  };
}

// ----- DB write (fire-and-forget, silently absorbs missing-table errors) -----

export async function recordRetrievalRun({
  normalizedModel,
  rawModel,
  sessionId,
  payload,
  normalized,
}: {
  normalizedModel: string;
  rawModel: string;
  sessionId?: string | null;
  payload: unknown;
  normalized: NormalizeCacheStatusResult;
}): Promise<void> {
  const record = buildRetrievalRunRecord({
    normalizedModel,
    rawModel,
    sessionId,
    payload,
    normalized,
  });
  const event = classifyRetrievalEvent(record.liveStatus, normalized);

  try {
    const { sql } = await import("@/lib/tools/parts/db");

    const runRows = await sql`
      INSERT INTO parts_retrieval_runs (
        normalized_model,
        raw_model,
        session_id,
        live_status,
        durable_status,
        cache_eligible,
        skip_reason,
        parts_count,
        section_count,
        provider_evidences_count,
        has_non_inferred_evidence,
        retrieval_trace_json,
        created_at
      )
      VALUES (
        ${record.normalizedModel},
        ${record.rawModel},
        ${record.sessionId},
        ${record.liveStatus},
        ${record.durableStatus},
        ${record.cacheEligible},
        ${record.skipReason},
        ${record.partsCount},
        ${record.sectionCount},
        ${record.providerEvidencesCount},
        ${record.hasNonInferredEvidence},
        ${record.retrievalTrace ? JSON.stringify(record.retrievalTrace) : null}::jsonb,
        NOW()
      )
      RETURNING id;
    `;

    const runId: string | undefined = runRows[0]?.id;
    if (!runId) return;

    await sql`
      INSERT INTO parts_retrieval_events (
        run_id,
        event_type,
        stage,
        detail_json,
        created_at
      )
      VALUES (
        ${runId},
        ${event.eventType},
        ${event.stage},
        ${JSON.stringify(event.detail)}::jsonb,
        NOW()
      );
    `;
  } catch (err) {
    // Audit must never block or surface errors to callers.
    console.error("[RetrievalAudit] record failed:", err);
  }
}
