"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export type HomeInventorySliderItem = {
  id: string;
  title: string;
  href: string;
  image: string;
  fallbackImage: string;
  category: string;
  categoryLabel: string;
  price: string;
  condition: string;
  status?: string;
  brand: string;
  model: string;
  description: string;
};

type HomeInventorySliderProps = {
  items: HomeInventorySliderItem[];
};

function wrapIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

export function HomeInventorySlider({ items }: HomeInventorySliderProps) {
  const sliderItems = useMemo(() => items.filter((item) => item.image && item.href), [items]);
  const categories = useMemo(() => {
    const seen = new Map<string, string>();

    sliderItems.forEach((item) => {
      if (item.category && item.categoryLabel && !seen.has(item.category)) {
        seen.set(item.category, item.categoryLabel);
      }
    });

    return Array.from(seen, ([value, label]) => ({ value, label }));
  }, [sliderItems]);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const activeImageRef = useRef<HTMLImageElement | null>(null);
  const visibleItems = useMemo(() => {
    if (selectedCategory === "all") return sliderItems;
    return sliderItems.filter((item) => item.category === selectedCategory);
  }, [selectedCategory, sliderItems]);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeItem = visibleItems[wrapIndex(activeIndex, visibleItems.length)];
  const hasMultipleItems = visibleItems.length > 1;

  const markImageFailed = useCallback((image: string) => {
    if (!image) return;
    setFailedImages((current) => {
      if (current.has(image)) return current;
      const next = new Set(current);
      next.add(image);
      return next;
    });
  }, []);

  const imageFor = useCallback(
    (item: HomeInventorySliderItem) => (failedImages.has(item.image) ? item.fallbackImage : item.image),
    [failedImages],
  );

  const selectCategory = useCallback((category: string) => {
    setSelectedCategory(category);
    setActiveIndex(0);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(wrapIndex(index, visibleItems.length));
    },
    [visibleItems.length],
  );

  const activeImageSrc = activeItem ? imageFor(activeItem) : "";

  useEffect(() => {
    if (!activeItem) return undefined;
    const image = activeImageRef.current;
    if (!image || activeImageSrc === activeItem.fallbackImage) return undefined;

    const timer = window.setTimeout(() => {
      if (image.complete && image.naturalWidth === 0) {
        markImageFailed(activeItem.image);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [activeImageSrc, activeItem?.fallbackImage, activeItem?.image, activeItem, markImageFailed]);

  if (!activeItem) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
      {categories.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white p-3">
          <button
            type="button"
            onClick={() => selectCategory("all")}
            className={cn(
              "h-9 shrink-0 rounded-md border px-4 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
              selectedCategory === "all"
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50",
            )}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => selectCategory(category.value)}
              className={cn(
                "h-9 shrink-0 rounded-md border px-4 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                selectedCategory === category.value
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50",
              )}
            >
              {category.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="relative min-h-[420px] bg-slate-100 sm:min-h-[500px] md:min-h-[540px] lg:min-h-[420px]">
          <Link href={activeItem.href} className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-10">
            <img
              ref={activeImageRef}
              key={activeImageSrc}
              src={activeImageSrc}
              alt={activeItem.title}
              className="h-full w-full object-contain transition duration-300"
              draggable={false}
              onError={() => markImageFailed(activeItem.image)}
            />
          </Link>

          {hasMultipleItems ? (
            <>
              <button
                type="button"
                onClick={() => goTo(activeIndex - 1)}
                className="absolute left-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-slate-950/60 text-white shadow-lg transition hover:bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Previous appliance"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => goTo(activeIndex + 1)}
                className="absolute right-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-slate-950/60 text-white shadow-lg transition hover:bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Next appliance"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}

          <div className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-900 shadow">
            {activeItem.price}
          </div>
        </div>

        <div className="flex flex-col justify-center p-5 md:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
              {activeItem.categoryLabel}
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
              {activeItem.status === "sold" ? "Sold" : activeItem.condition}
            </span>
          </div>

          <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{activeItem.brand}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">{activeItem.title}</h2>
          <p className="mt-2 font-mono text-sm font-semibold text-slate-500">Model {activeItem.model}</p>
          <p className="mt-5 text-base leading-7 text-slate-600">{activeItem.description}</p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href={activeItem.href}
              className="inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              {activeItem.status === "sold" ? "View Sold Unit" : "View Details"}
            </Link>
            <a
              href="tel:843-536-6005"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-900 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              <Phone className="h-4 w-4" />
              Call
            </a>
          </div>

          {hasMultipleItems ? (
            <div className="mt-8 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {visibleItems.slice(0, 5).map((item, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(index)}
                    className={cn(
                      "aspect-[5/4] overflow-hidden rounded-md border bg-slate-50 p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                      isActive ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-300",
                    )}
                    aria-label={`Show ${item.title}`}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <img
                      src={imageFor(item)}
                      alt=""
                      className="h-full w-full object-contain"
                      draggable={false}
                      onError={() => markImageFailed(item.image)}
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
