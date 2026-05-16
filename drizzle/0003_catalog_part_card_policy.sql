ALTER TABLE part_number_registry
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_status text DEFAULT 'placeholder',
  ADD COLUMN IF NOT EXISTS image_source text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS image_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS image_updated_at timestamptz;

ALTER TABLE part_number_registry
  ADD COLUMN IF NOT EXISTS published boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS publish_reason text,
  ADD COLUMN IF NOT EXISTS validation_confidence numeric(4,3),
  ADD COLUMN IF NOT EXISTS auto_published boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_published_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_publish_status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS auto_publish_reason text,
  ADD COLUMN IF NOT EXISTS auto_validation_confidence numeric(4,3),
  ADD COLUMN IF NOT EXISTS auto_publish_evaluated_at timestamptz,
  ADD COLUMN IF NOT EXISTS effective_publish_status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS effective_publish_source text DEFAULT 'automatic_policy',
  ADD COLUMN IF NOT EXISTS admin_publish_status text,
  ADD COLUMN IF NOT EXISTS admin_review_status text DEFAULT 'pending_admin_review',
  ADD COLUMN IF NOT EXISTS admin_review_required boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS admin_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_reviewed_by text,
  ADD COLUMN IF NOT EXISTS admin_review_notes text;

ALTER TABLE part_number_registry
  DROP CONSTRAINT IF EXISTS part_number_registry_image_status_check;
ALTER TABLE part_number_registry
  ADD CONSTRAINT part_number_registry_image_status_check
  CHECK (image_status IN ('db_image_verified', 'admin_uploaded', 'supplier_image', 'placeholder', 'missing'));

ALTER TABLE part_number_registry
  DROP CONSTRAINT IF EXISTS part_number_registry_publish_status_check;
ALTER TABLE part_number_registry
  ADD CONSTRAINT part_number_registry_publish_status_check
  CHECK (
    auto_publish_status IN ('draft', 'public', 'hidden')
    AND effective_publish_status IN ('draft', 'public', 'hidden')
    AND (admin_publish_status IS NULL OR admin_publish_status IN ('draft', 'public', 'hidden'))
  );

ALTER TABLE part_number_registry
  DROP CONSTRAINT IF EXISTS part_number_registry_review_status_check;
ALTER TABLE part_number_registry
  ADD CONSTRAINT part_number_registry_review_status_check
  CHECK (admin_review_status IN ('pending_admin_review', 'approved', 'rejected', 'needs_correction'));

ALTER TABLE part_number_registry
  DROP CONSTRAINT IF EXISTS part_number_registry_confidence_check;
ALTER TABLE part_number_registry
  ADD CONSTRAINT part_number_registry_confidence_check
  CHECK (
    (validation_confidence IS NULL OR (validation_confidence >= 0 AND validation_confidence <= 1))
    AND (auto_validation_confidence IS NULL OR (auto_validation_confidence >= 0 AND auto_validation_confidence <= 1))
  );

ALTER TABLE part_number_registry
  DROP CONSTRAINT IF EXISTS part_number_registry_publish_reason_check;
ALTER TABLE part_number_registry
  ADD CONSTRAINT part_number_registry_publish_reason_check
  CHECK (
    (publish_reason IS NULL OR publish_reason IN (
        'existing_db_part',
        'validation_confidence_0_92_plus',
        'manual_admin_publish',
        'manual_admin_hide',
        'manual_admin_reject',
        'manual_admin_correction_requested'
      )
    )
    AND (auto_publish_reason IS NULL OR auto_publish_reason IN (
        'existing_db_part',
        'validation_confidence_0_92_plus'
      )
    )
  );

ALTER TABLE part_number_registry
  DROP CONSTRAINT IF EXISTS part_number_registry_publish_source_check;
ALTER TABLE part_number_registry
  ADD CONSTRAINT part_number_registry_publish_source_check
  CHECK (effective_publish_source IN ('automatic_policy', 'admin_moderation'));

CREATE TABLE IF NOT EXISTS catalog_part_card_revisions (
  id bigserial PRIMARY KEY,
  canonical_part_number text NOT NULL,
  action text NOT NULL,
  before_json jsonb,
  after_json jsonb,
  source_snapshot_json jsonb,
  changed_by text DEFAULT 'admin',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS catalog_part_card_revisions_part_number_idx
  ON catalog_part_card_revisions (canonical_part_number, created_at DESC);
