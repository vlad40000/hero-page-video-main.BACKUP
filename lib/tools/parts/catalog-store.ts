import "server-only";

import { sql } from "@/lib/tools/parts/db";
import { normalizePartNumber } from "@/lib/tools/parts/http";

export type CatalogPart = {
  canonicalPartNumber: string;
  rawPartNumber: string;
  canonicalPartName: string;
  normalizedCategory: string | null;
  normalizedSection: string | null;
  observedModels: string[];
  substituteChain: string[];
  providerRows: unknown[];
  sourceConfidence: Record<string, unknown>;
  latestPriceCents: number | null;
  priceCurrency: string;
  priceSource: string | null;
  priceCheckedAt: string | null;
  imageUrl: string | null;
  images: string[];
  imageStatus: string;
  imageSource: string;
  imageVerified: boolean;
  published: boolean;
  publishedAt: string | null;
  effectivePublishStatus: string;
  adminReviewStatus: string;
  validationConfidence: number | null;
  firstSeenSource: string | null;
  lastSeenSource: string | null;
  lookupCount: number;
  lastLookupAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  brand: string | null;
  sourceLinks: Array<{ label: string; href: string }>;
};

export type CatalogFilters = {
  q?: string;
  status?: string;
  category?: string;
  limit?: number | "all";
};

const IMAGE_KEYS = new Set([
  "image",
  "imageurl",
  "image_url",
  "thumbnail",
  "thumbnailurl",
  "thumbnail_url",
  "photo",
  "photourl",
  "photo_url",
  "picture",
  "pictureurl",
  "picture_url",
]);

function asText(value: unknown): string {
  return String(value ?? "").trim();
}

function asNullableText(value: unknown): string | null {
  const text = asText(value);
  return text || null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asText(item)).filter(Boolean);
}

function asObjectArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function asNumber(value: unknown): number | null {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function isSafeAssetUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const url = value.trim();
  if (!url) return false;
  return url.startsWith("/") || url.startsWith("https://") || url.startsWith("http://");
}

function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    const normalized = url.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function collectImages(value: unknown, urls: string[] = [], depth = 0): string[] {
  if (!value || depth > 4) return urls;

  if (Array.isArray(value)) {
    for (const item of value) collectImages(item, urls, depth + 1);
    return urls;
  }

  if (typeof value !== "object") return urls;

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z_]/g, "");
    if (IMAGE_KEYS.has(normalizedKey) && isSafeAssetUrl(nested)) {
      urls.push(nested.trim());
    }

    if (
      normalizedKey.includes("image") ||
      normalizedKey.includes("photo") ||
      normalizedKey.includes("thumb") ||
      Array.isArray(nested)
    ) {
      collectImages(nested, urls, depth + 1);
    }
  }

  return urls;
}

function collectSourceLinks(value: unknown, links: Array<{ label: string; href: string }> = [], depth = 0) {
  if (!value || depth > 3) return links;

  if (Array.isArray(value)) {
    for (const item of value) collectSourceLinks(item, links, depth + 1);
    return links;
  }

  if (typeof value !== "object") return links;

  const record = value as Record<string, unknown>;
  const href = asText(record.url || record.uri || record.href || record.link);
  if (isSafeAssetUrl(href) && href.startsWith("http")) {
    let hostname = href;
    try {
      hostname = new URL(href).hostname;
    } catch {
      hostname = href;
    }
    const label =
      asText(record.source || record.title || record.label || record.provider || hostname) ||
      href;
    links.push({ label, href });
  }

  for (const nested of Object.values(record)) {
    if (typeof nested === "object" && nested) collectSourceLinks(nested, links, depth + 1);
  }

  return links;
}

function firstBrandFromRows(providerRows: unknown[]): string | null {
  for (const row of providerRows) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const brand = asNullableText(
      record.brand ||
        record.manufacturer ||
        record.mfr ||
        record.make ||
        (record.rawPayload as Record<string, unknown> | undefined)?.brand
    );
    if (brand) return brand;
  }
  return null;
}

