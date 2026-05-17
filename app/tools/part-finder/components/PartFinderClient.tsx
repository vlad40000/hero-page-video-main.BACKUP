"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useMemo, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  Phone,
  Search,
  Send,
  Upload,
  Wrench,
  PackageSearch,
  Refrigerator,
  WashingMachine,
  Wind,
  Flame,
} from "lucide-react";
import { LoadingLogo } from "@/components/LoadingLogo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PartFinderResponse } from "@/lib/tools/parts/types";
import ResultBadge from "./ResultBadge";
import {
  buildRouteIdentity,
  filterRevisionCandidates,
  routeStatusLabel,
} from "../marketplaceIdentity";
import VerificationBadge from "./VerificationBadge";
import { verifyExtractedPartNumber } from "../partImageVerification";

// ─── constants ────────────────────────────────────────────────────────────────

const APPLIANCE_TYPES = [
  { value: "Washer", label: "Washer", icon: WashingMachine },
  { value: "Dryer", label: "Dryer", icon: Wind },
  { value: "Washer/Dryer Combo", label: "Washer/Dryer Combo", icon: WashingMachine },
  { value: "Refrigerator", label: "Refrigerator", icon: Refrigerator },
  { value: "Stove", label: "Stove", icon: Flame },
] as const;

const COMMON_SYMPTOMS = [
  { label: "Won't drain", description: "washer won't drain water after cycle", emoji: "💧" },
  { label: "Won't spin", description: "drum not spinning or agitating", emoji: "🔄" },
  { label: "Won't start", description: "appliance won't turn on or start", emoji: "⚡" },
  { label: "Leaking water", description: "water leaking from appliance", emoji: "🚿" },
  { label: "Not cooling", description: "refrigerator not cooling or freezing", emoji: "🌡️" },
  { label: "Loud noise", description: "loud banging or grinding noise during operation", emoji: "🔊" },
  { label: "Door won't close", description: "door latch or seal not closing properly", emoji: "🚪" },
  { label: "Not heating", description: "dryer or oven not producing heat", emoji: "🔥" },
  { label: "Something else", description: "", emoji: "🔧" },
] as const;

const SYMPTOM_CAUSES: Record<string, { cause: string; searchHint: string }[]> = {
  "washer won't drain water after cycle": [
    { cause: "Drain pump", searchHint: "drain pump" },
    { cause: "Lid switch", searchHint: "lid switch" },
    { cause: "Pump belt", searchHint: "pump belt" },
  ],
  "drum not spinning or agitating": [
    { cause: "Drive belt", searchHint: "drive belt" },
    { cause: "Motor coupling", searchHint: "motor coupling" },
    { cause: "Lid switch", searchHint: "lid switch" },
  ],
  "appliance won't turn on or start": [
    { cause: "Door latch", searchHint: "door latch" },
    { cause: "Thermal fuse", searchHint: "thermal fuse" },
    { cause: "Control board", searchHint: "control board" },
  ],
  "water leaking from appliance": [
    { cause: "Door boot seal", searchHint: "door boot seal gasket" },
    { cause: "Hose or connection", searchHint: "inlet hose drain hose" },
    { cause: "Water inlet valve", searchHint: "water inlet valve" },
  ],
  "refrigerator not cooling or freezing": [
    { cause: "Condenser fan", searchHint: "condenser fan motor" },
    { cause: "Evaporator fan", searchHint: "evaporator fan motor" },
    { cause: "Start relay", searchHint: "start relay" },
  ],
  "loud banging or grinding noise during operation": [
    { cause: "Drum bearing", searchHint: "drum bearing" },
    { cause: "Drum rollers", searchHint: "drum roller" },
    { cause: "Drive belt", searchHint: "drive belt" },
  ],
  "door latch or seal not closing properly": [
    { cause: "Door latch", searchHint: "door latch" },
    { cause: "Door gasket", searchHint: "door gasket" },
    { cause: "Door hinge", searchHint: "door hinge" },
  ],
  "dryer or oven not producing heat": [
    { cause: "Thermal fuse", searchHint: "thermal fuse" },
    { cause: "Heating element", searchHint: "heating element" },
    { cause: "High-limit thermostat", searchHint: "thermostat" },
  ],
};

const POPULAR_MODELS = ["WDT730PAHZ0", "MVWC565FW0", "RF28R7351SR"];
const SHOP_PHONE_HREF = "tel:843-536-6005";
const PART_DESCRIPTION_STOP_WORDS = new Set([
  "a","an","and","appliance","for","from","i","it","need","needs","part","please","that","the","this","to","with",
]);

