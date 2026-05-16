import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ingestOrRefreshPartNumber } from "@/lib/tools/parts/part-number-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BodySchema = z.object({
  partNumber: z.string().min(1),
  modelNumber: z.string().optional(),
  partName: z.string().optional(),
  category: z.string().optional(),
  section: z.string().optional(),
  source: z.string().optional(),
  matchedPart: z
    .object({
      canonicalPartNumber: z.string().optional(),
      canonicalPartName: z.string().optional(),
      normalizedCategory: z.string().nullable().optional(),
      normalizedSection: z.string().nullable().optional(),
      preferredSource: z.string().nullable().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = BodySchema.parse(await request.json());
    const matched = body.matchedPart || {};

    const record = await ingestOrRefreshPartNumber({
      partNumber: body.partNumber,
      rawPartNumber: body.partNumber,
      canonicalPartName: matched.canonicalPartName || body.partName || null,
      normalizedCategory: matched.normalizedCategory || body.category || null,
      normalizedSection: matched.normalizedSection || body.section || null,
      modelNumber: body.modelNumber || null,
      source: matched.preferredSource || body.source || "part-finder-entry",
      providerRows: [
        {
          source: body.source || "part-finder-entry",
          rawPartNumber: body.partNumber,
          rawPartName: matched.canonicalPartName || body.partName || null,
          rawCategory: matched.normalizedCategory || body.category || null,
          sectionName: matched.normalizedSection || body.section || null,
          modelNumber: body.modelNumber || null,
        },
      ],
    });

    return NextResponse.json({ part: record });
  } catch (error) {
    console.error("lookup-part route error", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid part lookup request.",
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process part lookup.",
      },
      { status: 500 }
    );
  }
}
