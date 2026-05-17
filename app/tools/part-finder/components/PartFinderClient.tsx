"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  PackageSearch,
  Phone,
  Search,
  Send,
  Upload,
  Wrench,
  Refrigerator,
  WashingMachine,
  Wind,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const APPLIANCE_TYPES = [
  { value: "Washer", label: "Washer", icon: WashingMachine },
  { value: "Dryer", label: "Dryer", icon: Wind },
  { value: "Washer/Dryer Combo", label: "Washer/Dryer Combo", icon: WashingMachine },
  { value: "Refrigerator", label: "Refrigerator", icon: Refrigerator },
  { value: "Stove", label: "Stove", icon: Flame },
] as const;

const POPULAR_MODELS = ["WDT730PAHZ0", "MVWC565FW0", "RF28R7351SR"];
const SHOP_PHONE_HREF = "tel:843-536-6005";

const COMMON_SYMPTOMS = [
  { label: "Won't drain", description: "washer won't drain water after cycle" },
  { label: "Won't spin", description: "drum not spinning or agitating" },
  { label: "Won't start", description: "appliance won't turn on or start" },
  { label: "Leaking water", description: "water leaking from appliance" },
  { label: "Not cooling", description: "refrigerator not cooling or freezing" },
  { label: "Loud noise", description: "loud banging or grinding noise during operation" },
  { label: "Door won't close", description: "door latch or seal not closing properly" },
  { label: "Not heating", description: "dryer or oven not producing heat" },
];

const SYMPTOM_CAUSES: Record<string, { cause: string; searchHint: string }[]> = {
  "washer won't drain water after cycle": [
    { cause: "Clogged or failed drain pump", searchHint: "drain pump" },
    { cause: "Defective lid switch preventing spin/drain", searchHint: "lid switch" },
    { cause: "Worn or broken pump belt", searchHint: "pump belt" },
  ],
  "drum not spinning or agitating": [
    { cause: "Broken drive belt", searchHint: "drive belt" },
    { cause: "Worn motor coupling", searchHint: "motor coupling" },
    { cause: "Faulty lid switch (top-load washers)", searchHint: "lid switch" },
  ],
  "appliance won't turn on or start": [
    { cause: "Failed door latch or interlock", searchHint: "door latch" },
    { cause: "Blown thermal fuse", searchHint: "thermal fuse" },
    { cause: "Defective control board", searchHint: "control board" },
  ],
  "water leaking from appliance": [
    { cause: "Torn or worn door boot seal", searchHint: "door boot seal gasket" },
    { cause: "Cracked or loose hose connection", searchHint: "inlet hose drain hose" },
    { cause: "Faulty water inlet valve", searchHint: "water inlet valve" },
  ],
  "refrigerator not cooling or freezing": [
    { cause: "Dirty or failed condenser fan", searchHint: "condenser fan motor" },
    { cause: "Defective evaporator fan motor", searchHint: "evaporator fan motor" },
    { cause: "Failed start relay on compressor", searchHint: "start relay" },
  ],
  "loud banging or grinding noise during operation": [
    { cause: "Worn drum bearing or rear bearing kit", searchHint: "drum bearing" },
    { cause: "Loose or worn drum support rollers", searchHint: "drum roller" },
    { cause: "Damaged drive belt slapping cabinet", searchHint: "drive belt" },
  ],
  "door latch or seal not closing properly": [
    { cause: "Broken door latch or strike", searchHint: "door latch" },
    { cause: "Worn or torn door gasket", searchHint: "door gasket" },
    { cause: "Damaged door hinge", searchHint: "door hinge" },
  ],
  "dryer or oven not producing heat": [
    { cause: "Blown thermal fuse (most common cause)", searchHint: "thermal fuse" },
    { cause: "Failed heating element", searchHint: "heating element" },
    { cause: "Defective high-limit thermostat", searchHint: "thermostat" },
  ],
};
const PART_DESCRIPTION_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "appliance",
  "for",
  "from",
  "i",
  "it",
  "need",
  "needs",
  "part",
  "please",
  "that",
  "the",
  "this",
  "to",
  "with",
]);

type RouteCandidate = {
  revision: string;
  label: string;
  confidence?: number;
};

type RouteResult = PartFinderResponse & {
  candidates?: RouteCandidate[];
  reason?: string;
};

type ImageInputSource = "upload" | "camera";
type FinderStep = "choose-type" | "identify-machine" | "identify-part" | "results";
type FinderPart = PartFinderResponse["parts"][number];
type PartResolveResponse = {
  parts?: FinderPart[];
  message?: string;
  source?: string;
  error?: string;
};