// ─── types ────────────────────────────────────────────────────────────────────

type SlideKey = "welcome" | "symptom" | "type" | "model" | "searching" | "part";
type RouteCandidate = { revision: string; label: string; confidence?: number };
type RouteResult = PartFinderResponse & { candidates?: RouteCandidate[]; reason?: string };
type ImageInputSource = "upload" | "camera";
type FinderPart = PartFinderResponse["parts"][number];
type PartResolveResponse = { parts?: FinderPart[]; message?: string; source?: string; error?: string };

// ─── helpers ──────────────────────────────────────────────────────────────────

function track(event: string, payload?: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rra-track", { detail: { event, payload } }));
  }
}

function partDescriptionTokens(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/[\s-]+/)
    .map((t) => t.trim()).filter((t) => t.length > 2 && !PART_DESCRIPTION_STOP_WORDS.has(t));
}

function scorePartDescription(part: FinderPart, tokens: string[]) {
  if (!tokens.length) return 0;
  const hay = [part.canonicalPartNumber, part.canonicalPartName, part.normalizedCategory, part.normalizedSection]
    .filter(Boolean).join(" ").toLowerCase();
  return tokens.reduce((s, t) => (hay.includes(t) ? s + 2 : s), 0);
}

function filterPartsForRequest(parts: FinderPart[], pn: string, desc: string, showAll: boolean) {
  const q = pn.trim().toUpperCase();
  if (q) return parts.filter((p) =>
    [p.canonicalPartNumber, p.canonicalPartName, p.normalizedCategory, p.normalizedSection]
      .some((v) => String(v || "").toUpperCase().includes(q)));
  if (desc.trim()) {
    const tokens = partDescriptionTokens(desc);
    if (tokens.length) return parts.map((p) => ({ p, score: scorePartDescription(p, tokens) }))
      .filter((e) => e.score > 0).sort((a, b) => b.score - a.score).map((e) => e.p);
  }
  return showAll ? parts : [];
}

function mergeParts(primary: FinderPart[], secondary: FinderPart[]) {
  const map = new Map<string, FinderPart>();
  for (const p of [...primary, ...secondary]) {
    const k = String(p.canonicalPartNumber || "").trim().toUpperCase();
    if (!k) continue;
    const ex = map.get(k);
    if (!ex || (!ex.retailPriceVerified && p.retailPriceVerified)) map.set(k, p);
  }
  return [...map.values()];
}

function formatPrice(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? `$${n.toFixed(2)}` : "";
}

