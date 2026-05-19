"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Database, Loader2, UploadCloud } from "lucide-react";

type CatalogSyncControlsProps = {
  readAllHref: string;
  showingAll: boolean;
  loadedCount: number;
  totalCount: number;
};

type ImportResult = {
  success?: boolean;
  error?: string;
  insertedParts?: number;
  updatedParts?: number;
  uniqueParts?: number;
  skippedRows?: number;
  pricedParts?: number;
};

export function CatalogSyncControls({
  readAllHref,
  showingAll,
  loadedCount,
  totalCount,
}: CatalogSyncControlsProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [source, setSource] = useState("spreadsheet-import");
  const [adminKey, setAdminKey] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileName(file?.name || "");
    setResult(null);
  }

  async function uploadSpreadsheet() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setResult({ success: false, error: "Choose a parts spreadsheet first." });
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    if (modelNumber.trim()) formData.set("modelNumber", modelNumber.trim());
    if (source.trim()) formData.set("source", source.trim());

    setIsUploading(true);
    setResult(null);

    try {
      const response = await fetch("/api/tools/parts/catalog-sync", {
        method: "POST",
        headers: adminKey.trim() ? { "x-catalog-import-secret": adminKey.trim() } : undefined,
        body: formData,
      });
      const payload = (await response.json()) as ImportResult;

      if (!response.ok || payload.success === false) {
        throw new Error(payload.error || "Spreadsheet import failed.");
      }

      setResult(payload);
      router.refresh();
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Spreadsheet import failed.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  const countLabel = showingAll
    ? `${totalCount.toLocaleString()} DB parts available`
    : `${loadedCount.toLocaleString()} shown of ${totalCount.toLocaleString()} DB parts`;

  return (
    <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.2fr)_150px_180px_160px_auto_auto]">
        <label className="min-w-0">
          <span className="sr-only">Parts spreadsheet</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileChange}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-extrabold file:uppercase file:tracking-wide file:text-slate-700"
          />
        </label>
        <label>
          <span className="sr-only">Model number</span>
          <input
            value={modelNumber}
            onChange={(event) => setModelNumber(event.target.value)}
            placeholder="Model"
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label>
          <span className="sr-only">Import source</span>
          <input
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="Source"
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label>
          <span className="sr-only">Admin key</span>
          <input
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            type="password"
            placeholder="Admin key"
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <button
          type="button"
          onClick={uploadSpreadsheet}
          disabled={isUploading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          Upload
        </button>
        <a
          href={readAllHref}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-extrabold uppercase tracking-wide text-slate-700 hover:border-blue-500 hover:text-blue-700"
        >
          <Database className="h-4 w-4" />
          Read DB
        </a>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
        <span>{countLabel}</span>
        {fileName ? <span className="font-mono text-slate-400">{fileName}</span> : null}
        {result?.success ? (
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {result.insertedParts || 0} new, {result.updatedParts || 0} updated, {result.pricedParts || 0} priced
          </span>
        ) : null}
        {result?.success === false ? (
          <span className="inline-flex items-center gap-1 text-red-700">
            <AlertCircle className="h-4 w-4" />
            {result.error}
          </span>
        ) : null}
      </div>
    </section>
  );
}
