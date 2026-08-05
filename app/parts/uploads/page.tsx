import type { Metadata } from "next";
import Link from "next/link";
import { Database, UploadCloud } from "lucide-react";

import { CatalogSyncControls } from "@/components/parts-catalog/CatalogSyncControls";
import { getCatalogPartCount } from "@/lib/tools/parts/catalog-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Parts Uploads | Road Runner Appliance",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PartsUploadsPage() {
  const totalCount = await getCatalogPartCount();

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-[1280px] px-5 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-blue-700">
              <UploadCloud className="h-4 w-4" />
              Parts catalog admin
            </div>
            <h1 className="text-3xl font-black tracking-normal text-slate-950">
              Spreadsheet Uploads
            </h1>
          </div>
          <Link
            href="/parts?limit=all"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-extrabold uppercase tracking-wide text-slate-700 hover:border-blue-500 hover:text-blue-700"
          >
            <Database className="h-4 w-4" />
            Catalog
          </Link>
        </div>

        <CatalogSyncControls
          readAllHref="/parts?limit=all"
          showingAll
          loadedCount={totalCount}
          totalCount={totalCount}
        />
      </main>
    </div>
  );
}