// ─── sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  const labels = ["Issue", "Type", "Model", "Parts"];
  return (
    <div className="w-full">
      <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-400">
        <span>Step {step} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 hidden grid-cols-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
        {labels.map((label, index) => (
          <span key={label} className={index + 1 <= step ? "text-blue-700" : ""}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function SlideShell({ children, onBack, step, total }: {
  children: React.ReactNode; onBack?: () => void; step: number; total: number;
}) {
  return (
    <div className="fix-step-enter flex min-h-[560px] flex-col">
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button type="button" onClick={onBack}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : <div className="w-8" />}
          <div className="flex-1"><ProgressBar step={step} total={total} /></div>
        </div>
      </div>
      <div className="flex flex-1 flex-col px-6 pb-8 pt-6">{children}</div>
    </div>
  );
}

function SlideHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-7">
      <h2 className="text-2xl font-bold leading-snug text-slate-900">{title}</h2>
      {sub && <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{sub}</p>}
    </div>
  );
}

function ContinueBtn({ onClick, disabled, loading, label = "Continue" }: {
  onClick: () => void; disabled?: boolean; loading?: boolean; label?: string;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled || loading}
      className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
      {loading
        ? <><LoadingLogo size={22} label="Working" /> Working…</>
        : <>{label}<ArrowRight className="h-5 w-5" /></>}
    </button>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

function ToolHeader() {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href="/"
        aria-label="Return to Road Runner Appliance home"
        className="flex items-center gap-3 rounded-xl transition hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      >
        <div className="relative h-14 w-20 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <Image src="/images/roadrunner-running.png" alt="Road Runner Appliance" fill sizes="80px" className="object-contain p-1" priority />
        </div>
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">Road Runner Appliance</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Parts Lookup</h1>
        </div>
      </Link>
      <a
        href={SHOP_PHONE_HREF}
        onClick={() => track("tool_part_finder_header_call")}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
      >
        <Phone className="h-4 w-4" />
        Call Now
      </a>
    </div>
  );
}

function WelcomeScreen({ onStart, onKnownPart }: { onStart: () => void; onKnownPart: () => void }) {
  return (
    <div className="fix-step-enter grid min-h-[560px] overflow-hidden md:grid-cols-[1.05fr_0.95fr]">
      <div className="flex flex-col justify-center px-6 py-10 md:px-10">
        <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">
          <PackageSearch className="h-4 w-4" />
          Live catalog lookup
        </div>
        <h2 className="max-w-md text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
          Find the right appliance part.
        </h2>
        <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
          Answer a few quick questions, enter the model number, and Road Runner will check the current parts catalog for matches and pricing.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98]"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onKnownPart}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
          >
            <Search className="h-4 w-4" />
            I know the part
          </button>
        </div>
      </div>
      <div className="flex flex-col justify-center border-t border-slate-100 bg-slate-50 px-6 py-8 md:border-l md:border-t-0 md:px-8">
        <div className="grid gap-3">
          {[
            ["1", "Describe the issue", "Optional symptom details help narrow likely parts."],
            ["2", "Enter the model", "Use the rating plate photo reader or type the model number."],
            ["3", "Review matches", "Prices and availability come from the live parts pipeline."],
          ].map(([step, title, copy]) => (
            <div key={step} className="fix-card-hover rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">{step}</span>
                <div>
                  <p className="font-bold text-slate-900">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{copy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PartFinderClient() {
  const ratingPlateCameraRef = useRef<HTMLInputElement>(null);
  const partStickerCameraRef = useRef<HTMLInputElement>(null);

  // wizard
  const [slide, setSlide] = useState<SlideKey>("welcome");
  const [applianceType, setApplianceType] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [symptomDesc, setSymptomDesc] = useState("");   // blank = "something else"
  const [customSymptom, setCustomSymptom] = useState("");

  // part search
  const [requestedPartNumber, setRequestedPartNumber] = useState("");
  const [requestedPartDescription, setRequestedPartDescription] = useState("");
  const [showAllParts, setShowAllParts] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<string | null>(null);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [partSearchSubmitted, setPartSearchSubmitted] = useState(false);
  const [targetedParts, setTargetedParts] = useState<FinderPart[]>([]);
  const [targetedPartMessage, setTargetedPartMessage] = useState<string | null>(null);

  // part sticker
  const [partImageFile, setPartImageFile] = useState<File | null>(null);
  const [partImageSource, setPartImageSource] = useState<ImageInputSource | null>(null);

  // lead
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSuccess, setLeadSuccess] = useState<string | null>(null);

  // transitions
  const [isSearching, startSearchTransition] = useTransition();
  const [isExtracting, startExtractTransition] = useTransition();
  const [isReadingPartImage, startPartImageTransition] = useTransition();
  const [isResolvingPart, startPartResolveTransition] = useTransition();
  const [isSendingLead, startLeadTransition] = useTransition();

  const effectiveDesc = symptomDesc !== "" ? symptomDesc : customSymptom;

  // derived
  const routeIdentity = useMemo(() => buildRouteIdentity({
    model: result?.canonicalModel || result?.modelNumber || modelNumber,
    serial: result?.serialNumberUsed || serialNumber,
    resultBrand: result?.brand || null,
    resultProductType: result?.productType || null,
  }), [result, modelNumber, serialNumber]);

  const filteredCandidates = useMemo(() =>
    filterRevisionCandidates(result?.canonicalModel || result?.modelNumber || modelNumber || "", result?.candidates || []),
    [result, modelNumber]);

  const effectiveBadgeTone = useMemo(() => {
    if (result?.status === "bom_complete") return "verified";
    if (result?.status === "parts_partial") return "likely";
    if (result?.status === "variant_resolution_needed" && filteredCandidates.length > 0) return "revision";
    if (result?.status === "variant_resolution_needed") return "review";
    if (result?.status === "needs_fallback") return "review";
    return "pending";
  }, [result, filteredCandidates]) as "verified" | "likely" | "revision" | "review" | "pending";

  const effectiveStatusLabel = useMemo(() => routeStatusLabel(result?.status, filteredCandidates.length), [result, filteredCandidates]);

  const verifiedPartMatch = useMemo(() => verifyExtractedPartNumber(requestedPartNumber, result?.parts || []), [requestedPartNumber, result]);

  const matchedSymptom = useMemo(() => COMMON_SYMPTOMS.find((s) => s.description === symptomDesc) ?? null, [symptomDesc]);

  const symptomCauses = useMemo(() => {
    if (!matchedSymptom?.description) return [];
    return SYMPTOM_CAUSES[matchedSymptom.description] ?? [];
  }, [matchedSymptom]);

  const displayedParts = useMemo(() => {
    const parts = result?.parts || [];
    const local = filterPartsForRequest(parts, requestedPartNumber, requestedPartDescription, showAllParts);
    if (partSearchSubmitted && (requestedPartNumber.trim() || requestedPartDescription.trim()) && targetedParts.length > 0)
      return mergeParts(local, targetedParts);
    return local;
  }, [partSearchSubmitted, result, requestedPartDescription, requestedPartNumber, showAllParts, targetedParts]);

  // ── API ───────────────────────────────────────────────────────────────────────

  async function persistPN(pn = requestedPartNumber) {
    const clean = pn.trim().toUpperCase();
    if (!clean) return;
    const match = verifyExtractedPartNumber(clean, result?.parts || []);
    const matchedPart = result?.parts?.find((p) => p.canonicalPartNumber === match.matchedPartNumber);
    try {
      await fetch("/api/tools/parts/lookup-part", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partNumber: clean, modelNumber: result?.canonicalModel || result?.modelNumber || modelNumber || undefined,
          source: match.status === "verified" ? "part-finder-verified-entry" : "part-finder-entry", matchedPart }),
      });
    } catch { /* non-blocking */ }
  }

  async function runSearch(payload: Record<string, unknown>) {
    const res = await fetch("/api/tools/parts/search", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const data = (await res.json()) as RouteResult & { error?: string };
    if (!res.ok) throw new Error(data.error || "Part search failed.");
    return data;
  }

  async function resolvePartRequest(localCandidates: FinderPart[]) {
    if (!result && !modelNumber.trim()) return;
    const res = await fetch("/api/tools/parts/resolve-request", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelNumber: result?.canonicalModel || result?.modelNumber || modelNumber || undefined,
        serialNumber: result?.serialNumberUsed || serialNumber || undefined,
        brand: result?.brand || routeIdentity.brand || undefined,
        productType: result?.productType || routeIdentity.applianceType || undefined,
        partNumber: requestedPartNumber.trim() || undefined,
        partDescription: requestedPartDescription.trim() || undefined,
        localCandidates: localCandidates.slice(0, 8),
      }),
    });
    const data = (await res.json()) as PartResolveResponse;
    if (!res.ok) throw new Error(data.error || "Part price lookup failed.");
    setTargetedParts(Array.isArray(data.parts) ? data.parts : []);
    setTargetedPartMessage(data.message || null);
    track("tool_part_finder_targeted_part_lookup", { source: data.source, partsReturned: Array.isArray(data.parts) ? data.parts.length : 0 });
  }

  // ── handlers ──────────────────────────────────────────────────────────────────

  function resetPartState() {
    setRequestedPartNumber(""); setRequestedPartDescription(""); setShowAllParts(false);
    setPartImageFile(null); setPartImageSource(null); setPartSearchSubmitted(false);
    setTargetedParts([]); setTargetedPartMessage(null);
  }

  function handleSearchSubmit() {
    const cleanModel = modelNumber.trim().toUpperCase();
    if (!cleanModel) return;
    setError(null); setResult(null); resetPartState(); setSlide("searching");
    track("tool_part_finder_start", { modelNumber: cleanModel, serialNumberPresent: Boolean(serialNumber) });
    startSearchTransition(async () => {
      try {
        const data = await runSearch({ action: "start", modelNumber: cleanModel,
          serialNumber: serialNumber.trim().toUpperCase() || undefined,
          productType: applianceType || undefined, partDescription: effectiveDesc.trim() || undefined });
        setResult(data); setSlide("part");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed."); setSlide("model");
      }
    });
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>, source: ImageInputSource = "upload") {
    const file = e.target.files?.[0] ?? null;
    if (file) { setError(null); setResult(null); resetPartState(); setSlide("searching");
      startExtractTransition(async () => {
        try {
          const form = new FormData(); form.append("image", file);
          const res = await fetch("/api/tools/parts/extract-model", { method: "POST", body: form });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Could not read label.");
          const em = String(data.normalizedModel || data.modelNumber || "").toUpperCase();
          const es = String(data.normalizedSerial || data.serialNumber || "").toUpperCase();
          if (em) setModelNumber(em); if (es) setSerialNumber(es);
          track("tool_part_finder_extract_model", { extractedModel: em, extractedSerialPresent: Boolean(es) });
          if (em) {
            const next = await runSearch({ action: "start", modelNumber: em, serialNumber: es || undefined,
              brand: data.brand || undefined, productType: data.productType || applianceType || undefined,
              partDescription: effectiveDesc.trim() || undefined });
            setResult(next); setSlide("part");
          } else { setError("Couldn't read a model number from that photo. Type it below."); setSlide("model"); }
        } catch (err) { setError(err instanceof Error ? err.message : "Image extraction failed."); setSlide("model"); }
      });
    }
  }

  function handlePartSearchSubmit(e?: FormEvent) {
    e?.preventDefault(); setError(null); setTargetedParts([]); setTargetedPartMessage(null); setPartSearchSubmitted(true);
    if (requestedPartNumber.trim()) void persistPN();
    const local = filterPartsForRequest(result?.parts || [], requestedPartNumber, requestedPartDescription, false);
    if (requestedPartNumber.trim() || requestedPartDescription.trim()) {
      startPartResolveTransition(async () => {
        try { await resolvePartRequest(local); }
        catch (err) { setTargetedPartMessage(err instanceof Error ? err.message : "Lookup failed. Call Road Runner to confirm."); }
      });
    }
    track("tool_part_finder_part_search", { requestedPartNumberPresent: Boolean(requestedPartNumber.trim()), requestedPartDescriptionPresent: Boolean(requestedPartDescription.trim()) });
  }

  function handlePartImageExtract() {
    if (!partImageFile) return; setError(null);
    startPartImageTransition(async () => {
      try {
        const form = new FormData(); form.append("image", partImageFile);
        const res = await fetch("/api/tools/parts/extract-part", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not read sticker.");
        const pn = String(data.extractedPartNumber || "").toUpperCase();
        setRequestedPartNumber(pn); setTargetedParts([]); setTargetedPartMessage(null);
        void persistPN(pn); setPartSearchSubmitted(Boolean(pn));
        track("tool_part_finder_scan_part", { extractedPartNumber: pn, confidence: data.confidence });
      } catch (err) { setError(err instanceof Error ? err.message : "Sticker read failed."); }
    });
  }

  function handleContinueSearch(revision?: string) {
    if (!result?.searchSessionId) return;
    setError(null); if (revision) setSelectedRevision(revision); resetPartState();
    startSearchTransition(async () => {
      try {
        const data = await runSearch({ action: "continue", searchSessionId: result.searchSessionId, revision });
        setResult(data);
      } catch (err) { setError(err instanceof Error ? err.message : "Unable to continue search."); }
    });
  }

  function handleLeadSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null); setLeadSuccess(null);
    startLeadTransition(async () => {
      try {
        const res = await fetch("/api/leads", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: leadEmail || undefined, phone: leadPhone || undefined, intentType: "BUY",
            applianceCategory: routeIdentity.applianceType || result?.productType || undefined,
            brand: routeIdentity.brand || result?.brand || undefined,
            metadata: { tool: "part-finder", customerName: leadName || undefined,
              modelNumber: result?.modelNumber || modelNumber || undefined, canonicalModel: result?.canonicalModel || undefined,
              serialNumber: serialNumber || undefined, requestedPartNumber: requestedPartNumber || undefined,
              requestedPartDescription: requestedPartDescription || undefined, status: result?.status || undefined,
              partsShown: result?.parts?.length || 0, searchSessionId: result?.searchSessionId || undefined,
              selectedRevision: selectedRevision || undefined, pagePath: "/tools/part-finder" } }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Lead capture failed.");
        track("tool_part_finder_lead_submit", { leadId: data.leadId, status: result?.status });
        setLeadSuccess("Sent! Road Runner has your details."); setLeadName(""); setLeadEmail(""); setLeadPhone("");
      } catch (err) { setError(err instanceof Error ? err.message : "Unable to send."); }
    });
  }

  const TOTAL = 4;

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl">
      <ToolHeader />

      {/* wizard */}
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-950/5">

          {slide === "welcome" && (
            <WelcomeScreen
              onStart={() => setSlide("symptom")}
              onKnownPart={() => { setSymptomDesc(""); setCustomSymptom(""); setSlide("model"); }}
            />
          )}

          {/* ── SLIDE 1: symptom ─────────────────────────────────────────────── */}
          {slide === "symptom" && (
            <SlideShell step={1} total={TOTAL}>
              <SlideHeading title="What's going wrong?" sub="Pick the closest match — we'll use this to narrow down the right part." />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {COMMON_SYMPTOMS.map((s) => {
                  const isOther = s.label === "Something else";
                  const active = isOther ? (symptomDesc === "" && customSymptom !== "") : symptomDesc === s.description;
                  return (
                    <button key={s.label} type="button"
                      onClick={() => { if (isOther) { setSymptomDesc(""); } else { setSymptomDesc(s.description); setCustomSymptom(""); } }}
                      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all ${active ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50"}`}>
                      <span className="text-xl leading-none">{s.emoji}</span>
                      <span className="text-sm font-medium">{s.label}</span>
                      {active && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
              {symptomDesc === "" && (
                <textarea value={customSymptom} onChange={(e) => setCustomSymptom(e.target.value)}
                  placeholder="Describe what's happening…"
                  className="mt-4 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[80px]"
                  maxLength={400} />
              )}
              <ContinueBtn onClick={() => setSlide("type")} label="Next" />
              <button type="button" onClick={() => { setSymptomDesc(""); setCustomSymptom(""); setSlide("type"); }}
                className="mt-2 w-full text-center text-sm text-slate-400 transition hover:text-slate-600">
                Skip — I already know the part number
              </button>
            </SlideShell>
          )}

          {/* ── SLIDE 2: appliance type ──────────────────────────────────────── */}
          {slide === "type" && (
            <SlideShell step={2} total={TOTAL} onBack={() => setSlide("symptom")}>
              <SlideHeading title="What kind of appliance?" sub="This helps us pull from the right parts catalog." />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {APPLIANCE_TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = applianceType === t.value;
                  return (
                    <button key={t.value} type="button" onClick={() => setApplianceType(active ? "" : t.value)}
                      className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-5 transition-all ${active ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50"}`}>
                      <Icon className="h-7 w-7" />
                      <span className="text-sm font-semibold leading-tight text-center">{t.label}</span>
                    </button>
                  );
                })}
              </div>
              <ContinueBtn onClick={() => setSlide("model")} label={applianceType ? `Continue — ${applianceType}` : "Continue"} />
              <button type="button" onClick={() => { setApplianceType(""); setSlide("model"); }}
                className="mt-2 w-full text-center text-sm text-slate-400 transition hover:text-slate-600">
                Not sure — skip
              </button>
            </SlideShell>
          )}

          {/* ── SLIDE 3: model number ────────────────────────────────────────── */}
          {slide === "model" && (
            <SlideShell step={3} total={TOTAL} onBack={() => setSlide("type")}>
              <SlideHeading title="Enter your model number" sub="Find it inside the door, on the back, or under the kickplate." />

              {/* photo snap CTA */}
              <button type="button" onClick={() => ratingPlateCameraRef.current?.click()}
                className="mb-5 flex w-full items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-left transition hover:border-blue-400 hover:bg-blue-50/40 active:scale-[0.99]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Camera className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">Snap the label instead</p>
                  <p className="text-xs text-slate-500">We&apos;ll read the model number from your photo</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
              <input ref={ratingPlateCameraRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => handleFileChange(e, "camera")} />
              {/* also allow desktop file upload */}
              <label className="mb-5 flex w-full cursor-pointer items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-left transition hover:border-slate-300 hover:bg-slate-50">
                <Upload className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="text-sm text-slate-500">Upload label photo</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => handleFileChange(e, "upload")} />
              </label>

              <div className="relative mb-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">or type it in</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Model number <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={modelNumber} onChange={(e) => setModelNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. MVWB300WQ2" autoCapitalize="characters"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {POPULAR_MODELS.map((m) => (
                      <button key={m} type="button" onClick={() => setModelNumber(m)}
                        className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs text-slate-500 transition hover:bg-slate-200">
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Serial number <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                    placeholder="Helps pinpoint manufacture date" autoCapitalize="characters"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
                </div>
              )}

              <ContinueBtn onClick={handleSearchSubmit} disabled={!modelNumber.trim()} loading={isSearching || isExtracting} label="Find parts" />
            </SlideShell>
          )}

          {/* ── SEARCHING ─────────────────────────────────────────────────────── */}
          {slide === "searching" && (
            <div className="flex min-h-[560px] flex-col items-center justify-center gap-6 px-6 py-12 text-center animate-in fade-in duration-300">
              <LoadingLogo size={96} label="Looking up your appliance" />
              <div>
                <h3 className="text-xl font-bold text-slate-900">Looking up your appliance…</h3>
                <p className="mt-1 animate-pulse text-sm text-slate-400">Searching parts catalogs</p>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* ── SLIDE 4: part results ─────────────────────────────────────────── */}
          {slide === "part" && result && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              {/* machine confirmed banner */}
              <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {routeIdentity.brand || ""} {routeIdentity.applianceType || "Appliance"} — {result.canonicalModel || result.modelNumber || modelNumber}
                      </p>
                      <p className="text-xs text-slate-500">{result.message}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <ResultBadge tone={effectiveBadgeTone}>{effectiveStatusLabel}</ResultBadge>
                    <button type="button" onClick={() => { setResult(null); setSlide("model"); setError(null); }}
                      className="text-xs text-slate-400 underline transition hover:text-slate-600">Change</button>
                  </div>
                </div>
              </div>

              <div className="space-y-6 px-6 py-6">
                {/* variant resolution */}
                {result.status === "variant_resolution_needed" && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                    <p className="font-semibold text-violet-900">{filteredCandidates.length > 0 ? "Which revision is yours?" : "Shop review needed"}</p>
                    <p className="mt-1 text-sm text-violet-800">
                      {filteredCandidates.length > 0 ? result.reason || "Choose your revision to load the right parts diagram." : "Add a label photo or send this to Road Runner to verify."}
                    </p>
                    {filteredCandidates.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {filteredCandidates.map((c) => (
                          <button key={c.revision} type="button" disabled={isSearching} onClick={() => handleContinueSearch(c.revision)}
                            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${selectedRevision === c.revision ? "border-violet-600 bg-violet-600 text-white" : "border-violet-300 bg-white text-violet-800 hover:border-violet-500"}`}>
                            {c.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* symptom-driven part suggestions */}
                {symptomCauses.length > 0 && (
                  <div>
                    <p className="mb-3 text-sm font-semibold text-slate-700">Common parts for &quot;{matchedSymptom?.label}&quot;</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {symptomCauses.map((item, i) => (
                        <button key={i} type="button"
                          onClick={() => {
                            setRequestedPartDescription(item.searchHint); setPartSearchSubmitted(true);
                            const local = filterPartsForRequest(result?.parts || [], "", item.searchHint, false);
                            startPartResolveTransition(async () => { try { await resolvePartRequest(local); } catch { /* silent */ } });
                          }}
                          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-400 hover:shadow-md">
                          <span className="text-base">🔩</span>
                          <span className="flex-1">{item.cause}</span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* part search form */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="mb-4 text-sm font-semibold text-slate-800">Know the part number or name?</p>
                  <form onSubmit={handlePartSearchSubmit} className="space-y-3">
                    <input type="text" value={requestedPartNumber}
                      onChange={(e) => { setRequestedPartNumber(e.target.value.toUpperCase()); setPartSearchSubmitted(false); setTargetedParts([]); }}
                      onBlur={() => void persistPN()} placeholder="Part number, e.g. WPW10712395" autoCapitalize="characters"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    <textarea value={requestedPartDescription}
                      onChange={(e) => { setRequestedPartDescription(e.target.value); setPartSearchSubmitted(false); setTargetedParts([]); }}
                      placeholder="Or describe it: drain pump, door latch, control board…" rows={2}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      maxLength={400} />
                    <div className="flex gap-2">
                      <button type="submit"
                        disabled={isResolvingPart || (!requestedPartNumber.trim() && !requestedPartDescription.trim())}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40">
                        {isResolvingPart ? <LoadingLogo size={18} label="Searching parts" /> : <Search className="h-4 w-4" />}
                        {isResolvingPart ? "Searching…" : "Search parts"}
                      </button>
                      <button type="button"
                        onClick={() => { setShowAllParts((p) => { const n = !p; setPartSearchSubmitted(n); setTargetedParts([]); return n; }); }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">
                        {showAllParts ? "Hide list" : "Browse all"}
                      </button>
                    </div>
                  </form>

                  {/* part sticker scan — collapsed */}
                  <details className="mt-4">
                    <summary className="cursor-pointer select-none text-xs font-medium text-slate-500 transition hover:text-slate-700">
                      📷 Scan the sticker on the old part instead
                    </summary>
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => partStickerCameraRef.current?.click()}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
                          <Camera className="h-3.5 w-3.5" /> Take photo
                        </button>
                        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
                          <Upload className="h-3.5 w-3.5" /> Upload
                          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                            onChange={(e) => { setPartImageFile(e.target.files?.[0] ?? null); setPartImageSource("upload"); }} />
                        </label>
                        <button type="button" onClick={handlePartImageExtract} disabled={!partImageFile || isReadingPartImage}
                          className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-40">
                          {isReadingPartImage ? <LoadingLogo size={16} label="Reading sticker" /> : null}
                          {isReadingPartImage ? "Reading…" : "Read sticker"}
                        </button>
                      </div>
                      <input ref={partStickerCameraRef} type="file" accept="image/*" capture="environment" className="sr-only"
                        onChange={(e) => { setPartImageFile(e.target.files?.[0] ?? null); setPartImageSource("camera"); }} />
                      {partImageFile && <p className="text-xs text-slate-500">Ready: {partImageFile.name}</p>}
                      {requestedPartNumber && verifiedPartMatch.status && (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-800">{requestedPartNumber}</span>
                          <VerificationBadge status={verifiedPartMatch.status} />
                        </div>
                      )}
                    </div>
                  </details>
                </div>

                {/* error */}
                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
                  </div>
                )}

                {/* search status */}
                {partSearchSubmitted && (requestedPartNumber.trim() || requestedPartDescription.trim()) && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    {isResolvingPart ? (
                      <span className="flex items-center gap-2 text-slate-600"><LoadingLogo size={18} label="Checking availability and pricing" /> Checking availability and pricing…</span>
                    ) : displayedParts.length > 0 ? (
                      <span className="font-medium text-emerald-700">✓ {displayedParts.length} match{displayedParts.length === 1 ? "" : "es"} found</span>
                    ) : (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-slate-600">{targetedPartMessage || "No catalog price yet — call Road Runner to confirm."}</span>
                        <a href={SHOP_PHONE_HREF} onClick={() => track("tool_part_finder_call_now_unresolved")}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                          <Phone className="h-4 w-4" /> Call now
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* parts table */}
                {partSearchSubmitted && displayedParts.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Part</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Part #</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600">Price</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-600">Order</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {displayedParts.map((part, i) => (
                          <tr key={`${part.canonicalPartNumber}-${i}`}>
                            <td className="px-4 py-3 text-slate-800">{part.canonicalPartName || "Part"}</td>
                            <td className="px-4 py-3 font-mono text-slate-700">{part.canonicalPartNumber}</td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatPrice(part.retailPrice) || "Call"}
                              {part.retailAvailability && <div className="text-xs text-emerald-600">{part.retailAvailability}</div>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <a href={SHOP_PHONE_HREF}
                                onClick={() => track("tool_part_finder_call_now_part", { partNumber: part.canonicalPartNumber })}
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700">
                                <Phone className="h-3.5 w-3.5" /> Call
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* load more */}
                {partSearchSubmitted && result.hasMore && (
                  <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Not seeing the right part?</p>
                      <p className="text-xs text-amber-700">We can dig deeper into the catalog for this model.</p>
                    </div>
                    <button type="button" onClick={() => handleContinueSearch()} disabled={isSearching}
                      className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-50 disabled:opacity-40">
                      {isSearching ? <LoadingLogo size={18} label="Searching more parts" /> : <Wrench className="h-4 w-4" />}
                      {isSearching ? "Searching…" : "Check more"}
                    </button>
                  </div>
                )}

                {/* shop CTA */}
                <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Need help from the shop?</p>
                    <p className="mt-0.5 text-xs text-blue-700">Road Runner can source most parts — call or send your lookup.</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <a href={SHOP_PHONE_HREF} onClick={() => track("tool_part_finder_call_click")}
                      className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
                      <Phone className="h-4 w-4" /> Call
                    </a>
                    <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
                      <DialogTrigger asChild>
                        <button type="button" className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                          <Send className="h-4 w-4" /> Send details
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Send lookup to Road Runner</DialogTitle>
                          <DialogDescription>We&apos;ll include your model, serial, and part request automatically.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleLeadSubmit} className="space-y-4 pt-2">
                          {([["Name","text",leadName,setLeadName],["Email","email",leadEmail,setLeadEmail],["Phone","tel",leadPhone,setLeadPhone]] as const).map(([label, type, val, setter]) => (
                            <div key={label}>
                              <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
                              <input type={type} value={val} onChange={(e) => (setter as (v: string) => void)(e.target.value)} placeholder="Optional"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                          ))}
                          <button type="submit" disabled={isSendingLead}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
                            {isSendingLead ? <LoadingLogo size={18} label="Sending details" /> : <Send className="h-4 w-4" />}
                            {isSendingLead ? "Sending…" : "Send to Road Runner"}
                          </button>
                          {leadSuccess && (
                            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                              <CheckCircle2 className="h-4 w-4 shrink-0" /> {leadSuccess}
                            </div>
                          )}
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
