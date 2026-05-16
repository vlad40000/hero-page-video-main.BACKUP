CREATE TABLE IF NOT EXISTS search_sessions (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,

  request_json jsonb NOT NULL,
  stage text NOT NULL DEFAULT 'init',
  has_more boolean NOT NULL DEFAULT true,
  next_stage text,
  status text NOT NULL DEFAULT 'partial',
  canonical_model text,
  cache_status text NOT NULL DEFAULT 'live',

  identity_json jsonb,
  route_json jsonb,
  variant_json jsonb,
  review_json jsonb,
  serial_profile_json jsonb,
  retrieval_trace_json jsonb,
  accumulated_raw_parts_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  accumulated_sources_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_payload_json jsonb
);

CREATE INDEX IF NOT EXISTS search_sessions_expires_at_idx
  ON search_sessions (expires_at);

CREATE INDEX IF NOT EXISTS search_sessions_stage_idx
  ON search_sessions (stage);

CREATE INDEX IF NOT EXISTS search_sessions_canonical_model_idx
  ON search_sessions (canonical_model);


CREATE TABLE IF NOT EXISTS nameplate_extractions (
  id serial PRIMARY KEY,
  image_hash text NOT NULL,
  brand text,
  raw_model text,
  raw_serial text,
  product_type text,
  engineering_code text,
  confidence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nameplate_extractions_image_hash_idx
  ON nameplate_extractions (image_hash);

CREATE INDEX IF NOT EXISTS nameplate_extractions_created_at_idx
  ON nameplate_extractions (created_at DESC);


CREATE TABLE IF NOT EXISTS appliance_parts_cache (
  normalized_model text PRIMARY KEY,
  raw_model text NOT NULL,
  canonical_model text,
  summary text,
  parts_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources_json jsonb NOT NULL DEFAULT '[]'::jsonb,

  completeness_score real NOT NULL DEFAULT 0,
  raw_row_count integer NOT NULL DEFAULT 0,
  master_row_count integer NOT NULL DEFAULT 0,
  section_count integer NOT NULL DEFAULT 0,

  truth_source text,
  source_strategy text,
  fallback_sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  provider_plan_json jsonb,
  conflict_flags jsonb NOT NULL DEFAULT '[]'::jsonb,

  updated_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appliance_parts_cache_canonical_model_idx
  ON appliance_parts_cache (canonical_model);

CREATE INDEX IF NOT EXISTS appliance_parts_cache_updated_at_idx
  ON appliance_parts_cache (updated_at DESC);


CREATE TABLE IF NOT EXISTS model_parts_master (
  canonical_model text NOT NULL,
  canonical_part_number text NOT NULL,
  canonical_part_name text NOT NULL,
  normalized_section text,
  normalized_category text,
  preferred_source text,
  substitute_chain jsonb NOT NULL DEFAULT '[]'::jsonb,
  serial_applicability jsonb NOT NULL DEFAULT '[]'::jsonb,
  provider_rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_confidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  conflict_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (canonical_model, canonical_part_number)
);

CREATE INDEX IF NOT EXISTS model_parts_master_model_idx
  ON model_parts_master (canonical_model);

CREATE INDEX IF NOT EXISTS model_parts_master_section_idx
  ON model_parts_master (normalized_section);


CREATE TABLE IF NOT EXISTS model_parts_raw (
  id serial PRIMARY KEY,
  canonical_model text NOT NULL,
  source text NOT NULL,
  section_name text,
  diagram_ref text,
  provider_item_id text,
  raw_part_number text NOT NULL,
  raw_part_name text,
  raw_category text,
  quantity text,
  substitute_part_number text,
  serial_note text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS model_parts_raw_model_idx
  ON model_parts_raw (canonical_model);

CREATE INDEX IF NOT EXISTS model_parts_raw_raw_part_number_idx
  ON model_parts_raw (raw_part_number);

CREATE INDEX IF NOT EXISTS model_parts_raw_source_idx
  ON model_parts_raw (source);


CREATE TABLE IF NOT EXISTS model_resolution (
  raw_model text PRIMARY KEY,
  canonical_model text NOT NULL,
  alternate_models jsonb NOT NULL DEFAULT '[]'::jsonb,
  family_root text,
  brand text,
  ambiguity_score real NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS model_resolution_canonical_model_idx
  ON model_resolution (canonical_model);

CREATE INDEX IF NOT EXISTS model_resolution_family_root_idx
  ON model_resolution (family_root);


CREATE TABLE IF NOT EXISTS model_search_cache (
  cache_key text PRIMARY KEY,
  normalized_model text NOT NULL,
  raw_model text NOT NULL,
  selected_sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  search_mode text,
  summary text,
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ready',
  hit_count integer NOT NULL DEFAULT 0,
  last_hit_at timestamptz,
  expires_at timestamptz NOT NULL,
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS model_search_cache_normalized_model_idx
  ON model_search_cache (normalized_model);

CREATE INDEX IF NOT EXISTS model_search_cache_expires_at_idx
  ON model_search_cache (expires_at);
