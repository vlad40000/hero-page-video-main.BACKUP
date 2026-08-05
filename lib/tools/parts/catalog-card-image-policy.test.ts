import { describe, expect, it } from "vitest";
import {
  buildPartCardImageDbPatch,
  buildSingleAdminReviewDbPatch,
  evaluateAutomaticPartPublishing,
  resolveEffectivePartPublishing,
  resolvePartCardImage,
  shouldShowPublicPartCard,
  type CatalogPartCandidate,
} from "./catalog-card-image-policy";

const basePart: CatalogPartCandidate = {
  canonicalPartNumber: "WP123456",
  canonicalPartName: "Drain pump",
};

describe("resolvePartCardImage", () => {
  it("uses admin-uploaded images before database or supplier images", () => {
    const image = resolvePartCardImage({
      ...basePart,
      adminUploadedImageUrl: "https://cdn.example.com/admin.jpg",
      existingDbImageUrl: "https://cdn.example.com/db.jpg",
      supplierImageUrl: "https://supplier.example.com/part.jpg",
      supplierImageAllowed: true,
      sourceProvider: "supplier.example.com",
    });

    expect(image).toEqual({
      imageUrl: "https://cdn.example.com/admin.jpg",
      imageStatus: "admin_uploaded",
      imageSource: "admin_upload",
      imageVerified: true,
    });
  });

  it("only uses supplier images when stored provenance allows them", () => {
    expect(
      resolvePartCardImage({
        ...basePart,
        supplierImageUrl: "https://supplier.example.com/part.jpg",
        supplierImageAllowed: true,
        sourceProvider: "supplier.example.com",
      })
    ).toMatchObject({
      imageStatus: "supplier_image",
      imageSource: "supplier.example.com",
      imageVerified: false,
    });

    expect(
      resolvePartCardImage({
        ...basePart,
        supplierImageUrl: "https://supplier.example.com/part.jpg",
        supplierImageAllowed: false,
        sourceProvider: "supplier.example.com",
      })
    ).toMatchObject({
      imageUrl: null,
      imageStatus: "placeholder",
    });
  });

  it("does not churn image_updated_at when the resolved image is unchanged", () => {
    const imageUpdatedAt = new Date("2026-01-01T00:00:00.000Z");
    const patch = buildPartCardImageDbPatch({
      ...basePart,
      adminUploadedImageUrl: "https://cdn.example.com/admin.jpg",
      imageUrl: "https://cdn.example.com/admin.jpg",
      imageStatus: "admin_uploaded",
      imageSource: "admin_upload",
      imageVerified: true,
      imageUpdatedAt,
    });

    expect(patch.image_updated_at).toBe(imageUpdatedAt);
  });
});

describe("part card publishing policy", () => {
  it("auto-publishes a high-confidence part while admin review is pending", () => {
    const automatic = evaluateAutomaticPartPublishing({
      ...basePart,
      validationConfidence: 0.92,
    });

    expect(automatic).toMatchObject({
      publishStatus: "public",
      publishSource: "automatic_policy",
      publishReason: "validation_confidence_0_92_plus",
      publicImmediately: true,
      adminReviewRequired: true,
      published: true,
    });
  });

  it("lets a single admin hide an automatically public part", () => {
    const effective = resolveEffectivePartPublishing({
      ...basePart,
      validationConfidence: 0.99,
      adminReviewStatus: "approved",
      adminPublishStatus: "hidden",
    });

    expect(effective).toMatchObject({
      autoPublishStatus: "public",
      publishStatus: "hidden",
      publishSource: "admin_moderation",
      publishReason: "manual_admin_hide",
      adminModerationApplied: true,
      adminReviewRequired: false,
      published: false,
    });

    expect(
      shouldShowPublicPartCard({
        ...basePart,
        validationConfidence: 0.99,
        adminReviewStatus: "approved",
        adminPublishStatus: "hidden",
      })
    ).toBe(false);
  });

  it("lets a single admin approve a low-confidence draft", () => {
    const effective = resolveEffectivePartPublishing({
      ...basePart,
      validationConfidence: 0.4,
      adminReviewStatus: "approved",
    });

    expect(effective).toMatchObject({
      autoPublishStatus: "draft",
      publishStatus: "public",
      publishSource: "admin_moderation",
      publishReason: "manual_admin_publish",
      published: true,
    });

    expect(
      shouldShowPublicPartCard({
        ...basePart,
        validationConfidence: 0.4,
        adminReviewStatus: "approved",
      })
    ).toBe(true);
  });

  it("keeps a rejected part hidden even when automatic confidence stays high", () => {
    const effective = resolveEffectivePartPublishing({
      ...basePart,
      validationConfidence: 1,
      adminReviewStatus: "rejected",
    });

    expect(effective).toMatchObject({
      autoPublishStatus: "public",
      publishStatus: "hidden",
      publishSource: "admin_moderation",
      publishReason: "manual_admin_reject",
      published: false,
    });
  });
});

describe("single admin review patches", () => {
  it("stores the lone admin as the default actor", () => {
    const now = new Date("2026-02-01T12:00:00.000Z");
    const patch = buildSingleAdminReviewDbPatch("hide", {
      now,
      notes: "Incorrect supplier image.",
    });

    expect(patch).toMatchObject({
      admin_review_status: "approved",
      admin_publish_status: "hidden",
      admin_review_required: false,
      admin_reviewed_at: now,
      admin_reviewed_by: "admin",
      admin_review_notes: "Incorrect supplier image.",
      effective_publish_status: "hidden",
      effective_publish_source: "admin_moderation",
      published: false,
    });
  });

  it("does not overwrite visibility for image-only admin actions", () => {
    const patch = buildSingleAdminReviewDbPatch("replace_image");

    expect(patch).toMatchObject({
      admin_review_status: "pending_admin_review",
      admin_publish_status: null,
      admin_review_required: true,
      admin_reviewed_by: "admin",
    });
    expect(patch).not.toHaveProperty("effective_publish_status");
    expect(patch).not.toHaveProperty("effective_publish_source");
    expect(patch).not.toHaveProperty("published");
  });
});
