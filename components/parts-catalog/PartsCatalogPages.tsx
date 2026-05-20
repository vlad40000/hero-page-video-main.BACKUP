import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Heart,
  PackageSearch,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";

import {
  type CatalogPart,
  getCatalogCategories,
  getCatalogPart,
  getCatalogParts,
} from "@/lib/tools/parts/catalog-store";
import { PartImageGallery } from "@/components/parts-catalog/PartImageGallery";

type SearchParams = Record<string, string | string[] | undefined>;

type PartsCatalogGridPageProps = {
  searchParams?: SearchParams;
  basePath: string;
  detailBasePath: string;
};

type PartsCatalogDetailPageProps = {
  partNumber: string;
};

function paramValue(searchParams: SearchParams | undefined, key: string): string {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function moneyFromCents(cents: number | null, fallback = "Request quote"): string {
  if (!Number.isFinite(Number(cents)) || !cents) return fallback;
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function listingMoneyFromCents(cents: number | null): string {
  if (!Number.isFinite(Number(cents)) || !cents) return "US $--";
  return `US $${(Number(cents) / 100).toFixed(2)}`;
}

function titleCase(value: string | null | undefined): string {
  const text = String(value || "").trim();
  if (!text) return "";
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function compactPartTitle(part: CatalogPart): string {
  return part.canonicalPartName || part.normalizedCategory || "Appliance part";
}

function listingTitle(part: CatalogPart): string {
  const brand = part.brand || inferBrand(part);
  const name = compactPartTitle(part);
  const safePartNumberPattern = part.canonicalPartNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nameWithoutPartNumber = name.replace(new RegExp(safePartNumberPattern, "i"), "").trim();
  const category = part.normalizedCategory || part.normalizedSection || "Appliance";
  return [brand, part.canonicalPartNumber, nameWithoutPartNumber, `- ${category} Part`]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferBrand(part: CatalogPart): string | null {
  const pn = part.canonicalPartNumber.toUpperCase();
  if (/^(WE|WD|WH|WR|WB|WG|WX|WW)\d/i.test(pn)) return "GE";
  if (/^WP|^W\d|^1200|^340/i.test(pn)) return "Whirlpool";
  return null;
}

function cardVisual(part: CatalogPart) {
  return {
    cardClass: "border-slate-200 bg-white shadow-slate-100 hover:border-blue-500 hover:shadow-blue-100",
    imageClass: part.imageUrl ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-100",
    priceClass: "text-slate-900",
  };
}

function publicPartLabel(part: CatalogPart): string {
  return titleCase(part.normalizedCategory || part.normalizedSection || "Appliance part");
}

function PlaceholderImage({ partNumber }: { partNumber: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center text-slate-400">
      <PackageSearch className="h-12 w-12" />
      <span className="font-mono text-sm font-black tracking-widest">{partNumber}</span>
    </div>
  );
}

export async function PartsCatalogGridPage({ searchParams, basePath, detailBasePath }: PartsCatalogGridPageProps) {
  const q = paramValue(searchParams, "q");
  const category = paramValue(searchParams, "category");
  const [parts, categories] = await Promise.all([
    getCatalogParts({ q, status: "all", category, limit: "all" }),
    getCatalogCategories(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="relative overflow-hidden border-b border-slate-200 bg-white px-5 py-8 text-center text-slate-900">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-600 via-slate-900 to-emerald-600" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/tools/part-finder"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-extrabold uppercase tracking-wide text-slate-700 hover:border-blue-500 hover:text-blue-700"
            >
              <Search className="h-4 w-4" />
              Parts Finder
            </Link>
            <Link
              href="/tools/fix"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-4 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-slate-900"
            >
              <ShieldCheck className="h-4 w-4" />
              Troubleshoot
            </Link>
          </div>
          <h1 className="mb-2 text-4xl font-black leading-tight tracking-normal sm:text-5xl">
            <span className="text-blue-600">Road</span>
            <span className="text-slate-950">Runner</span>
            <span className="text-slate-950">-</span>
            <span className="text-emerald-600">Parts</span>
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-5 py-10">
        <form action={basePath} className="mb-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search part number or title"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <select
            name="category"
            defaultValue={category}
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-blue-600">
            Filter
          </button>
        </form>

        {parts.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {parts.map((part, index) => {
              const visual = cardVisual(part);
              const href = `${detailBasePath}/${encodeURIComponent(part.canonicalPartNumber)}`;
              return (
                <Link
                  key={part.canonicalPartNumber}
                  href={href}
                  className={`group flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${visual.cardClass}`}
                >
                  <div className={`relative flex aspect-square items-center justify-center border-b p-8 ${visual.imageClass}`}>
                    {part.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={part.imageUrl}
                        alt={listingTitle(part)}
                        className="max-h-full max-w-full object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <PlaceholderImage partNumber={part.canonicalPartNumber} />
                    )}
                    <span className="absolute right-3 top-3 rounded-md bg-[#162033] px-2 py-0.5 text-[10px] font-bold text-white">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-1 text-2xl font-black text-[#162033]">
                      {part.canonicalPartNumber}
                    </div>
                    <div className="mb-4 min-h-10 text-sm leading-relaxed text-slate-500">
                      {compactPartTitle(part)}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3">
                      <span className="max-w-[65%] truncate rounded-lg border border-slate-200 bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-600">
                        {publicPartLabel(part)}
                      </span>
                      <span className={`text-sm font-bold ${visual.priceClass}`}>
                        {moneyFromCents(part.latestPriceCents)}
                      </span>
                    </div>
                    <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-[10px] font-extrabold uppercase tracking-wide text-slate-700 transition-colors group-hover:border-blue-500 group-hover:text-blue-700">
                      Open listing
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <PackageSearch className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-xl font-black text-slate-900">No catalog entries yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Run a part lookup or troubleshooting search. Found parts will be added to this catalog in the background.
            </p>
            <Link
              href="/tools/part-finder"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-xs font-extrabold uppercase tracking-wide text-white hover:bg-slate-900"
            >
              Start Parts Finder
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function detailDescription(part: CatalogPart): string {
  if (part.description) return part.description;

  const name = compactPartTitle(part);
  const modelText = part.observedModels.length
    ? ` It has been observed on model catalog searches including ${part.observedModels.slice(0, 5).join(", ")}.`
    : "";
  return `${part.canonicalPartNumber} is cataloged as ${name}.${modelText} Confirm model fitment before purchase or installation.`;
}

function specifics(part: CatalogPart) {
  return [
    ["Brand", part.brand || inferBrand(part) || "-"],
    ["MPN", part.canonicalPartNumber],
    ["Type", titleCase(part.canonicalPartName) || "-"],
    ["Color", "-"],
    ["Material", "-"],
    ["Compatibility", part.observedModels.slice(0, 8).join(", ") || part.normalizedCategory || "-"],
    ["Bundle Listing", "No"],
    ["Custom", "-"],
  ];
}

export async function PartsCatalogDetailPage({ partNumber }: PartsCatalogDetailPageProps) {
  const part = await getCatalogPart(partNumber);
  if (!part) notFound();

  const title = listingTitle(part);
  const specRows = specifics(part);

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-[1280px] px-5 py-8">
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <PartImageGallery images={part.images} title={title} partNumber={part.canonicalPartNumber} />

          <aside className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-bold leading-tight text-[#191919]">{title}</h1>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                R
              </div>
              <span className="font-medium text-[#3665F3]">Road Runner Parts</span>
            </div>

            <div className="border-y border-slate-200 py-5">
              <div className="mb-2 text-xs text-slate-500">Price:</div>
              <div className="text-3xl font-bold text-[#191919]">{listingMoneyFromCents(part.latestPriceCents)}</div>
            </div>

            <div className="flex items-center gap-8 text-sm">
              <div>
                <span className="text-slate-500">Condition: </span>
                <span className="font-medium text-[#191919]">Pre-Owned</span>
              </div>
              <div>
                <span className="text-slate-500">Qty: </span>
                <span className="font-medium text-[#191919]">1</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href="tel:843-536-6005"
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#3665F3] text-base font-bold text-white transition hover:bg-[#2a52c9]"
              >
                Buy It Now
              </a>
              <a
                href="tel:843-536-6005"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-[#3665F3] bg-white text-base font-bold text-[#3665F3] transition hover:bg-blue-50"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to cart
              </a>
              <button
                type="button"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white text-sm font-semibold text-[#191919] transition hover:bg-slate-50"
              >
                <Heart className="h-4 w-4" />
                Add to Watchlist
              </button>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium text-emerald-700">
                <Truck className="h-4 w-4" />
                FREE Standard Shipping
              </div>
              <div className="mt-1 text-xs text-slate-500">Estimated delivery: 3-7 business days</div>
              <div className="mt-2 text-xs text-slate-500">30 day returns - buyer pays return shipping</div>
            </div>

            <div className="flex flex-col gap-2 text-xs text-slate-500">
              <div>
                Part #: <span className="font-mono font-medium text-slate-700">{part.canonicalPartNumber}</span>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-12 border-t border-slate-200 pt-10">
          <h2 className="text-xl font-bold text-[#191919]">Item description from the seller</h2>
          <div className="mt-6 max-w-none text-lg leading-8 text-slate-700">
            <p className="font-medium text-slate-700">Product Details</p>
            <p className="mt-2">{detailDescription(part)}</p>
          </div>
        </section>

        <section className="mt-12 border-t border-slate-200 pt-10">
          <h2 className="text-xl font-bold text-[#191919]">Item specifics</h2>
          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
            <div className="divide-y divide-slate-200">
              {specRows.map(([label, value], index) => (
                <div key={label} className={`grid grid-cols-[minmax(140px,32%)_1fr] ${index % 2 === 0 ? "bg-slate-50" : "bg-white"}`}>
                  <div className="border-r border-slate-200 px-4 py-4 text-sm font-semibold text-slate-500">
                    {label}
                  </div>
                  <div className="px-4 py-4 text-sm font-medium text-[#191919]">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 border-t border-slate-200 pt-8">
          <div className="flex gap-8 border-b border-slate-200 text-sm font-semibold text-slate-500">
            <div className="border-b-2 border-[#191919] pb-3 text-[#191919]">Shipping</div>
            <div className="pb-3">Returns</div>
            <div className="pb-3">Payments</div>
          </div>
          <div className="mt-5 text-sm leading-7 text-slate-700">
            <p className="font-medium text-[#191919]">FREE Standard Ground Shipping</p>
            <p className="mt-2 text-xs text-slate-500">Ships from: United States</p>
          </div>
        </section>
      </main>
    </div>
  );
}
