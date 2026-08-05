import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  continuePartsSearch,
  startPartsSearch,
} from "@/lib/tools/parts/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const StartSchema = z.object({
  action: z.literal("start"),
  modelNumber: z.string().min(1),
  serialNumber: z.string().optional(),
  partNumber: z.string().optional(),
  partDescription: z.string().max(500).optional(),
  brand: z.string().optional(),
  productType: z.string().optional(),
  exhaustiveMode: z.boolean().optional(),
});

const ContinueSchema = z.object({
  action: z.literal("continue"),
  searchSessionId: z.string().min(1),
  revision: z.string().optional(),
});

const RequestSchema = z.discriminatedUnion("action", [StartSchema, ContinueSchema]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.parse(body);

    if (parsed.action === "start") {
      const data = await startPartsSearch(parsed);
      return NextResponse.json(data);
    }

    const data = await continuePartsSearch(parsed);
    return NextResponse.json(data);
  } catch (error) {
    console.error("part-finder search route error", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid search request.",
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
            : "Failed to process parts search.",
      },
      { status: 500 }
    );
  }
}
