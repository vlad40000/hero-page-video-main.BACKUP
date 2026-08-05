import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import {
  getShopInventory,
  type InventoryItem,
  SHOP_INVENTORY_CATEGORIES,
} from "@/lib/inventory";
import { formatUsd } from "@/lib/money";
import { categoryLabel, categoryPath, productPath } from "@/lib/routes";

type ShopSearchParams = Record<string, string | string[] | undefined>;

type SortOption = "recommended" | "price-low" | "price-high" | "brand";

export const metadata: Metadata = {
  title: "Shop Used Appliances | Road Runner Appliance",
  description:
    "Browse current used appliance inventory including refrigerators, washers, dryers, ranges, and laundry sets in Hemingway, SC. Every sold unit includes a 30-day warranty.",
  alternates: {
    canonical: "/shop",
  },
};

export const dynamic = "force-dynamic";

const CONDITIONS: InventoryItem["condition"][] = [
  "Like New",
  "Excellent",
  "Good",
  "Scratch & Dent",
];

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function isShopCategory(value: string): value is InventoryItem["category"] {
  return SHOP_INVENTORY_CATEGORIES.includes(value as InventoryItem["category"]);
}

function isCondition(value: string): value is InventoryItem["condition"] {
  return CONDITIONS.includes(value as InventoryItem["condition"]);
}

function isSortOption(value: string): value is SortOption {
  return ["recommended", "price-low", "price-high", "brand"].includes(value);
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<ShopSearchParams>;
}) {
  const inventory = await getShopInventory();
  const params = searchParams ? await searchParams : {};

  const query = firstValue(params.q).trim();
  const categoryParam = firstValue(params.category);
  const brandParam = firstValue(params.brand);
  const conditionParam = firstValue(params.condition);
  const sortParam = firstValue(params.sort);

  const selectedCategory = isShopCategory(categoryParam) ? categoryParam : "";
  const selectedCondition = isCondition(conditionParam) ? conditionParam : "";
  const selectedSort: SortOption = isSortOption(sortParam) ? sortParam : "recommended";

  const brands = Array.from(new Set(inventory.map((item) => item.brand).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
  const selectedBrand = brands.includes(brandParam) ? brandParam : "";

  const normalizedQuery = query.toLowerCase();
  const filteredInventory = inventory
    .filter((item) => {
      if (selectedCategory && item.category !== selectedCategory) return false;
      if (selectedBrand && item.brand !== selectedBrand) return false;
      if (selectedCondition && item.condition !== selectedCondition) return false;

      if (!normalizedQuery) return true;

      return [item.seo_title, item.brand, item.model, item.short_description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery));
    })
    .sort((a, b) => {
      if (selectedSort === "price-low") return a.price - b.price;
      if (selectedSort === "price-high") return b.price - a.price;
      if (selectedSort === "brand") return a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model);
      return 0;
    });

  const hasFilters = Boolean(query || selectedCategory || selectedBrand || selectedCondition || selectedSort !== "recommended");

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-slate-900 px-6 py-12 text-white md:py-14">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-300">Current inventory</p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">Shop Used Appliances</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
                Browse real in-stock washers, dryers, refrigerators, ranges and laundry sets. Every sold unit includes a 30-day warranty.
              </p>
            </div>
            <a
              href="tel:843-536-6005"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-yellow-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Call to Confirm Availability
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <section aria-labelledby="inventory-heading">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-blue-700">Available now</p>
              <h2 id="inventory-heading" className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Current shop inventory
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Showing {filteredInventory.length} of {inventory.length} appliances
              </p>
            </div>
          </div>

          <form
            method="get"
            className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            aria-label="Filter appliance inventory"
          >
            <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-900">
              <SlidersHorizontal className="h-4 w-4 text-blue-700" />
              Find the right appliance
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <label className="lg:col-span-2">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Search</span>
                <span className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="Brand, model or appliance"
                    className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </span>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Category</span>
                <select
                  name="category"
                  defaultValue={selectedCategory}
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All categories</option>
                  {SHOP_INVENTORY_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {categoryLabel(category)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Brand</span>
                <select
                  name="brand"
                  defaultValue={selectedBrand}
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All brands</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Condition</span>
                <select
                  name="condition"
                  defaultValue={selectedCondition}
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Any condition</option>
                  {CONDITIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
              <label className="sm:w-56">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Sort</span>
                <select
                  name="sort"
                  defaultValue={selectedSort}
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="brand">Brand A–Z</option>
                </select>
              </label>

              <div className="flex flex-col gap-2 sm:flex-row">
                {hasFilters ? (
                  <Link
                    href="/shop"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Link>
                ) : null}
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-extrabold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </form>

          {filteredInventory.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredInventory.map((product) => (
                <ProductCard
                  key={product.id}
                  name={product.seo_title}
                  description={product.short_description}
                  price={formatUsd(product.price)}
                  image={product.images[0] || "/placeholder.svg"}
                  condition={product.condition}
                  status={product.status}
                  brand={product.brand}
                  model={product.model}
                  href={productPath(product.slug)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h3 className="text-xl font-black text-slate-950">No exact matches</h3>
              <p className="mx-auto mt-2 max-w-xl text-slate-600">
                Clear one or more filters, or call to ask about appliances arriving soon.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/shop"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  View All Inventory
                </Link>
                <a
                  href="tel:843-536-6005"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-extrabold text-white hover:bg-blue-700"
                >
                  Call 843-536-6005
                </a>
              </div>
            </div>
          )}
        </section>

        <section className="mt-16" aria-labelledby="category-heading">
          <div className="mb-6">
            <p className="text-xs font-extrabold uppercase tracking-wide text-blue-700">Browse by type</p>
            <h2 id="category-heading" className="mt-2 text-2xl font-black text-slate-950">
              Appliance categories
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {SHOP_INVENTORY_CATEGORIES.map((category) => (
              <Link
                key={category}
                href={categoryPath(category)}
                className="flex min-h-24 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <span className="font-black text-slate-950">{categoryLabel(category)}</span>
                <span aria-hidden="true" className="text-xl font-black text-blue-700">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-black text-slate-900">Tested, cleaned and backed by Road Runner</h2>
            <p className="mt-4 text-slate-600">
              Every sold appliance is inspected, tested and cleaned before sale and includes a 30-day warranty.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/service"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-900 transition hover:bg-slate-200"
              >
                View Repair Services
              </Link>
              <a
                href="tel:843-536-6005"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
              >
                Call 843-536-6005
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