function track(event: string, payload?: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("rra-track", {
        detail: { event, payload },
      })
    );
  }
}

function partDescriptionTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !PART_DESCRIPTION_STOP_WORDS.has(token));
}

function scorePartDescription(part: PartFinderResponse["parts"][number], tokens: string[]) {
  if (!tokens.length) return 0;
  const haystack = [
    part.canonicalPartNumber,
    part.canonicalPartName,
    part.normalizedCategory,
    part.normalizedSection,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return tokens.reduce((score, token) => {
    if (haystack.includes(token)) return score + 2;
    return score;
  }, 0);
}

function filterPartsForRequest(
  parts: FinderPart[],
  partNumber: string,
  partDescription: string,
  showAll: boolean
) {
  const query = partNumber.trim().toUpperCase();
  const descriptionQuery = partDescription.trim();

  if (query) {
    return parts.filter((part) =>
      [
        part.canonicalPartNumber,
        part.canonicalPartName,
        part.normalizedCategory,
        part.normalizedSection,
      ].some((value) => String(value || "").toUpperCase().includes(query))
    );
  }

  if (descriptionQuery) {
    const tokens = partDescriptionTokens(descriptionQuery);
    if (tokens.length) {
      return parts
        .map((part) => ({
          part,
          score: scorePartDescription(part, tokens),
        }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.part);
    }
  }

  return showAll ? parts : [];
}

function mergeParts(primary: FinderPart[], secondary: FinderPart[]) {
  const byNumber = new Map<string, FinderPart>();

  for (const part of [...primary, ...secondary]) {
    const key = String(part.canonicalPartNumber || "").trim().toUpperCase();
    if (!key) continue;
    const existing = byNumber.get(key);
    if (!existing || (!existing.retailPriceVerified && part.retailPriceVerified)) {
      byNumber.set(key, part);
    }
  }

  return [...byNumber.values()];
}

function formatPrice(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? `$${amount.toFixed(2)}` : "";
}

export default function PartFinderClient() {
  const ratingPlateCameraInputRef = useRef<HTMLInputElement>(null);
  const partStickerCameraInputRef = useRef<HTMLInputElement>(null);

  const [applianceType, setApplianceType] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileSource, setSelectedFileSource] = useState<ImageInputSource | null>(null);
  const [requestedPartNumber, setRequestedPartNumber] = useState("");
  const [requestedPartDescription, setRequestedPartDescription] = useState("");
  const [showAllParts, setShowAllParts] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<string | null>(null);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<FinderStep>("choose-type");
  const [partSearchSubmitted, setPartSearchSubmitted] = useState(false);
  const [targetedParts, setTargetedParts] = useState<FinderPart[]>([]);
  const [targetedPartMessage, setTargetedPartMessage] = useState<string | null>(null);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);

  const [partImageFile, setPartImageFile] = useState<File | null>(null);
  const [partImageSource, setPartImageSource] = useState<ImageInputSource | null>(null);
  const [partImageConfidence, setPartImageConfidence] = useState<string | null>(null);
  const [partImageRawText, setPartImageRawText] = useState<string | null>(null);

  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSuccess, setLeadSuccess] = useState<string | null>(null);

  const [isSearching, startSearchTransition] = useTransition();
  const [isExtracting, startExtractTransition] = useTransition();
  const [isReadingPartImage, startPartImageTransition] = useTransition();
  const [isResolvingPart, startPartResolveTransition] = useTransition();
  const [isSendingLead, startLeadTransition] = useTransition();

  const canSearch = modelNumber.trim().length > 0 && !isSearching && !isExtracting;

  const topSummary = useMemo(() => {
    if (!result) return null;
    return {
      model: result.canonicalModel || result.modelNumber || modelNumber || "Unknown model",
      brand: result.brand || "Unknown brand",
      type: result.productType || "Unknown appliance type",
    };
  }, [result, modelNumber]);

  const machineReady = useMemo(() => {
    return Boolean(
      result && (result.canonicalModel || result.modelNumber || modelNumber)
    );
  }, [result, modelNumber]);

  const displayedParts = useMemo(() => {
    const parts = result?.parts || [];
    const localParts = filterPartsForRequest(
      parts,
      requestedPartNumber,
      requestedPartDescription,
      showAllParts
    );

    if (
      partSearchSubmitted &&
      (requestedPartNumber.trim() || requestedPartDescription.trim()) &&
      targetedParts.length > 0
    ) {
      return mergeParts(localParts, targetedParts);
    }

    return localParts;
  }, [partSearchSubmitted, result, requestedPartDescription, requestedPartNumber, showAllParts, targetedParts]);

  const routeIdentity = useMemo(() => {
    return buildRouteIdentity({
      model: result?.canonicalModel || result?.modelNumber || modelNumber,
      serial: result?.serialNumberUsed || serialNumber,
      resultBrand: result?.brand || null,
      resultProductType: result?.productType || null,
    });
  }, [result, modelNumber, serialNumber]);

  const filteredCandidates = useMemo(() => {
    return filterRevisionCandidates(
      result?.canonicalModel || result?.modelNumber || modelNumber || "",
      result?.candidates || []
    );
  }, [result, modelNumber]);

  const effectiveStatusLabel = useMemo(() => {
    return routeStatusLabel(result?.status, filteredCandidates.length);
  }, [result, filteredCandidates]);

  const effectiveBadgeTone = useMemo(() => {
    if (result?.status === "bom_complete") return "verified";
    if (result?.status === "parts_partial") return "likely";
    if (result?.status === "variant_resolution_needed" && filteredCandidates.length > 0) return "revision";
    if (result?.status === "variant_resolution_needed" && filteredCandidates.length === 0) return "review";
    if (result?.status === "needs_fallback") return "review";
    return "pending";
  }, [result, filteredCandidates]) as "verified" | "likely" | "revision" | "review" | "pending";

  const verifiedPartMatch = useMemo(() => {
    return verifyExtractedPartNumber(requestedPartNumber, result?.parts || []);
  }, [requestedPartNumber, result]);

  const matchedSymptom = useMemo(() => {
    return COMMON_SYMPTOMS.find((s) => s.description === requestedPartDescription) ?? null;
  }, [requestedPartDescription]);

  const symptomCauses = useMemo(() => {
    if (!matchedSymptom) return [];
    return SYMPTOM_CAUSES[matchedSymptom.description] ?? [];
  }, [matchedSymptom]);

  async function persistRequestedPartNumber(partNumberValue = requestedPartNumber) {
    const cleanPartNumber = partNumberValue.trim().toUpperCase();
    if (!cleanPartNumber) return;

    const match = verifyExtractedPartNumber(cleanPartNumber, result?.parts || []);
    const matchedPart = result?.parts?.find(
      (part) => part.canonicalPartNumber === match.matchedPartNumber
    );

    try {
      await fetch("/api/tools/parts/lookup-part", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          partNumber: cleanPartNumber,
          modelNumber: result?.canonicalModel || result?.modelNumber || modelNumber || undefined,
          source:
            match.status === "verified"
              ? "part-finder-verified-entry"
              : "part-finder-entry",
          matchedPart,
        }),
      });
    } catch {
      // Persistence is a backend intelligence side effect and should not block the customer flow.
    }
  }

  function handlePartImageChange(event: ChangeEvent<HTMLInputElement>, source: ImageInputSource = "upload") {
    const file = event.target.files?.[0] ?? null;
    setPartImageFile(file);
    setPartImageSource(file ? source : null);
    setPartImageConfidence(null);
    setPartImageRawText(null);
  }

  function handlePartImageExtract() {
    if (!partImageFile) return;

    setError(null);

    startPartImageTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("image", partImageFile);

        const response = await fetch("/api/tools/parts/extract-part", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not read part sticker.");
        }

        setRequestedPartNumber(String(data.extractedPartNumber || "").toUpperCase());
        setPartImageConfidence(String(data.confidence || ""));
        setPartImageRawText(typeof data.rawText === "string" ? data.rawText : null);
        setTargetedParts([]);
        setTargetedPartMessage(null);
        void persistRequestedPartNumber(String(data.extractedPartNumber || "").toUpperCase());
        setPartSearchSubmitted(Boolean(data.extractedPartNumber));
        setCurrentStep("results");

        track("tool_part_finder_scan_part", {
          extractedPartNumber: data.extractedPartNumber,
          status: verifiedPartMatch.status,
          confidence: data.confidence,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Part sticker extraction failed.");
      }
    });
  }

  async function runSearch(payload: Record<string, unknown>) {
    const response = await fetch("/api/tools/parts/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as RouteResult & { error?: string };

    if (!response.ok) {
      throw new Error(data.error || "Part search failed.");
    }

    return data;
  }

  async function resolvePartRequest(localCandidates: FinderPart[]) {
    if (!result && !modelNumber.trim()) return;

    const response = await fetch("/api/tools/parts/resolve-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

    const data = (await response.json()) as PartResolveResponse;
    if (!response.ok) {
      throw new Error(data.error || "Part price lookup failed.");
    }

    setTargetedParts(Array.isArray(data.parts) ? data.parts : []);
    setTargetedPartMessage(data.message || null);

    track("tool_part_finder_targeted_part_lookup", {
      source: data.source,
      partsReturned: Array.isArray(data.parts) ? data.parts.length : 0,
      requestedPartNumberPresent: Boolean(requestedPartNumber.trim()),
      requestedPartDescriptionPresent: Boolean(requestedPartDescription.trim()),
    });
  }

  function handleSearchSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError(null);
    setLeadSuccess(null);
    setSelectedRevision(null);

    const cleanModel = modelNumber.trim().toUpperCase();
    const cleanSerial = serialNumber.trim().toUpperCase();

    if (!cleanModel) return;

    startSearchTransition(async () => {
      try {
        setError(null);
        setLeadSuccess(null);
        setSelectedRevision(null);
        setRequestedPartNumber("");
        setShowAllParts(false);
        setPartImageFile(null);
        setPartImageSource(null);
        setPartImageConfidence(null);
        setPartImageRawText(null);
        setPartSearchSubmitted(false);
        setTargetedParts([]);
        setTargetedPartMessage(null);
        setCurrentStep("identify-machine");
        setResult(null);

        track("tool_part_finder_start", {
          modelNumber: cleanModel,
          serialNumberPresent: Boolean(cleanSerial),
        });

        const data = await runSearch({
          action: "start",
          modelNumber: cleanModel,
          serialNumber: cleanSerial || undefined,
          productType: applianceType || undefined,
          partDescription: requestedPartDescription.trim() || undefined,
        });

        setResult(data);
        setCurrentStep("identify-part");
      } catch (err) {
        setResult(null);
        setCurrentStep("identify-machine");
        setError(err instanceof Error ? err.message : "Unexpected search error.");
      }
    });
  }

  function handleContinueSearch(revision?: string) {
    if (!result?.searchSessionId) return;

    setError(null);
    if (revision) setSelectedRevision(revision);
    setRequestedPartNumber("");
    setShowAllParts(false);
    setPartImageFile(null);
    setPartImageSource(null);
    setPartImageConfidence(null);
    setPartImageRawText(null);
    setPartSearchSubmitted(false);
    setTargetedParts([]);
    setTargetedPartMessage(null);
    setCurrentStep("identify-part");

    startSearchTransition(async () => {
      try {
        track("tool_part_finder_continue", {
          searchSessionId: result.searchSessionId,
          nextStage: result.nextStage,
          revision: revision || null,
        });

        const data = await runSearch({
          action: "continue",
          searchSessionId: result.searchSessionId,
          revision,
        });

        setResult(data);
        setCurrentStep("identify-part");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to continue search.");
      }
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>, source: ImageInputSource = "upload") {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setSelectedFileSource(file ? source : null);
    if (file) {
      handleImageExtract(file);
    }
  }

  function handleImageExtract(file = selectedFile) {
    if (!file) return;

    setError(null);
    setLeadSuccess(null);
    setSelectedRevision(null);
    setRequestedPartNumber("");
    setRequestedPartDescription("");
    setShowAllParts(false);
    setPartImageFile(null);
    setPartImageSource(null);
    setPartImageConfidence(null);
    setPartImageRawText(null);
    setPartSearchSubmitted(false);
    setTargetedParts([]);
    setTargetedPartMessage(null);
    setCurrentStep("identify-machine");
    setResult(null);

    startExtractTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch("/api/tools/parts/extract-model", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not read rating plate.");
        }

        const extractedModel = String(
          data.normalizedModel || data.modelNumber || ""
        ).toUpperCase();

        const extractedSerial = String(
          data.normalizedSerial || data.serialNumber || ""
        ).toUpperCase();

        if (extractedModel) {
          setModelNumber(extractedModel);
        }
        if (extractedSerial) {
          setSerialNumber(extractedSerial);
        }

        track("tool_part_finder_extract_model", {
          extractedModel,
          extractedSerialPresent: Boolean(extractedSerial),
        });

        if (extractedModel) {
          const next = await runSearch({
            action: "start",
            modelNumber: extractedModel,
            serialNumber: extractedSerial || undefined,
            brand: data.brand || undefined,
            productType: data.productType || applianceType || undefined,
            partDescription: requestedPartDescription.trim() || undefined,
          });
          setResult(next);
          setCurrentStep("identify-part");
        } else {
          setCurrentStep("identify-machine");
          setError("We could not confidently read a model number from that image.");
        }
      } catch (err) {
        setCurrentStep("identify-machine");
        setError(err instanceof Error ? err.message : "Image extraction failed.");
      }
    });
  }

  function handlePartSearchSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError(null);
    setTargetedParts([]);
    setTargetedPartMessage(null);
    setPartSearchSubmitted(true);
    setCurrentStep("results");
    if (requestedPartNumber.trim()) {
      void persistRequestedPartNumber();
    }
    const localCandidates = filterPartsForRequest(
      result?.parts || [],
      requestedPartNumber,
      requestedPartDescription,
      false
    );

    if (requestedPartNumber.trim() || requestedPartDescription.trim()) {
      startPartResolveTransition(async () => {
        try {
          await resolvePartRequest(localCandidates);
        } catch (err) {
          setTargetedPartMessage(
            err instanceof Error
              ? err.message
              : "Part price lookup failed. Call now and Road Runner can confirm pricing and availability."
          );
        }
      });
    }

    track("tool_part_finder_part_search", {
      requestedPartNumberPresent: Boolean(requestedPartNumber.trim()),
      requestedPartDescriptionPresent: Boolean(requestedPartDescription.trim()),
      showAllParts,
    });
  }

  function handleLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLeadSuccess(null);

    startLeadTransition(async () => {
      try {
        const response = await fetch("/api/leads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: leadEmail || undefined,
            phone: leadPhone || undefined,
            intentType: "BUY",
            applianceCategory: routeIdentity.applianceType || result?.productType || undefined,
            brand: routeIdentity.brand || result?.brand || undefined,
            symptoms: undefined,
            metadata: {
              tool: "part-finder",
              customerName: leadName || undefined,
              modelNumber: result?.modelNumber || modelNumber || undefined,
              canonicalModel: result?.canonicalModel || undefined,
              serialNumber: serialNumber || undefined,
              requestedPartNumber: requestedPartNumber || undefined,
              requestedPartDescription: requestedPartDescription || undefined,
              status: result?.status || undefined,
              partsShown: result?.parts?.length || 0,
              searchSessionId: result?.searchSessionId || undefined,
              selectedRevision: selectedRevision || undefined,
              pagePath: "/tools/part-finder",
            },
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Lead capture failed.");
        }

        track("tool_part_finder_lead_submit", {
          leadId: data.leadId,
          status: result?.status,
        });

        setLeadSuccess("Sent. Road Runner now has your machine details.");
        setLeadName("");
        setLeadEmail("");
        setLeadPhone("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to send your details.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
          <PackageSearch className="h-4 w-4" />
          Parts Lookup
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
          Find the exact part for your appliance
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
          Tell us what&apos;s wrong or enter your model number — we&apos;ll show you the right part,
          the price, and whether Road Runner has it in stock.
        </p>
      </div>

      {currentStep === "choose-type" ? (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>What&apos;s wrong with your appliance?</CardTitle>
            <CardDescription>
              Pick the closest symptom to get started — or skip straight to your model number.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-3 text-sm font-medium text-slate-700">Common symptoms</div>
              <div className="flex flex-wrap gap-2">
                {COMMON_SYMPTOMS.map((symptom) => {
                  const isActive = requestedPartDescription === symptom.description;
                  return (
                    <button
                      key={symptom.label}
                      type="button"
                      onClick={() =>
                        setRequestedPartDescription(isActive ? "" : symptom.description)
                      }
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700"
                      }`}
                    >
                      {symptom.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Or describe it yourself{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <Textarea
                value={requestedPartDescription}
                onChange={(e) => setRequestedPartDescription(e.target.value)}
                placeholder="E.g., door gasket is torn, pump humming but not draining, makes a grinding noise..."
                className="min-h-[84px] resize-y"
                maxLength={500}
              />
            </div>

            <div>
              <div className="mb-3 text-sm font-medium text-slate-700">
                Appliance type{" "}
                <span className="font-normal text-slate-400">(optional — helps narrow results)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {APPLIANCE_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setApplianceType(applianceType === type.value ? "" : type.value)
                      }
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        applianceType === type.value
                          ? "border-blue-600 bg-blue-50 text-blue-900"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                className="w-full"
                disabled={!requestedPartDescription.trim() && !applianceType}
                onClick={() => setCurrentStep("identify-machine")}
              >
                <Search className="h-4 w-4" />
                {requestedPartDescription.trim()
                  ? "Find parts for this symptom"
                  : "Continue to model number"}
              </Button>
              <button
                type="button"
                onClick={() => setCurrentStep("identify-machine")}
                className="text-center text-xs text-slate-500 underline hover:text-slate-700"
              >
                Skip — I already have my model number
              </button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {currentStep === "identify-machine" ? (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Find your appliance</CardTitle>
              <CardDescription>
                Enter the model number from your appliance label, or snap a photo and we&apos;ll read it for you.
              </CardDescription>
            </div>
            {applianceType && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">{applianceType}</span>
                <button
                  type="button"
                  onClick={() => setCurrentStep("choose-type")}
                  className="text-xs text-slate-500 underline hover:text-slate-700"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Model number
              </label>
              <Input
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value.toUpperCase())}
                placeholder="WDT730PAHZ0"
                autoCapitalize="characters"
              />
            </div>

            <div className="md:col-span-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Serial number
              </label>
              <Input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                placeholder="Optional"
                autoCapitalize="characters"
              />
            </div>

            <div className="md:col-span-3 flex items-end">
              <Button type="submit" className="w-full" disabled={!canSearch}>
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    {result ? "Search Again" : "Find Parts"}
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="mb-3 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Rating plate photo is best for the fastest exact lookup
            </div>
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-8">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Or read the rating plate
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => handleFileChange(event, "upload")}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                />
                <input
                  ref={ratingPlateCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  aria-label="Take rating plate photo"
                  onChange={(event) => handleFileChange(event, "camera")}
                  className="sr-only"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Best if the model and serial label fills most of the image.
                </p>
                {selectedFile ? (
                  <p className="mt-2 text-xs font-medium text-slate-700">
                    {isExtracting ? "Reading rating plate from" : selectedFileSource === "camera" ? "Camera photo received" : "Uploaded image received"}:{" "}
                    {selectedFile.name}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col justify-end gap-2 md:col-span-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => ratingPlateCameraInputRef.current?.click()}
                  disabled={isExtracting || isSearching}
                >
                  <Camera className="h-4 w-4" />
                  Take Photo
                </Button>
                {isExtracting ? (
                  <div className="flex w-full items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reading Rating Plate
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="font-semibold">Popular models:</span>
            {POPULAR_MODELS.map((model) => (
              <button
                key={model}
                type="button"
                onClick={() => setModelNumber(model)}
                className="rounded-full bg-slate-100 px-3 py-1 hover:bg-slate-200"
              >
                {model}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      ) : null}

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <div className="font-semibold text-red-800">Could not complete lookup</div>
              <div className="mt-1 text-sm text-red-700">{error}</div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {result ? (
        <>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Machine found</CardTitle>
                  <CardDescription>{result.message}</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setResult(null);
                      setRequestedPartNumber("");
                      setRequestedPartDescription("");
                      setShowAllParts(false);
                      setPartSearchSubmitted(false);
                      setCurrentStep("identify-machine");
                    }}
                  >
                    Change Machine
                  </Button>
                  <ResultBadge tone={effectiveBadgeTone}>{effectiveStatusLabel}</ResultBadge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {topSummary ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Model
                    </div>
                    <div className="mt-1 font-bold text-slate-900">{topSummary.model}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Brand
                    </div>
                    <div className="mt-1 font-bold text-slate-900">
                      {routeIdentity.brand || "Unknown brand"}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Appliance
                    </div>
                    <div className="mt-1 font-bold text-slate-900">
                      {routeIdentity.applianceType || "Unknown appliance type"}
                    </div>
                  </div>
                </div>
              ) : null}


              {machineReady && matchedSymptom && symptomCauses.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="font-semibold text-amber-900">
                    Common causes: {matchedSymptom.label.toLowerCase()}
                  </div>
                  <div className="mt-3 space-y-3">
                    {symptomCauses.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-amber-900">{item.cause}</div>
                          <button
                            type="button"
                            onClick={() => {
                              setRequestedPartDescription(item.searchHint);
                              setPartSearchSubmitted(false);
                              setTargetedParts([]);
                              setTargetedPartMessage(null);
                            }}
                            className="mt-0.5 text-xs text-amber-700 underline hover:text-amber-900"
                          >
                            Search for this part &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {machineReady ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <div className="font-semibold text-blue-900">Identify the part</div>
                  <div className="mt-1 text-sm text-blue-800">
                    Most customers are not shopping a full parts list. Start with the part number if you have it, or describe the part in plain language.
                  </div>

                  <form onSubmit={handlePartSearchSubmit} className="mt-4 grid gap-4 md:grid-cols-12">
                    <div className="md:col-span-5">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Part number
                      </label>
                      <Input
                        value={requestedPartNumber}
                        onChange={(e) => {
                          setRequestedPartNumber(e.target.value.toUpperCase());
                          setPartSearchSubmitted(false);
                          setTargetedParts([]);
                          setTargetedPartMessage(null);
                          setCurrentStep("identify-part");
                        }}
                        onBlur={() => void persistRequestedPartNumber()}
                        placeholder="WPW10712395"
                        autoCapitalize="characters"
                      />
                    </div>

                    <div className="md:col-span-3 flex items-end">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isResolvingPart || (!requestedPartNumber.trim() && !requestedPartDescription.trim())}
                      >
                        {isResolvingPart ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Checking Catalogs
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4" />
                            Search Parts
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="md:col-span-4 flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setShowAllParts((prev) => {
                            const next = !prev;
                            setPartSearchSubmitted(next);
                            setTargetedParts([]);
                            setTargetedPartMessage(null);
                            setCurrentStep(next ? "results" : "identify-part");
                            return next;
                          });
                        }}
                      >
                        {showAllParts ? "Hide Full List" : "Browse All Parts"}
                      </Button>
                    </div>

                    <div className="md:col-span-12">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        No part number? Describe the part
                      </label>
                      <Textarea
                        value={requestedPartDescription}
                        onChange={(e) => {
                          setRequestedPartDescription(e.target.value);
                          setPartSearchSubmitted(false);
                          setTargetedParts([]);
                          setTargetedPartMessage(null);
                          setCurrentStep("identify-part");
                        }}
                        placeholder="Example: the plastic door latch, the drain pump, the knob, the control board..."
                        className="min-h-[84px] resize-y bg-white"
                        maxLength={500}
                      />
                    </div>
                  </form>

                  <div className="mt-4 rounded-xl border border-dashed border-blue-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">
                      Or read the part sticker
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Upload a clear photo of the sticker on the part. The number is only accepted automatically when it verifies against this machine’s returned parts.
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-12">
                      <div className="md:col-span-8">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) => handlePartImageChange(event, "upload")}
                          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                        />
                        <input
                          ref={partStickerCameraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          aria-label="Take part sticker photo"
                          onChange={(event) => handlePartImageChange(event, "camera")}
                          className="sr-only"
                        />
                        <div className="mt-2 text-xs text-slate-500">
                          Best results: tight crop, sharp sticker, readable digits, no glare.
                        </div>
                        {partImageFile ? (
                          <div className="mt-2 text-xs font-medium text-slate-700">
                            {partImageSource === "camera" ? "Camera photo ready" : "Uploaded image ready"}:{" "}
                            {partImageFile.name}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col justify-end gap-2 md:col-span-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => partStickerCameraInputRef.current?.click()}
                          disabled={isReadingPartImage}
                        >
                          <Camera className="h-4 w-4" />
                          Take Photo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={handlePartImageExtract}
                          disabled={!partImageFile || isReadingPartImage}
                        >
                          {isReadingPartImage ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Reading Part Sticker
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Read Part Sticker
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {requestedPartNumber.trim() ? (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-sm font-semibold text-slate-900">
                            Extracted part number: {requestedPartNumber.trim().toUpperCase()}
                          </div>
                          <VerificationBadge status={verifiedPartMatch.status} />
                        </div>

                        <div className="mt-2 text-sm text-slate-700">
                          {verifiedPartMatch.reason}
                        </div>

                        {verifiedPartMatch.matchedPartNumber ? (
                          <div className="mt-2 text-sm text-slate-700">
                            Matched part:{" "}
                            <span className="font-semibold">
                              {verifiedPartMatch.matchedPartNumber}
                            </span>
                            {verifiedPartMatch.matchedPartName
                              ? ` • ${verifiedPartMatch.matchedPartName}`
                              : ""}
                          </div>
                        ) : null}

                      </div>
                    ) : null}
                  </div>

                  <div className="mt-2 text-xs text-blue-800">
                    Enter a part number or upload a part sticker image. We only auto-verify when the extracted number matches this machine’s returned parts.
                  </div>
                </div>
              ) : null}

              {result.status === "variant_resolution_needed" ? (
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                  <div className="font-semibold text-violet-900">
                    {filteredCandidates.length > 0 ? "Choose your exact revision" : "Needs shop review"}
                  </div>
                  <div className="mt-1 text-sm text-violet-800">
                    {filteredCandidates.length > 0
                      ? result.reason || "Choose the exact revision for the right diagram set."
                      : "We need a bit more detail to show the right parts for your specific unit. Try uploading a rating plate photo, or send this to Road Runner for shop assistance."}
                  </div>
                  {filteredCandidates.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {filteredCandidates.map((candidate) => (
                        <Button
                          key={candidate.revision}
                          type="button"
                          variant={selectedRevision === candidate.revision ? "default" : "outline"}
                          onClick={() => handleContinueSearch(candidate.revision)}
                          disabled={isSearching}
                        >
                          {candidate.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      Add a rating plate photo or send this lookup to Road Runner so the shop can verify the exact revision.
                    </div>
                  )}
                </div>
              ) : null}

              {partSearchSubmitted && (requestedPartNumber.trim() || requestedPartDescription.trim()) ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {isResolvingPart ? (
                    <div className="flex items-center gap-2 font-medium text-slate-800">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking parts availability and pricing...
                    </div>
                  ) : displayedParts.length > 0 ? (
                    targetedPartMessage || `${displayedParts.length} match${displayedParts.length === 1 ? "" : "es"} found.`
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span>
                        {targetedPartMessage ||
                          "No verified catalog price was returned yet. Call now and Road Runner can confirm pricing and availability."}
                      </span>
                      <Button asChild type="button" className="w-full sm:w-auto">
                        <a href={SHOP_PHONE_HREF} onClick={() => track("tool_part_finder_call_now_unresolved")}>
                          <Phone className="h-4 w-4" />
                          Call Now
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}

              {!partSearchSubmitted && !requestedPartNumber.trim() && !requestedPartDescription.trim() && !showAllParts ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                  Machine identified. Enter a part number, describe what you need, or click{" "}
                  <span className="font-semibold">Browse All Parts</span> to see the full list.
                </div>
              ) : null}

              {partSearchSubmitted && displayedParts.length ? (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Part Name</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Part #</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Price</th>
                          <th className="px-4 py-3 text-right font-semibold text-slate-700">Order</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {displayedParts.map((part, index) => (
                          <tr key={`${part.canonicalPartNumber}-${index}`}>
                            <td className="px-4 py-3 text-slate-800">
                              {part.canonicalPartName || "Unnamed part"}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-900">
                              {part.canonicalPartNumber}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatPrice(part.retailPrice) || "Call to confirm"}
                              {part.retailAvailability ? (
                                <div className="text-xs text-slate-500">{part.retailAvailability}</div>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button asChild size="sm">
                                <a
                                  href={SHOP_PHONE_HREF}
                                  onClick={() =>
                                    track("tool_part_finder_call_now_part", {
                                      partNumber: part.canonicalPartNumber,
                                      priceVerified: Boolean(part.retailPriceVerified),
                                    })
                                  }
                                >
                                  <Phone className="h-4 w-4" />
                                  Call Now
                                </a>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}


              {partSearchSubmitted && result.hasMore ? (
                <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold text-amber-900">Not finding the right part?</div>
                    <div className="text-sm text-amber-800">
                      We can check additional part catalogs for your model — this takes a moment longer.
                    </div>
                  </div>
                  <Button type="button" variant="outline" onClick={() => handleContinueSearch()}>
                    {isSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Continuing
                      </>
                    ) : (
                      <>
                        <Wrench className="h-4 w-4" />
                        Continue Searching
                      </>
                    )}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50 shadow-sm">
            <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-semibold text-blue-950">Didn&apos;t find the part?</div>
                <div className="mt-1 text-sm text-blue-800">
                  Send the machine and part request to Road Runner. The lookup details are attached automatically.
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild type="button" variant="outline" className="w-full bg-white sm:w-auto">
                  <a href={SHOP_PHONE_HREF} onClick={() => track("tool_part_finder_call_click")}>
                    <Phone className="h-4 w-4" />
                    Call Now
                  </a>
                </Button>
                <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" className="w-full sm:w-auto">
                      <Send className="h-4 w-4" />
                      Request Shop Assistance
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Request shop assistance</DialogTitle>
                      <DialogDescription>
                        Road Runner will receive the model, serial, selected revision, part request, and current lookup status.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleLeadSubmit} className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Name
                        </label>
                        <Input
                          value={leadName}
                          onChange={(e) => setLeadName(e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={leadEmail}
                          onChange={(e) => setLeadEmail(e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Phone
                        </label>
                        <Input
                          value={leadPhone}
                          onChange={(e) => setLeadPhone(e.target.value)}
                          placeholder="Optional"
                        />
                      </div>

                      <Button type="submit" disabled={isSendingLead} className="w-full">
                        {isSendingLead ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send to Road Runner
                          </>
                        )}
                      </Button>
                    </form>

                    {leadSuccess ? (
                      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        <CheckCircle2 className="mt-0.5 h-4 w-4" />
                        <span>{leadSuccess}</span>
                      </div>
                    ) : null}
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
