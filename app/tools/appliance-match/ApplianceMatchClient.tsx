"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  Check,
  Flame,
  HelpCircle,
  Phone,
  Refrigerator,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  WashingMachine,
  Wind,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/money";

export type ApplianceMatchItem = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  model: string;
  category: string;
  categoryLabel: string;
  price: number;
  condition: string;
  status: string;
  image: string;
  href: string;
  description: string;
};

type Step = "welcome" | "type" | "budget" | "priority" | "results";
type ApplianceType = "washers" | "dryers" | "refrigerators" | "stoves-ovens" | "packages" | "unsure";
type Budget = "under300" | "300to500" | "500to800" | "800plus" | "open";
type Priority = "reliable" | "condition" | "efficiency" | "brand" | "value";

const PHONE_NUMBER = "843-536-6005";

const TYPE_OPTIONS: Array<{ value: ApplianceType; label: string; icon: typeof WashingMachine; href: string }> = [
  { value: "washers", label: "Washer", icon: WashingMachine, href: "/washers" },
  { value: "dryers", label: "Dryer", icon: Wind, href: "/dryers" },
  { value: "refrigerators", label: "Refrigerator", icon: Refrigerator, href: "/refrigerators" },
  { value: "stoves-ovens", label: "Stove / Range", icon: Flame, href: "/stoves-ranges" },
  { value: "packages", label: "Washer + Dryer Set", icon: WashingMachine, href: "/washer-dryer-sets" },
  { value: "unsure", label: "Help me choose", icon: HelpCircle, href: "/shop" },
];

const BUDGET_OPTIONS: Array<{ value: Budget; label: string; sub: string }> = [
  { value: "under300", label: "Under $300", sub: "Budget-friendly" },
  { value: "300to500", label: "$300 - $500", sub: "Most popular" },
  { value: "500to800", label: "$500 - $800", sub: "Great selection" },
  { value: "800plus", label: "$800+", sub: "Premium picks" },
  { value: "open", label: "Open budget", sub: "Show me the best deal" },
];

const PRIORITY_OPTIONS: Array<{ value: Priority; label: string; sub: string }> = [
  { value: "reliable", label: "Just needs to work", sub: "Reliability over looks" },
  { value: "condition", label: "Great condition", sub: "Cosmetics matter" },
  { value: "efficiency", label: "Energy efficient", sub: "Lower utility bills" },
  { value: "brand", label: "Specific brand", sub: "I know what I want" },
  { value: "value", label: "Best value", sub: "Most for my money" },
];

const CONDITION_SCORE: Record<string, number> = {
  "Like New": 5,
  Excellent: 4,
  Good: 3,
  "Scratch & Dent": 2,
};

function budgetMatches(price: number, budget: Budget) {
  if (budget === "open") return true;
  if (budget === "under300") return price < 300;
  if (budget === "300to500") return price >= 300 && price <= 500;
  if (budget === "500to800") return price > 500 && price <= 800;
  return price > 800;
}

function priceRange(items: ApplianceMatchItem[]) {
  if (!items.length) return "Call for current pricing";
  const prices = items.map((item) => item.price).filter((price) => Number.isFinite(price) && price > 0);
  if (!prices.length) return "Call for current pricing";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatUsd(min) : `${formatUsd(min)} - ${formatUsd(max)}`;
}

function sortForPriority(items: ApplianceMatchItem[], priority: Priority) {
  return [...items].sort((a, b) => {
    if (priority === "condition") {
      return (CONDITION_SCORE[b.condition] ?? 1) - (CONDITION_SCORE[a.condition] ?? 1) || a.price - b.price;
    }
    if (priority === "value") return a.price - b.price;
    if (priority === "brand") return a.brand.localeCompare(b.brand) || a.price - b.price;
    if (priority === "efficiency") return Number(b.category === "refrigerators") - Number(a.category === "refrigerators") || a.price - b.price;
    return Number(a.status === "available") - Number(b.status === "available") || a.price - b.price;
  });
}

function categoryLabel(type: ApplianceType) {
  return TYPE_OPTIONS.find((option) => option.value === type)?.label || "Appliance";
}

