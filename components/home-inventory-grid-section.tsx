/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { InventoryItem } from "@/lib/inventory";
import { formatUsd } from "@/lib/money";
import { productPath } from "@/lib/routes";

const CATEGORY_LABELS: Record<InventoryItem["category"], string> = {
  refrigerators: "Refrigerators",
  washers: "Washers",
  dryers: "Dryers",
  "stoves-ovens": "Stoves & Ranges",
  dishwashers: "Dishwashers",
  packages: "Washer & Dryer Sets",
};

const CATEGORY_HREFS: Record<InventoryItem["category"], string> = {
  refrigerators: "/refrigerators",
  washers: "/washers",
  dryers: "/dryers",
  "stoves-ovens": "/stoves-ranges",
  dishwashers: "/dishwashers",
  packages: "/washer-dryer-sets",
};

const IMAGE_FALLBACKS: Record<InventoryItem["category"], string> = {
  refrigerators: "/images/products/refrigerator-french-door.jpg",
  washers: "/images/products/washer-top-load.jpg",
  dryers: "/images/products/dryer-electric.jpg",
  "stoves-ovens": "/images/products/stove-electric.jpg",
  dishwashers: "/placeholder.jpg",
  packages: "/images/products/washer-dryer-set.jpg",
};

function getSafePublicImage(input: unknown, fallback: string) {
  if (typeof input !== "string") return fallback;
  const value = input.trim();
  if (!value) return fallback;

  const lower = value.toLowerCase();
  if (lower === "null" || lower === "undefined" || lower === "[object object]") return fallback;

  if (value.startsWith("/") || value.startsWith("https://") || value.startsWith("http://")) {
    return value;
  }

  return fallback;
}

function getProductTitle(item: InventoryItem) {
  return item.seo_title || `${item.brand || "Appliance"} ${item.model || ""}`.trim();
}

type HomeInventoryGridSectionProps = {
  inventory: InventoryItem[];
};

export function HomeInventoryGridSection({ inventory }: HomeInventoryGridSectionProps) {
  const featuredInventory = inventory.slice(0, 6);
  const visibleCategories = Array.from(new Set(inventory.map((item) => item.category))).slice(0, 6);

  if (featuredInventory.length === 0) return null;

  return (
    <section id="inventory" className="bg-[#f6f8fb] py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700">Current inventory</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Appliances available now
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Browse real in-stock units with prices, model numbers and condition before you call or visit.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 lg:self-auto"
          >
            View All {inventory.length} Appliances
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {visibleCategories.length > 1 ? (
          <nav aria-label="Shop appliance categories" className="mb-7 flex gap-2 overflow-x-auto pb-1">
            {visibleCategories.map((category) => (
              <Link
                key={category}
                href={CATEGORY_HREFS[category]}
                className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                {CATEGORY_LABELS[category]}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredInventory.map((item) => {
            const title = getProductTitle(item);
            const image = getSafePublicImage(item.images?.[0], IMAGE_FALLBACKS[item.category]);

            return (
              <Link
                key={item.id}
                href={productPath(item.slug)}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                aria-label={`View ${title}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={image}
                    alt={title}
                    className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <div className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-sm font-black text-slate-950 shadow">
                    {formatUsd(item.price)}
                  </div>
                  <div className="absolute right-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow">
                    Available
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-3 text-xs font-extrabold uppercase tracking-wide">
                    <span className="text-blue-700">{CATEGORY_LABELS[item.category]}</span>
                    <span className="text-slate-500">{item.condition}</span>
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-xl font-black leading-tight text-slate-950 transition group-hover:text-blue-700">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">Model {item.model}</p>
                  <div className="mt-5 flex min-h-11 items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      30-day warranty
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-extrabold text-blue-700">
                      View details
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/shop"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-blue-600 bg-white px-6 py-3 text-sm font-extrabold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Browse Full Inventory
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
