/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowRight, Phone, ShieldCheck, Star, Truck, Wrench } from "lucide-react";
import type { InventoryItem } from "@/lib/inventory";
import { formatUsd } from "@/lib/money";
import { productPath } from "@/lib/routes";

const HERO_IMAGE_FALLBACKS: Record<InventoryItem["category"], string> = {
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

type HeroSectionProps = {
  inventory: InventoryItem[];
};

export function HeroSection({ inventory }: HeroSectionProps) {
  const featuredProduct = inventory[0];
  const featuredFallback = featuredProduct
    ? HERO_IMAGE_FALLBACKS[featuredProduct.category]
    : "/images/products/washer-dryer-set.jpg";
  const featuredImage = featuredProduct
    ? getSafePublicImage(featuredProduct.images?.[0], featuredFallback)
    : featuredFallback;
  const featuredTitle = featuredProduct ? getProductTitle(featuredProduct) : "Quality used appliances";

  return (
    <section className="relative overflow-hidden bg-[#0b3554] py-8 text-white sm:py-10 lg:py-14">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,196,0,0.16),transparent_34rem)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] lg:gap-12 lg:px-8">
        <div>
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[#ffc400] sm:text-sm">
            {inventory.length > 0 ? `${inventory.length} appliances available now` : "Used appliance sales & repair"}
          </p>

          <h1 className="max-w-3xl text-4xl font-black leading-[0.98] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Used Appliances & Reliable Repair in Hemingway
          </h1>

          <p className="mt-5 max-w-2xl text-lg font-medium leading-7 text-white/85 sm:text-xl sm:leading-8">
            Shop tested washers, dryers, refrigerators, ranges and appliance sets backed by a 30-day warranty—or call us for appliance repair.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ffc400] px-6 py-3 text-base font-extrabold text-slate-950 shadow-lg shadow-black/15 transition hover:bg-[#ffd43b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b3554]"
            >
              Shop Available Appliances
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="tel:843-536-6005"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-white/55 bg-white/10 px-6 py-3 text-base font-extrabold text-white backdrop-blur-sm transition hover:border-white hover:bg-white hover:text-[#0b3554] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b3554]"
            >
              <Phone className="h-5 w-5" />
              Call for Repair
            </a>
          </div>

          <div className="mt-7 grid max-w-2xl grid-cols-2 gap-3 text-sm font-bold text-white/90 sm:grid-cols-4">
            <a
              href="https://www.google.com/search?q=Road+Runner+Appliance+Inc+Reviews"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-3 py-2 transition hover:bg-white/20"
            >
              <Star className="h-4 w-4 fill-[#ffc400] text-[#ffc400]" />
              4.8 Google
            </a>
            <div className="flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-[#ffc400]" />
              30-Day Warranty
            </div>
            <div className="flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
              <Wrench className="h-4 w-4 text-[#ffc400]" />
              Tested Before Sale
            </div>
            <div className="flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
              <Truck className="h-4 w-4 text-[#ffc400]" />
              Delivery Available
            </div>
          </div>
        </div>

        <Link
          href={featuredProduct ? productPath(featuredProduct.slug) : "/shop"}
          className="group relative block min-h-[330px] overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl shadow-black/25 sm:min-h-[390px]"
          aria-label={featuredProduct ? `View ${featuredTitle}` : "Shop available appliances"}
        >
          <img
            src={featuredImage}
            alt={featuredTitle}
            className="absolute inset-0 h-full w-full object-contain p-5 transition duration-300 group-hover:scale-[1.025] sm:p-8"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent px-5 pb-5 pt-20 text-white sm:px-6 sm:pb-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#ffc400]">Available now</p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <div>
                <h2 className="line-clamp-2 text-xl font-black leading-tight sm:text-2xl">{featuredTitle}</h2>
                {featuredProduct ? (
                  <p className="mt-1 text-sm font-semibold text-white/75">Model {featuredProduct.model}</p>
                ) : null}
              </div>
              <span className="shrink-0 text-xl font-black text-[#ffc400] sm:text-2xl">
                {featuredProduct ? formatUsd(featuredProduct.price) : "Shop now"}
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
