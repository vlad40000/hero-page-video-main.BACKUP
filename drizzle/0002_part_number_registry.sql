CREATE TABLE IF NOT EXISTS part_number_registry (
  canonical_part_number text PRIMARY KEY,
  raw_part_number text NOT NULL,
  canonical_part_name text,
  normalized_category text,
  normalized_section text,
  observed_models jsonb NOT NULL DEFAULT '[]'::jsonb,
  substitute_chain jsonb NOT NULL DEFAULT '[]'::jsonb,
  provider_rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_confidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  conflict_flags jsonb NOT NULL DEFAULT '[]'::jsonb,

  latest_price_cents integer,
  previous_price_cents integer,
  price_currency text NOT NULL DEFAULT 'USD',
  price_source text,
  price_checked_at timestamptz,
  price_changed_at timestamptz,
  price_payload jsonb,

  first_seen_source text,
  last_seen_source text,
  lookup_count integer NOT NULL DEFAULT 0,
  last_lookup_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS part_number_registry_name_idx
  ON part_number_registry (canonical_part_name);

CREATE INDEX IF NOT EXISTS part_number_registry_updated_at_idx
  ON part_number_registry (updated_at DESC);

CREATE INDEX IF NOT EXISTS part_number_registry_price_checked_at_idx
  ON part_number_registry (price_checked_at DESC);

ALTER TABLE appliance_parts_cache
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'parts_partial';
