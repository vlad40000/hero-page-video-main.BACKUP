"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  model: string | null;
  serial: string | null;
  brand: string | null;
  applianceType: string | null;
  manufactureHint?: string | null;
  status: string;
  requestedPartNumber: string | null;
  requestedPartDescription: string | null;
  revision: string | null;
  parts: Array<{
    canonicalPartNumber: string;
    canonicalPartName: string;
  }>;
};

export default function PartRequestSummary({
  model,
  serial,
  brand,
  applianceType,
  manufactureHint,
  status,
  requestedPartNumber,
  requestedPartDescription,
  revision,
  parts,
}: Props) {
  const [copied, setCopied] = useState(false);

  const summary = [
    `Model: ${model || "Unknown"}`,
    `Serial: ${serial || "Not provided"}`,
    `Brand: ${brand || "Unknown"}`,
    `Appliance: ${applianceType || "Unknown"}`,
    `Status: ${status}`,
    `Requested part number: ${requestedPartNumber || "Not provided"}`,
    `Part description: ${requestedPartDescription || "Not provided"}`,
    `Revision: ${revision || "Not selected"}`,
    `Manufacture hint: ${manufactureHint || "None"}`,
    "",
    "Top parts:",
    ...parts.slice(0, 5).map((p) => `- ${p.canonicalPartNumber} • ${p.canonicalPartName}`),
  ].join("\n");

  async function handleCopy() {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Part Request Summary</div>
          <div className="mt-1 text-sm text-slate-500">Copy this exact lookup summary for the shop.</div>
        </div>
        <Button type="button" variant="outline" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy Summary"}
        </Button>
      </div>

      <div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{summary}</div>
    </div>
  );
}
