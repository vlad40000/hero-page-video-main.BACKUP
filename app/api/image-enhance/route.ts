import { NextResponse } from "next/server";
import { getImageProcessingProvider } from "@/lib/image-processing/provider";
import type { ImageEnhanceRequestBody } from "@/lib/image-processing/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ImageEnhanceRequestBody;

    if (
      !body.imageUrl ||
      typeof body.imageUrl !== "string" ||
      !body.imageUrl.startsWith("http")
    ) {
      return NextResponse.json({ error: "Valid imageUrl is required." }, { status: 400 });
    }

    const provider = getImageProcessingProvider();
    const result = await provider.process({
      imageUrl: body.imageUrl,
      useCase: body.useCase,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Image enhancement failed.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
