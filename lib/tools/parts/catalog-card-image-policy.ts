export type PartImageStatus =
  | "db_image_verified"
  | "admin_uploaded"
  | "supplier_image"
  | "placeholder"
  | "missing";

export type PublishStatus = "draft" | "public" | "hidden";

export type ReviewStatus =
  | "pending_admin_review"
  | "approved"
  | "rejected"
  | "needs_correction";

export type PublishSource = "automatic_policy" | "admin_moderation";

export type PublishReason =
  | "existing_db_part"
  | "validation_confidence_0_92_plus"
  | "manual_admin_publish"
  | "manual_admin_hide"
  | "manual_admin_reject"
  | "manual_admin_correction_requested"
  | null;

export type AdminReviewAction =
  | "approve"
  | "edit_and_approve"
  | "hide"
  | "reject"
  | "request_correction"
  | "replace_image"
  | "mark_image_incorrect";

export type CatalogPartCandidate = {
  canonicalPartNumber: string;
  canonicalPartName?: string | null;

  existsInDatabase?: boolean;
  validationConfidence?: number | null;

  adminUploadedImageUrl?: string | null;
  existingDbImageUrl?: string | null;
  existingDbImageVerified?: boolean | null;
  supplierImageUrl?: string | null;
  supplierImageAllowed?: boolean;
  sourceProvider?: string | null;

  imageUrl?: string | null;
  imageStatus?: PartImageStatus | null;
  imageSource?: string | null;
  imageVerified?: boolean | null;
  imageUpdatedAt?: string | Date | null;

  providerRows?: unknown[];

  published?: boolean | null;
  publishedAt?: string | Date | null;
  publishStatus?: PublishStatus | null;

  autoPublishStatus?: PublishStatus | null;
  autoPublishReason?: PublishReason;
  autoPublished?: boolean | null;
  autoPublishedAt?: string | Date | null;

  adminPublishStatus?: PublishStatus | null;
  adminReviewStatus?: ReviewStatus | null;
  adminReviewRequired?: boolean | null;
  adminReviewedAt?: string | Date | null;
  adminReviewNotes?: string | null;
};

export type ResolvedPartCardImage = {
  imageUrl: string | null;
  imageStatus: PartImageStatus;
  imageSource: string;
  imageVerified: boolean;
};

export type PartPublishingResult = {
  autoPublishStatus: PublishStatus;
  autoPublishReason: PublishReason;
  autoPublicImmediately: boolean;
  autoPublished: boolean;

  publishStatus: PublishStatus;
  reviewStatus: ReviewStatus;
  publishReason: PublishReason;
  publishSource: PublishSource;
  publicImmediately: boolean;
  adminModerationApplied: boolean;
  adminReviewRequired: boolean;
  validationConfidence: number;
  published: boolean;
};

export type PublicPartCardPolicyResult = ResolvedPartCardImage &
  PartPublishingResult & {
    imageSourcePriority: readonly string[];
  };

export type AdminReviewDecision = {
  action: AdminReviewAction;
  reviewStatus: ReviewStatus;
  publishStatus: PublishStatus | null;
  publishReason: PublishReason;
  finalizesModeration: boolean;
};

export type AdminReviewPatchOptions = {
  notes?: string | null;
  changedBy?: string | null;
  now?: Date;
};

export const PART_CARD_VALIDATION_PUBLISH_THRESHOLD = 0.92;
export const SINGLE_ADMIN_ACTOR = "admin";

export const IMAGE_SOURCE_PRIORITY = [
  "admin_uploaded_db_image",
  "existing_verified_db_part_image",
  "supplier_image_with_provenance",
  "placeholder_image",
] as const;

const PUBLISH_STATUSES = new Set<PublishStatus>([
  "draft",
  "public",
  "hidden",
]);

const REVIEW_STATUSES = new Set<ReviewStatus>([
  "pending_admin_review",
  "approved",
  "rejected",
  "needs_correction",
]);

function cleanText(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function clampConfidence(value: unknown): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.min(1, numberValue));
}

