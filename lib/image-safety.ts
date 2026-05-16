/**
 * Single source of truth for image safety limits + URL safety.
 */

export const MAX_DECODED_BYTES_SSR = 1 * 1024 * 1024;
export const MAX_DECODED_BYTES_WRITE = 2 * 1024 * 1024;
export const MAX_DECODED_BYTES_SANITIZE = 4 * 1024 * 1024;

function isRenderableImageSrc(s: string): boolean {
  const v = (s || "").trim();
  if (!v) return false;

  // common poison strings
  const lower = v.toLowerCase();
  if (
    lower === "null" ||
    lower === "undefined" ||
    lower === "nan" ||
    lower === "[object object]"
  ) return false;

  // allow only what next/image can safely handle in this app
  return (
    v.startsWith("/") ||
    v.startsWith("https://") ||
    v.startsWith("http://") ||
    v.startsWith("data:")
  );
}

/**
 * Normalizes DB image arrays at the boundary.
 * Filters objects/nulls AND filters out invalid/poison src strings.
 */
export function normalizeImages(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(isRenderableImageSrc);
}

/**
 * Enforces base64 decoded size limit for data URIs.
 * Also rejects any non-renderable src values.
 */
export function enforceBase64Limit(
  img: unknown,
  maxDecodedBytes: number,
  fallback: string
): string {
  if (!img || typeof img !== "string") return fallback;

  const v = img.trim();
  if (!isRenderableImageSrc(v)) return fallback;

  if (!v.startsWith("data:")) return v;

  const parts = v.split(",");
  if (parts.length !== 2 || !parts[0].includes(";base64")) return fallback;

  const base64Data = parts[1];
  const bytes = Buffer.from(base64Data, "base64").byteLength;

  if (bytes > maxDecodedBytes) {
    console.warn(
      `[ImageSafety] Data URL exceeds decoded size limit (${bytes} > ${maxDecodedBytes}). Replacing with fallback.`
    );
    return fallback;
  }

  return v;
}