function normalizeCatalogPart(row: Record<string, unknown>): CatalogPart {
  const providerRows = asObjectArray(row.provider_rows);
  const dbImage = asNullableText(row.image_url);
  const images = dedupeUrls([
    ...(dbImage ? [dbImage] : []),
    ...collectImages(providerRows),
  ]);

  const rawLinks = collectSourceLinks(providerRows);
  const sourceLinks = rawLinks.filter(
    (link, index) => rawLinks.findIndex((candidate) => candidate.href === link.href) === index
  );

  const effectivePublishStatus = asText(row.effective_publish_status) || "draft";
  const published = row.published === true || effectivePublishStatus === "public";

  return {
    canonicalPartNumber: asText(row.canonical_part_number),
    rawPartNumber: asText(row.raw_part_number),
    canonicalPartName: asText(row.canonical_part_name) || "Appliance part",
    normalizedCategory: asNullableText(row.normalized_category),
    normalizedSection: asNullableText(row.normalized_section),
    observedModels: asStringArray(row.observed_models),
    substituteChain: asStringArray(row.substitute_chain),
    providerRows,
    sourceConfidence:
      row.source_confidence && typeof row.source_confidence === "object" && !Array.isArray(row.source_confidence)
        ? (row.source_confidence as Record<string, unknown>)
        : {},
    latestPriceCents: asNumber(row.latest_price_cents),
    priceCurrency: asText(row.price_currency) || "USD",
    priceSource: asNullableText(row.price_source),
    priceCheckedAt: asNullableText(row.price_checked_at),
    imageUrl: images[0] || null,
    images,
    imageStatus: asText(row.image_status) || (images.length ? "supplier_image" : "placeholder"),
    imageSource: asText(row.image_source) || (images.length ? "provider_rows" : "none"),
    imageVerified: row.image_verified === true,
    published,
    publishedAt: asNullableText(row.published_at),
    effectivePublishStatus,
    adminReviewStatus: asText(row.admin_review_status) || "pending_admin_review",
    validationConfidence: asNumber(row.validation_confidence),
    firstSeenSource: asNullableText(row.first_seen_source),
    lastSeenSource: asNullableText(row.last_seen_source),
    lookupCount: Number(row.lookup_count || 0),
    lastLookupAt: asNullableText(row.last_lookup_at),
    createdAt: asNullableText(row.created_at),
    updatedAt: asNullableText(row.updated_at),
    brand: firstBrandFromRows(providerRows),
    sourceLinks,
  };
}

export async function getCatalogParts(filters: CatalogFilters = {}): Promise<CatalogPart[]> {
  const q = asText(filters.q);
  const category = asText(filters.category);
  const status = asText(filters.status || "all") || "all";
  const limit = filters.limit === "all" ? 2147483647 : Math.min(Math.max(Number(filters.limit || 60), 1), 120);
  const qLike = `%${q}%`;

  try {
    const rows = await sql`
      WITH registry AS (
        SELECT to_jsonb(part_number_registry) AS row_json
        FROM part_number_registry
      )
      SELECT
        row_json->>'canonical_part_number' AS canonical_part_number,
        row_json->>'raw_part_number' AS raw_part_number,
        row_json->>'canonical_part_name' AS canonical_part_name,
        row_json->>'normalized_category' AS normalized_category,
        row_json->>'normalized_section' AS normalized_section,
        row_json->'observed_models' AS observed_models,
        row_json->'substitute_chain' AS substitute_chain,
        row_json->'provider_rows' AS provider_rows,
        row_json->'source_confidence' AS source_confidence,
        row_json->>'latest_price_cents' AS latest_price_cents,
        COALESCE(row_json->>'price_currency', 'USD') AS price_currency,
        row_json->>'price_source' AS price_source,
        row_json->>'price_checked_at' AS price_checked_at,
        row_json->>'image_url' AS image_url,
        COALESCE(row_json->>'image_status', 'placeholder') AS image_status,
        COALESCE(row_json->>'image_source', 'none') AS image_source,
        CASE WHEN row_json ? 'image_verified' THEN (row_json->>'image_verified')::boolean ELSE false END AS image_verified,
        CASE WHEN row_json ? 'published' THEN (row_json->>'published')::boolean ELSE false END AS published,
        row_json->>'published_at' AS published_at,
        COALESCE(row_json->>'effective_publish_status', 'draft') AS effective_publish_status,
        COALESCE(row_json->>'admin_review_status', 'pending_admin_review') AS admin_review_status,
        row_json->>'validation_confidence' AS validation_confidence,
        row_json->>'first_seen_source' AS first_seen_source,
        row_json->>'last_seen_source' AS last_seen_source,
        row_json->>'lookup_count' AS lookup_count,
        row_json->>'last_lookup_at' AS last_lookup_at,
        row_json->>'created_at' AS created_at,
        row_json->>'updated_at' AS updated_at
      FROM registry
      WHERE
        (${q} = '' OR row_json->>'canonical_part_number' ILIKE ${qLike} OR row_json->>'raw_part_number' ILIKE ${qLike} OR row_json->>'canonical_part_name' ILIKE ${qLike})
        AND (${category} = '' OR row_json->>'normalized_category' = ${category})
        AND (
          ${status} = 'all'
          OR (${status} = 'published' AND ((CASE WHEN row_json ? 'published' THEN (row_json->>'published')::boolean ELSE false END) = true OR row_json->>'effective_publish_status' = 'public'))
          OR (${status} = 'draft' AND (CASE WHEN row_json ? 'published' THEN (row_json->>'published')::boolean ELSE false END) = false AND COALESCE(row_json->>'effective_publish_status', 'draft') <> 'public')
        )
      ORDER BY
        COALESCE(row_json->>'published_at', row_json->>'last_lookup_at', row_json->>'updated_at', row_json->>'created_at') DESC,
        row_json->>'canonical_part_number' ASC
      LIMIT ${limit};
    `;

    return rows.map((row) => normalizeCatalogPart(row as Record<string, unknown>));
  } catch (error) {
    console.error("getCatalogParts error", error);
    return [];
  }
}