function normalizePublishStatus(value: unknown): PublishStatus | null {
  const text = cleanText(value);
  if (!text) return null;
  return PUBLISH_STATUSES.has(text as PublishStatus)
    ? (text as PublishStatus)
    : null;
}

function normalizeReviewStatus(value: unknown): ReviewStatus | null {
  const text = cleanText(value);
  if (!text) return null;
  return REVIEW_STATUSES.has(text as ReviewStatus)
    ? (text as ReviewStatus)
    : null;
}

function toDateOrNull(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function existingDateOrNow(
  value: string | Date | null | undefined,
  now: Date
): Date {
  return toDateOrNull(value) ?? now;
}

function supplierImageHasStoredProvenance(
  part: CatalogPartCandidate
): boolean {
  if (!cleanText(part.supplierImageUrl)) return false;
  if (!cleanText(part.sourceProvider)) return false;
  if (part.supplierImageAllowed !== true) return false;

  return true;
}

function existingDbImageIsVerified(part: CatalogPartCandidate): boolean {
  if (!cleanText(part.existingDbImageUrl)) return false;
  if (part.existingDbImageVerified === false) return false;
  if (part.imageStatus === "missing") return false;

  return true;
}

function imagePatchWouldChange(
  part: CatalogPartCandidate,
  image: ResolvedPartCardImage
): boolean {
  return (
    cleanText(part.imageUrl) !== image.imageUrl ||
    (part.imageStatus ?? "placeholder") !== image.imageStatus ||
    cleanText(part.imageSource) !== image.imageSource ||
    (part.imageVerified === true) !== image.imageVerified
  );
}

function resolveAdminPublishStatus(
  part: CatalogPartCandidate
): PublishStatus | null {
  const explicitStatus = normalizePublishStatus(part.adminPublishStatus);
  if (explicitStatus) return explicitStatus;

  const reviewStatus = normalizeReviewStatus(part.adminReviewStatus);
  if (reviewStatus === "approved") return "public";
  if (reviewStatus === "rejected") return "hidden";
  if (reviewStatus === "needs_correction") return "draft";

  return null;
}

function reasonForAdminDecision(
  reviewStatus: ReviewStatus,
  publishStatus: PublishStatus
): PublishReason {
  if (publishStatus === "public") return "manual_admin_publish";
  if (reviewStatus === "rejected") return "manual_admin_reject";
  if (reviewStatus === "needs_correction") {
    return "manual_admin_correction_requested";
  }
  if (publishStatus === "hidden") return "manual_admin_hide";
  return "manual_admin_correction_requested";
}

export function resolvePartCardImage(
  part: CatalogPartCandidate
): ResolvedPartCardImage {
  const adminUploadedImageUrl = cleanText(part.adminUploadedImageUrl);
  if (adminUploadedImageUrl) {
    return {
      imageUrl: adminUploadedImageUrl,
      imageStatus: "admin_uploaded",
      imageSource: "admin_upload",
      imageVerified: true,
    };
  }

  const existingDbImageUrl = cleanText(part.existingDbImageUrl);
  if (existingDbImageUrl && existingDbImageIsVerified(part)) {
    return {
      imageUrl: existingDbImageUrl,
      imageStatus: "db_image_verified",
      imageSource: "existing_part_db",
      imageVerified: true,
    };
  }

  const supplierImageUrl = cleanText(part.supplierImageUrl);
  if (supplierImageUrl && supplierImageHasStoredProvenance(part)) {
    return {
      imageUrl: supplierImageUrl,
      imageStatus: "supplier_image",
      imageSource: cleanText(part.sourceProvider) ?? "unknown_supplier",
      imageVerified: false,
    };
  }

  return {
    imageUrl: null,
    imageStatus: "placeholder",
    imageSource: "none",
    imageVerified: false,
  };
}

export function evaluateAutomaticPartPublishing(
  part: CatalogPartCandidate
): PartPublishingResult {
  const validationConfidence = clampConfidence(part.validationConfidence);

  if (part.existsInDatabase === true) {
    return {
      autoPublishStatus: "public",
      autoPublishReason: "existing_db_part",
      autoPublicImmediately: true,
      autoPublished: true,
      publishStatus: "public",
      reviewStatus: "pending_admin_review",
      publishReason: "existing_db_part",
      publishSource: "automatic_policy",
      publicImmediately: true,
      adminModerationApplied: false,
      adminReviewRequired: true,
      validationConfidence,
      published: true,
    };
  }

  if (validationConfidence >= PART_CARD_VALIDATION_PUBLISH_THRESHOLD) {
    return {
      autoPublishStatus: "public",
      autoPublishReason: "validation_confidence_0_92_plus",
      autoPublicImmediately: true,
      autoPublished: true,
      publishStatus: "public",
      reviewStatus: "pending_admin_review",
      publishReason: "validation_confidence_0_92_plus",
      publishSource: "automatic_policy",
      publicImmediately: true,
      adminModerationApplied: false,
      adminReviewRequired: true,
      validationConfidence,
      published: true,
    };
  }

  return {
    autoPublishStatus: "draft",
    autoPublishReason: null,
    autoPublicImmediately: false,
    autoPublished: false,
    publishStatus: "draft",
    reviewStatus: "pending_admin_review",
    publishReason: null,
    publishSource: "automatic_policy",
    publicImmediately: false,
    adminModerationApplied: false,
    adminReviewRequired: true,
    validationConfidence,
    published: false,
  };
}

export function resolveEffectivePartPublishing(
  part: CatalogPartCandidate
): PartPublishingResult {
  const automatic = evaluateAutomaticPartPublishing(part);
  const adminPublishStatus = resolveAdminPublishStatus(part);
  const reviewStatus =
    normalizeReviewStatus(part.adminReviewStatus) ?? automatic.reviewStatus;

  if (!adminPublishStatus) return automatic;

  return {
    ...automatic,
    publishStatus: adminPublishStatus,
    reviewStatus,
    publishReason: reasonForAdminDecision(reviewStatus, adminPublishStatus),
    publishSource: "admin_moderation",
    publicImmediately: false,
    adminModerationApplied: true,
    adminReviewRequired: false,
    published: adminPublishStatus === "public",
  };
}

export function evaluatePartPublishing(
  part: CatalogPartCandidate
): PartPublishingResult {
  return resolveEffectivePartPublishing(part);
}

export function resolvePublicPartCardPolicy(
  part: CatalogPartCandidate
): PublicPartCardPolicyResult {
  return {
    ...resolvePartCardImage(part),
    ...resolveEffectivePartPublishing(part),
    imageSourcePriority: IMAGE_SOURCE_PRIORITY,
  };
}

export function shouldShowPublicPartCard(
  part: CatalogPartCandidate
): boolean {
  const policy = resolvePublicPartCardPolicy(part);
  return policy.published && policy.publishStatus === "public";
}

export function resolveAdminReviewDecision(
  action: AdminReviewAction
): AdminReviewDecision {
  if (action === "approve" || action === "edit_and_approve") {
    return {
      action,
      reviewStatus: "approved",
      publishStatus: "public",
      publishReason: "manual_admin_publish",
      finalizesModeration: true,
    };
  }

  if (action === "hide") {
    return {
      action,
      reviewStatus: "approved",
      publishStatus: "hidden",
      publishReason: "manual_admin_hide",
      finalizesModeration: true,
    };
  }

  if (action === "reject") {
    return {
      action,
      reviewStatus: "rejected",
      publishStatus: "hidden",
      publishReason: "manual_admin_reject",
      finalizesModeration: true,
    };
  }

  if (action === "request_correction" || action === "mark_image_incorrect") {
    return {
      action,
      reviewStatus: "needs_correction",
      publishStatus: "draft",
      publishReason: "manual_admin_correction_requested",
      finalizesModeration: true,
    };
  }

  return {
    action,
    reviewStatus: "pending_admin_review",
    publishStatus: null,
    publishReason: null,
    finalizesModeration: false,
  };
}

export function buildSingleAdminReviewDbPatch(
  action: AdminReviewAction,
  options: AdminReviewPatchOptions = {}
) {
  const decision = resolveAdminReviewDecision(action);
  const now = options.now ?? new Date();

  const patch: Record<string, unknown> = {
    admin_review_status: decision.reviewStatus,
    admin_publish_status: decision.publishStatus,
    admin_review_required: !decision.finalizesModeration,
    admin_reviewed_at: now,
    admin_reviewed_by: cleanText(options.changedBy) ?? SINGLE_ADMIN_ACTOR,
    admin_review_notes: cleanText(options.notes),
  };

  if (decision.finalizesModeration) {
    patch.publish_reason = decision.publishReason;
    patch.effective_publish_status = decision.publishStatus;
    patch.effective_publish_source = "admin_moderation";
    patch.published = decision.publishStatus === "public";
  }

  return patch;
}

export function buildPartCardImageDbPatch(part: CatalogPartCandidate) {
  const image = resolvePartCardImage(part);
  const now = new Date();

  return {
    image_url: image.imageUrl,
    image_status: image.imageStatus,
    image_source: image.imageSource,
    image_verified: image.imageVerified,
    image_updated_at: imagePatchWouldChange(part, image)
      ? now
      : toDateOrNull(part.imageUpdatedAt),
  };
}

export function buildPartCardPublishDbPatch(part: CatalogPartCandidate) {
  const automatic = evaluateAutomaticPartPublishing(part);
  const effective = resolveEffectivePartPublishing(part);
  const now = new Date();

  return {
    published: effective.published,
    published_at: effective.published
      ? existingDateOrNow(part.publishedAt, now)
      : null,
    publish_reason: effective.publishReason,
    validation_confidence: effective.validationConfidence,

    auto_published: automatic.autoPublished,
    auto_published_at: automatic.autoPublished
      ? existingDateOrNow(part.autoPublishedAt, now)
      : null,
    auto_publish_status: automatic.autoPublishStatus,
    auto_publish_reason: automatic.autoPublishReason,
    auto_validation_confidence: automatic.validationConfidence,
    auto_publish_evaluated_at: now,

    effective_publish_status: effective.publishStatus,
    effective_publish_source: effective.publishSource,
    admin_review_status: effective.reviewStatus,
    admin_review_required: effective.adminReviewRequired,
  };
}

export function buildPartCardAuditSnapshot(part: CatalogPartCandidate) {
  return {
    canonicalPartNumber: cleanText(part.canonicalPartNumber),
    canonicalPartName: cleanText(part.canonicalPartName),

    inputImageUrl: cleanText(part.imageUrl),
    inputImageStatus: part.imageStatus ?? "placeholder",
    inputImageSource: cleanText(part.imageSource),
    inputImageVerified: part.imageVerified === true,
    inputImageUpdatedAt: part.imageUpdatedAt ?? null,

    adminUploadedImageUrl: cleanText(part.adminUploadedImageUrl),
    existingDbImageUrl: cleanText(part.existingDbImageUrl),
    existingDbImageVerified: part.existingDbImageVerified !== false,
    supplierImageUrl: cleanText(part.supplierImageUrl),
    supplierImageAllowed: part.supplierImageAllowed === true,
    sourceProvider: cleanText(part.sourceProvider),

    existsInDatabase: part.existsInDatabase === true,
    validationConfidence: clampConfidence(part.validationConfidence),

    adminPublishStatus: normalizePublishStatus(part.adminPublishStatus),
    adminReviewStatus: normalizeReviewStatus(part.adminReviewStatus),
    adminReviewedAt: part.adminReviewedAt ?? null,
    adminReviewNotes: cleanText(part.adminReviewNotes),

    resolvedImage: resolvePartCardImage(part),
    automaticPublishing: evaluateAutomaticPartPublishing(part),
    effectivePublishing: resolveEffectivePartPublishing(part),
  };
}

export const PART_CARD_IMAGE_POLICY_SQL = `
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
`;
