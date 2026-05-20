import { NextRequest, NextResponse } from "next/server";

import {
  getCatalogPartCount,
  getCatalogParts,
  updateCatalogPartDescription,
  type CatalogFilters,
} from "@/lib/tools/parts/catalog-store";
import { importCatalogSpreadsheet } from "@/lib/tools/parts/catalog-spreadsheet-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function text(value: FormDataEntryValue | null): string | null {
  const result = typeof value === "string" ? value.trim() : "";
  return result || null;
}

function requiredImportSecret(): string | null {
  return (
    process.env.CATALOG_IMPORT_SECRET ||
    process.env.PARTS_CATALOG_IMPORT_SECRET ||
    process.env.AUTH_SECRET ||
    null
  );
}

function providedImportSecret(request: NextRequest): string {
  const authorization = request.headers.get("authorization") || "";
  const bearer = authorization.replace(/^Bearer\s+/i, "").trim();
  return request.headers.get("x-catalog-import-secret")?.trim() || bearer;
}

function isAuthorizedForImport(request: NextRequest): boolean {
  const required = requiredImportSecret();
  return Boolean(required) && providedImportSecret(request) === required;
}

function catalogFilters(request: NextRequest): CatalogFilters {
  const params = new URL(request.url).searchParams;
  const limitParam = params.get("limit");
  const limit = limitParam === "all" ? "all" : Number(limitParam || 120);

  return {
    q: params.get("q") || undefined,
    category: params.get("category") || undefined,
    status: params.get("status") || "all",
    limit,
  };
}

export async function GET(request: NextRequest) {
  try {
    const filters = catalogFilters(request);
    const [parts, totalCount] = await Promise.all([
      getCatalogParts(filters),
      getCatalogPartCount(filters),
    ]);

    return NextResponse.json({
      success: true,
      count: parts.length,
      totalCount,
      parts,
    });
  } catch (error) {
    console.error("catalog DB read error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to read the parts catalog DB.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedForImport(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin key required for catalog spreadsheet imports.",
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "Attach a CSV, TSV, TXT, or XLSX parts spreadsheet.",
        },
        { status: 400 }
      );
    }

    const result = await importCatalogSpreadsheet({
      data: await file.arrayBuffer(),
      fileName: file.name,
      contentType: file.type,
      modelNumber: text(formData.get("modelNumber")),
      source: text(formData.get("source")),
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("catalog spreadsheet import error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to import the parts spreadsheet.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const partNumber = typeof body?.partNumber === "string" ? body.partNumber : "";
    const description =
      typeof body?.description === "string" && body.description.trim()
        ? body.description
        : null;

    if (!partNumber.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "partNumber is required.",
        },
        { status: 400 }
      );
    }

    const part = await updateCatalogPartDescription(partNumber, description);

    if (!part) {
      return NextResponse.json(
        {
          success: false,
          error: "Part catalog entry not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      part,
    });
  } catch (error) {
    console.error("catalog description update error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update the catalog description.",
      },
      { status: 500 }
    );
  }
}
