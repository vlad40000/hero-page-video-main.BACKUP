"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, PlayCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductMediaItem = {
  id?: string;
  type: "image" | "video";
  src: string;
  alt?: string;
  poster?: string;
};

type ProductMediaSliderProps = {
  media: ProductMediaItem[];
  title?: string;
  aspect?: "parts" | "square" | "wide";
  transition?: "fade" | "slide";
  showThumbnails?: boolean;
  showArrows?: boolean;
  enableZoom?: boolean;
  className?: string;
};

const MIN_ZOOM_SCALE = 1;
const DEFAULT_ZOOM_SCALE = 1.1;
const MAX_ZOOM_SCALE = 1.4;

const ASPECT_CLASS: Record<NonNullable<ProductMediaSliderProps["aspect"]>, string> = {
  parts: "aspect-[5/4]",
  square: "aspect-square",
  wide: "aspect-video",
};

export function normalizeIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

function isSafeMediaSrc(src: unknown): src is string {
  if (typeof src !== "string") return false;
  const value = src.trim();
  if (!value) return false;

  const lower = value.toLowerCase();
  if (lower === "null" || lower === "undefined" || lower === "[object object]") {
    return false;
  }

  return value.startsWith("/") || value.startsWith("https://") || value.startsWith("http://");
}

export function getSafeMedia(media: ProductMediaItem[]) {
  return media
    .filter((item) => item && (item.type === "image" || item.type === "video"))
    .filter((item) => isSafeMediaSrc(item.src))
    .map((item, index) => ({
      ...item,
      id: item.id || `${item.type}-${index}`,
      src: item.src.trim(),
      alt: item.alt?.trim() || "Product media",
    }));
}

export function getZoomOrigin(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
) {
  if (rect.width <= 0 || rect.height <= 0) {
    return { x: 50, y: 50, css: "50% 50%" };
  }

  const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
  const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));

  return {
    x,
    y,
    css: `${x.toFixed(2)}% ${y.toFixed(2)}%`,
  };
}

export function getNextZoomScale(current: number, delta = 0.1) {
  const next = Math.round((current + delta) * 100) / 100;
  return Math.min(MAX_ZOOM_SCALE, Math.max(MIN_ZOOM_SCALE, next));
}

export default function ProductMediaSlider({
  media,
  title = "Product media",
  aspect = "parts",
  transition = "fade",
  showThumbnails = true,
  showArrows = true,
  enableZoom = true,
  className,
}: ProductMediaSliderProps) {
  const safeMedia = useMemo(() => getSafeMedia(media), [media]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(DEFAULT_ZOOM_SCALE);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");

  const normalizedActiveIndex = normalizeIndex(activeIndex, safeMedia.length);
  const activeMedia = safeMedia[normalizedActiveIndex];
  const hasMultipleItems = safeMedia.length > 1;

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(normalizeIndex(index, safeMedia.length));
      setZoomScale(DEFAULT_ZOOM_SCALE);
    },
    [safeMedia.length],
  );

  const goPrevious = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const origin = getZoomOrigin(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
    setZoomOrigin(origin.css);
  }, []);

  const openZoom = useCallback(() => {
    if (activeMedia?.type !== "image" || !enableZoom) return;
    setZoomScale(DEFAULT_ZOOM_SCALE);
    setZoomOpen(true);
  }, [activeMedia?.type, enableZoom]);

  const closeZoom = useCallback(() => {
    setZoomOpen(false);
    setZoomScale(DEFAULT_ZOOM_SCALE);
  }, []);

  if (!activeMedia) {
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "group relative overflow-hidden rounded-lg border border-border bg-white shadow-sm",
          ASPECT_CLASS[aspect],
        )}
        onPointerMove={handlePointerMove}
        onPointerEnter={() => setIsHoveringImage(true)}
        onPointerLeave={() => setIsHoveringImage(false)}
      >
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-slate-50",
            transition === "fade" ? "transition-opacity duration-300" : "transition-transform duration-300",
          )}
        >
          {activeMedia.type === "video" ? (
            <video
              key={activeMedia.src}
              src={activeMedia.src}
              poster={activeMedia.poster}
              controls
              playsInline
              className="h-full w-full object-contain"
              aria-label={activeMedia.alt || title}
            />
          ) : (
            <img
              key={activeMedia.src}
              src={activeMedia.src}
              alt={activeMedia.alt || title}
              className="h-full w-full object-contain transition-transform duration-300 ease-out"
              style={{
                transformOrigin: zoomOrigin,
                transform:
                  enableZoom && isHoveringImage && !zoomOpen
                    ? `scale(${DEFAULT_ZOOM_SCALE})`
                    : "scale(1)",
              }}
              draggable={false}
            />
          )}
        </div>

        {showArrows && hasMultipleItems ? (
          <>
            <button
              type="button"
              onClick={goPrevious}
              className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-slate-950/60 text-white shadow-lg transition hover:bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Previous product image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-slate-950/60 text-white shadow-lg transition hover:bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Next product image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}

        <div className="absolute bottom-3 left-3 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-white shadow">
          {normalizedActiveIndex + 1} / {safeMedia.length}
        </div>

        {enableZoom && activeMedia.type === "image" ? (
          <button
            type="button"
            onClick={openZoom}
            className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-slate-950/60 text-white shadow-lg transition hover:bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Open product image detail view"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {showThumbnails && safeMedia.length > 1 ? (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-5 lg:grid-cols-6">
          {safeMedia.map((item, index) => {
            const isActive = index === normalizedActiveIndex;

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => goTo(index)}
                className={cn(
                  "relative aspect-[5/4] overflow-hidden rounded-md border bg-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
                )}
                aria-label={`Show product media ${index + 1}`}
                aria-current={isActive ? "true" : undefined}
              >
                {item.type === "video" ? (
                  <>
                    {item.poster ? (
                      <img src={item.poster} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-slate-100" />
                    )}
                    <PlayCircle className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-slate-900" />
                  </>
                ) : (
                  <img src={item.src} alt="" className="h-full w-full object-contain p-1" draggable={false} />
                )}
              </button>
            );
          })}
        </div>
      ) : null}

      {zoomOpen && activeMedia.type === "image" ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} detail view`}
        >
          <button
            type="button"
            onClick={closeZoom}
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close product image detail view"
          >
            <X className="h-5 w-5" />
          </button>

          {showArrows && hasMultipleItems ? (
            <>
              <button
                type="button"
                onClick={goPrevious}
                className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Previous product image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Next product image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}

          <button
            type="button"
            onPointerMove={handlePointerMove}
            onClick={() =>
              setZoomScale((current) =>
                current >= MAX_ZOOM_SCALE ? DEFAULT_ZOOM_SCALE : getNextZoomScale(current),
              )
            }
            onWheel={(event) => {
              event.preventDefault();
              setZoomScale((current) => getNextZoomScale(current, event.deltaY < 0 ? 0.1 : -0.1));
            }}
            className="flex h-full max-h-[86vh] w-full max-w-6xl cursor-zoom-in items-center justify-center overflow-hidden rounded-lg bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Adjust product image zoom"
          >
            <img
              src={activeMedia.src}
              alt={activeMedia.alt || title}
              className="max-h-full max-w-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: zoomOrigin,
              }}
              draggable={false}
            />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">
            {Math.round(zoomScale * 100)}%
          </div>
        </div>
      ) : null}
    </div>
  );
}