function StepHeader({ step }: { step: number }) {
  const labels = ["Appliance", "Budget", "Priority", "Match"];
  return (
    <div className="border-b border-slate-200 bg-white px-4 py-4">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
        {labels.map((label, index) => {
          const active = index <= step;
          return (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-full border text-xs font-black", active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-400")}>
                {index < step ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span className={cn("text-[10px] font-extrabold uppercase tracking-wide", active ? "text-blue-700" : "text-slate-400")}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-800">
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );
}

export function ApplianceMatchClient({ inventory }: { inventory: ApplianceMatchItem[] }) {
  const [step, setStep] = useState<Step>("welcome");
  const [type, setType] = useState<ApplianceType | "">("");
  const [budget, setBudget] = useState<Budget | "">("");
  const [priority, setPriority] = useState<Priority | "">("");

  const result = useMemo(() => {
    const typePool = type && type !== "unsure" ? inventory.filter((item) => item.category === type) : inventory;
    const budgetPool = budget ? typePool.filter((item) => budgetMatches(item.price, budget)) : typePool;
    const source = budgetPool.length > 0 ? budgetPool : typePool.length > 0 ? typePool : inventory;
    const sorted = priority ? sortForPriority(source, priority) : source;
    return {
      matches: sorted.slice(0, 3),
      range: priceRange(source),
      typeCount: typePool.length,
      usedBudgetFallback: budgetPool.length === 0 && typePool.length > 0,
      browseHref: TYPE_OPTIONS.find((option) => option.value === type)?.href || "/shop",
    };
  }, [budget, inventory, priority, type]);

  const selectedTypeLabel = type ? categoryLabel(type) : "Appliance";

  return (
    <div className="fix-tool-page min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="relative h-10 w-14 overflow-hidden rounded-lg bg-white">
              <Image src="/images/roadrunner-running.png" alt="Road Runner Appliance" fill sizes="56px" className="object-contain" priority />
            </span>
            <span className="text-sm font-black text-slate-950">Road Runner Appliance</span>
          </Link>
          <a href={`tel:${PHONE_NUMBER}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700">
            <Phone className="h-4 w-4" />
            Call
          </a>
        </div>
      </header>

      {step !== "welcome" && step !== "results" ? <StepHeader step={["type", "budget", "priority"].indexOf(step)} /> : null}

      <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        {step === "welcome" ? (
          <section className="fix-step-enter text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">
              <Sparkles className="h-4 w-4" />
              Appliance Match
            </div>
            <h1 className="mx-auto max-w-2xl text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl">
              Find your best used appliance match.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
              Answer three quick questions. The recommendation uses Road Runner&apos;s current machine prices, not a generic estimate.
            </p>
            <button type="button" onClick={() => setStep("type")} className="mt-9 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Current prices", `${inventory.length} priced units loaded`],
                ["30-day warranty", "On every sold unit"],
                ["Tested inventory", "Ready for pickup or delivery"],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm">
                  <p className="font-black text-slate-950">{title}</p>
                  <p className="mt-1 text-sm text-slate-500">{copy}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {step === "type" ? (
          <section className="fix-step-enter">
            <BackButton onClick={() => setStep("welcome")} />
            <h2 className="text-3xl font-black tracking-tight text-slate-950">What are you shopping for?</h2>
            <p className="mt-2 text-slate-600">Select the appliance category you want to match against live inventory.</p>
            <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3">
              {TYPE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = type === option.value;
                return (
                  <button key={option.value} type="button" onClick={() => setType(option.value)} className={cn("fix-card-hover flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl border-2 bg-white p-5 text-center transition", active ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700")}>
                    <Icon className="h-9 w-9" />
                    <span className="text-sm font-black">{option.label}</span>
                  </button>
                );
              })}
            </div>
            <button type="button" disabled={!type} onClick={() => setStep("budget")} className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        ) : null}

        {step === "budget" ? (
          <section className="fix-step-enter">
            <BackButton onClick={() => setStep("type")} />
            <h2 className="text-3xl font-black tracking-tight text-slate-950">What&apos;s your budget?</h2>
            <p className="mt-2 text-slate-600">This filters against current machine prices for {selectedTypeLabel.toLowerCase()} units.</p>
            <div className="mt-7 space-y-3">
              {BUDGET_OPTIONS.map((option) => {
                const active = budget === option.value;
                return (
                  <button key={option.value} type="button" onClick={() => setBudget(option.value)} className={cn("fix-card-hover flex w-full items-center justify-between rounded-2xl border-2 bg-white p-5 text-left transition", active ? "border-blue-600 bg-blue-50" : "border-slate-200")}>
                    <span>
                      <span className="block font-black text-slate-950">{option.label}</span>
                      <span className="text-sm text-slate-500">{option.sub}</span>
                    </span>
                    {active ? <Check className="h-5 w-5 text-blue-600" /> : null}
                  </button>
                );
              })}
            </div>
            <button type="button" disabled={!budget} onClick={() => setStep("priority")} className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        ) : null}

        {step === "priority" ? (
          <section className="fix-step-enter">
            <BackButton onClick={() => setStep("budget")} />
            <h2 className="text-3xl font-black tracking-tight text-slate-950">What matters most?</h2>
            <p className="mt-2 text-slate-600">We&apos;ll sort the live matches around this preference.</p>
            <div className="mt-7 space-y-3">
              {PRIORITY_OPTIONS.map((option) => {
                const active = priority === option.value;
                return (
                  <button key={option.value} type="button" onClick={() => setPriority(option.value)} className={cn("fix-card-hover flex w-full items-center justify-between rounded-2xl border-2 bg-white p-5 text-left transition", active ? "border-blue-600 bg-blue-50" : "border-slate-200")}>
                    <span>
                      <span className="block font-black text-slate-950">{option.label}</span>
                      <span className="text-sm text-slate-500">{option.sub}</span>
                    </span>
                    {active ? <Check className="h-5 w-5 text-blue-600" /> : null}
                  </button>
                );
              })}
            </div>
            <button type="button" disabled={!priority} onClick={() => setStep("results")} className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              Find My Match
              <SearchCheck className="h-4 w-4" />
            </button>
          </section>
        ) : null}

        {step === "results" ? (
          <section className="fix-step-enter">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                Match ready
              </span>
              <span className="text-sm font-semibold text-slate-500">{selectedTypeLabel} · {result.range}</span>
            </div>

            <div className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
              <div className="p-6 md:p-8">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-yellow-300">Current machine prices</p>
                <h2 className="text-3xl font-black tracking-tight">Your best match starts at {result.range}</h2>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {result.usedBudgetFallback
                    ? "No unit in this category is currently inside that exact budget band, so these are the closest current listings from the same category."
                    : "These matches are filtered from current Road Runner inventory and sorted by your selected priority."}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href={`tel:${PHONE_NUMBER}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700">
                    <Phone className="h-4 w-4" />
                    Call {PHONE_NUMBER}
                  </a>
                  <Link href={result.browseHref} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/15">
                    Browse listings
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {result.matches.length > 0 ? result.matches.map((item) => (
                <Link key={item.id} href={item.href} className="fix-card-hover grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[112px_1fr_auto] sm:items-center">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                    <Image src={item.image} alt={item.title} fill sizes="112px" className="object-contain p-2" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-blue-700">{item.categoryLabel} · {item.condition}</p>
                    <h3 className="mt-1 text-lg font-black leading-tight text-slate-950">{item.title}</h3>
                    <p className="mt-1 font-mono text-xs font-semibold text-slate-500">Model {item.model}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-blue-700 sm:flex-col sm:items-end">
                    <BadgeDollarSign className="h-5 w-5" />
                    <span className="text-lg font-black">{formatUsd(item.price)}</span>
                  </div>
                </Link>
              )) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                  <p className="font-black text-slate-950">No priced listings are loaded right now.</p>
                  <p className="mt-2 text-sm text-slate-500">Call Road Runner and we can check the floor inventory directly.</p>
                </div>
              )}
            </div>

            <button type="button" onClick={() => { setStep("welcome"); setType(""); setBudget(""); setPriority(""); }} className="mx-auto mt-7 flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-800">
              <ArrowLeft className="h-4 w-4" />
              Start over
            </button>
          </section>
        ) : null}
      </main>
    </div>
  );
}
