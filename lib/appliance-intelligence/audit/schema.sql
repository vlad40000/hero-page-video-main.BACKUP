-- Migration: Pass 2E — Retrieval-run audit persistence
-- Run once against the Neon database before deploying the audit write helper.

-- One row per retrieval attempt per model. Records what status the live session
-- produced, what the cache-status mapper decided, and why the cache was skipped
-- or downgraded.
CREATE TABLE IF NOT EXISTS parts_retrieval_runs (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_model          TEXT        NOT NULL,
  raw_model                 TEXT,
  session_id                TEXT,
  live_status               TEXT,
  durable_status            TEXT,
  cache_eligible            BOOLEAN     NOT NULL DEFAULT FALSE,
  skip_reason               TEXT,
  parts_count               INT         NOT NULL DEFAULT 0,
  section_count             INT         NOT NULL DEFAULT 0,
  provider_evidences_count  INT         NOT NULL DEFAULT 0,
  has_non_inferred_evidence BOOLEAN     NOT NULL DEFAULT FALSE,
  retrieval_trace_json      JSONB,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prr_model
  ON parts_retrieval_runs (normalized_model);

CREATE INDEX IF NOT EXISTS idx_prr_session
  ON parts_retrieval_runs (session_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prr_created
  ON parts_retrieval_runs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prr_durable_status
  ON parts_retrieval_runs (durable_status);

-- One row per significant event within a run (skip, downgrade, accept,
-- variant block). Kept separate so a single run can emit multiple events
-- if stages are retried.
CREATE TABLE IF NOT EXISTS parts_retrieval_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      UUID        NOT NULL REFERENCES parts_retrieval_runs(id) ON DELETE CASCADE,
  event_type  TEXT        NOT NULL,
  stage       TEXT,
  detail_json JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pre_run
  ON parts_retrieval_events (run_id);

CREATE INDEX IF NOT EXISTS idx_pre_event_type
  ON parts_retrieval_events (event_type);
