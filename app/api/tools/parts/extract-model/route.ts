import { NextResponse } from "next/server";
import { extractModelFromImage } from "@/lib/tools/parts/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

    const result = await extractModelFromImage(image);
    return NextResponse.json(result);
  } catch (error) {
    console.error("extract-model route error", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process the image.",
      },
      { status: 500 }
    );
  }
}