export async function getCatalogPartCount(filters: Omit<CatalogFilters, "limit"> = {}): Promise<number> {
  const q = asText(filters.q);
  const category = asText(filters.category);
  const status = asText(filters.status || "all") || "all";
  const qLike = `%${q}%`;

  try {
    const rows = await sql`
      WITH registry AS (
        SELECT to_jsonb(part_number_registry) AS row_json
        FROM part_number_registry
      )
      SELECT COUNT(*)::integer AS count
      FROM registry
      WHERE
        (${q} = '' OR row_json->>'canonical_part_number' ILIKE ${qLike} OR row_json->>'raw_part_number' ILIKE ${qLike} OR row_json->>'canonical_part_name' ILIKE ${qLike})
        AND (${category} = '' OR row_json->>'normalized_category' = ${category})
        AND (
          ${status} = 'all'
          OR (${status} = 'published' AND ((CASE WHEN row_json ? 'published' THEN (row_json->>'published')::boolean ELSE false END) = true OR row_json->>'effective_publish_status' = 'public'))
          OR (${status} = 'draft' AND (CASE WHEN row_json ? 'published' THEN (row_json->>'published')::boolean ELSE false END) = false AND COALESCE(row_json->>'effective_publish_status', 'draft') <> 'public')
        );
    `;

    return Number((rows[0] as Record<string, unknown> | undefined)?.count || 0);
  } catch (error) {
    console.error("getCatalogPartCount error", error);
    return 0;
  }
}

export async function getCatalogCategories(): Promise<string[]> {
  try {
    const rows = await sql`
      WITH registry AS (
        SELECT to_jsonb(part_number_registry) AS row_json
        FROM part_number_registry
      )
      SELECT DISTINCT row_json->>'normalized_category' AS normalized_category
      FROM registry
      WHERE COALESCE(row_json->>'normalized_category', '') <> ''
      ORDER BY normalized_category ASC
      LIMIT 80;
    `;
    return rows.map((row) => asText((row as Record<string, unknown>).normalized_category)).filter(Boolean);
  } catch (error) {
    console.error("getCatalogCategories error", error);
    return [];
  }
}

export async function getCatalogPart(partNumber: string): Promise<CatalogPart | null> {
  const canonicalPartNumber = normalizePartNumber(partNumber);
  if (!canonicalPartNumber) return null;

  try {
    const rows = await sql`
      WITH registry AS (
        SELECT to_jsonb(part_number_registry) AS row_json
        FROM part_number_registry
      )
      SELECT
        row_json->>'canonical_part_number' AS canonical_part_number,
        row_json->>'raw_part_number' AS raw_part_number,
        row_json->>'canonical_part_name' AS canonical_part_name,
        row_json->>'normalized_category' AS normalized_category,
        row_json->>'normalized_section' AS normalized_section,
        row_json->'observed_models' AS observed_models,
        row_json->'substitute_chain' AS substitute_chain,
        row_json->'provider_rows' AS provider_rows,
        row_json->'source_confidence' AS source_confidence,
        row_json->>'latest_price_cents' AS latest_price_cents,
        COALESCE(row_json->>'price_currency', 'USD') AS price_currency,
        row_json->>'price_source' AS price_source,
        row_json->>'price_checked_at' AS price_checked_at,
        row_json->>'image_url' AS image_url,
        COALESCE(row_json->>'image_status', 'placeholder') AS image_status,
        COALESCE(row_json->>'image_source', 'none') AS image_source,
        CASE WHEN row_json ? 'image_verified' THEN (row_json->>'image_verified')::boolean ELSE false END AS image_verified,
        CASE WHEN row_json ? 'published' THEN (row_json->>'published')::boolean ELSE false END AS published,
        row_json->>'published_at' AS published_at,
        COALESCE(row_json->>'effective_publish_status', 'draft') AS effective_publish_status,
        COALESCE(row_json->>'admin_review_status', 'pending_admin_review') AS admin_review_status,
        row_json->>'validation_confidence' AS validation_confidence,
        row_json->>'first_seen_source' AS first_seen_source,
        row_json->>'last_seen_source' AS last_seen_source,
        row_json->>'lookup_count' AS lookup_count,
        row_json->>'last_lookup_at' AS last_lookup_at,
        row_json->>'created_at' AS created_at,
        row_json->>'updated_at' AS updated_at
      FROM registry
      WHERE row_json->>'canonical_part_number' = ${canonicalPartNumber}
      LIMIT 1;
    `;

    if (!rows.length) return null;
    return normalizeCatalogPart(rows[0] as Record<string, unknown>);
  } catch (error) {
    console.error("getCatalogPart error", error);
    return null;
  }
}
