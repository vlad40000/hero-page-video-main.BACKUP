export type VerifiedPartMatch = {
  status: "verified" | "possible" | "unverified";
  extractedPartNumber: string | null;
  matchedPartNumber: string | null;
  matchedPartName: string | null;
  reason: string;
};

function normalizePartNumber(value: string | null | undefined) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function verifyExtractedPartNumber(
  extractedPartNumber: string | null | undefined,
  parts: Array<{
    canonicalPartNumber: string;
    canonicalPartName: string;
  }>
): VerifiedPartMatch {
  const extracted = normalizePartNumber(extractedPartNumber);

  if (!extracted) {
    return {
      status: "unverified",
      extractedPartNumber: null,
      matchedPartNumber: null,
      matchedPartName: null,
      reason: "No part number could be confidently read from the image.",
    };
  }

  const exact = parts.find(
    (part) => normalizePartNumber(part.canonicalPartNumber) === extracted
  );

  if (exact) {
    return {
      status: "verified",
      extractedPartNumber: extracted,
      matchedPartNumber: exact.canonicalPartNumber,
      matchedPartName: exact.canonicalPartName,
      reason: "Exact part number match found in this machine's returned parts.",
    };
  }

  const loose = parts.find((part) => {
    const normalized = normalizePartNumber(part.canonicalPartNumber);
    return normalized.includes(extracted) || extracted.includes(normalized);
  });

  if (loose) {
    return {
      status: "possible",
      extractedPartNumber: extracted,
      matchedPartNumber: loose.canonicalPartNumber,
      matchedPartName: loose.canonicalPartName,
      reason: "Possible partial match found. Manual verification is still required.",
    };
  }

  return {
    status: "unverified",
    extractedPartNumber: extracted,
    matchedPartNumber: null,
    matchedPartName: null,
    reason: "The extracted part number does not match the returned parts for this machine.",
  };
}
