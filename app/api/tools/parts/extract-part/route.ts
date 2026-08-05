import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PART_NUMBER_PATTERNS = [
  /\b([A-Z]{1,4}\d{5,12}[A-Z0-9]*)\b/g,
  /\b(\d{6,12})\b/g,
];

function normalizeCandidate(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function chooseBestCandidate(text: string) {
  const candidates: string[] = [];

  for (const pattern of PART_NUMBER_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const value = normalizeCandidate(match[1] || "");
      if (value.length >= 6) candidates.push(value);
    }
  }

  const unique = [...new Set(candidates)];

  if (!unique.length) {
    return {
      extractedPartNumber: null,
      confidence: "low" as const,
      rawText: text,
    };
  }

  unique.sort((a, b) => b.length - a.length);

  return {
    extractedPartNumber: unique[0],
    confidence: unique.length === 1 ? ("medium" as const) : ("low" as const),
    rawText: text,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!image || !(image instanceof File)) {
      return NextResponse.json(
        { error: "An image file is required." },
        { status: 400 }
      );
    }

    const bytes = await image.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString("base64");
    const mimeType = image.type || "image/jpeg";

    // Replace this block with your real vision call if already available.
    const { extractPartStickerText } = await import("@/lib/tools/parts/gemini");
    const visionResult = await extractPartStickerText(base64Image, mimeType);

    const rawText =
      typeof visionResult?.rawText === "string"
        ? visionResult.rawText
        : typeof visionResult?.text === "string"
        ? visionResult.text
        : "";

    const picked = chooseBestCandidate(rawText);
    let storedPart = null;

    if (picked.extractedPartNumber) {
      const { ingestOrRefreshPartNumber } = await import("@/lib/tools/parts/part-number-store");
      storedPart = await ingestOrRefreshPartNumber({
        partNumber: picked.extractedPartNumber,
        source: "part-sticker-ocr",
        providerRows: [
          {
            source: "part-sticker-ocr",
            rawPartNumber: picked.extractedPartNumber,
            rawText,
            confidence: picked.confidence,
          },
        ],
      });
    }

    return NextResponse.json({
      extractedPartNumber: picked.extractedPartNumber,
      confidence: picked.confidence,
      rawText: picked.rawText,
      storedPart,
    });
  } catch (error) {
    console.error("extract-part route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process part image.",
      },
      { status: 500 }
    );
  }
}
