"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Heart, ImageIcon } from "lucide-react";

type PartImageGalleryProps = {
  images: string[];
  title: string;
  partNumber: string;
};

export function PartImageGallery({ images, title, partNumber }: PartImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] || null;

  function goPrevious() {
    setActiveIndex((current) => (current > 0 ? current - 1 : Math.max(images.length - 1, 0)));
  }

  function goNext() {
    setActiveIndex((current) => (current < images.length - 1 ? current + 1 : 0));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        {images.length > 0 ? (
          <div className="hidden max-h-[520px] flex-col gap-2 overflow-y-auto sm:flex">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-white transition ${
                  index === activeIndex
                    ? "border-blue-600 shadow-[0_0_0_1px_#3665F3]"
                    : "border-slate-200 hover:border-blue-500"
                }`}
                aria-label={`View image ${index + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" className="h-full w-full object-contain p-1" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="relative flex min-h-[420px] flex-1 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white sm:min-h-[520px]">
          {activeImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeImage} alt={title} className="max-h-full max-w-full object-contain" />
              {images.length > 1 ? (
                <div className="absolute left-4 top-4 rounded bg-red-600 px-3 py-1 text-xs font-extrabold text-white shadow-sm">
                  {images.length} PHOTOS
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                <ImageIcon className="h-10 w-10" />
              </div>
              <div className="text-sm font-extrabold uppercase tracking-wide text-slate-400">
                Photo pending
              </div>
              <div className="font-mono text-xs font-bold text-slate-400">{partNumber}</div>
            </div>
          )}

          <button
            type="button"
            className="absolute bottom-4 left-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-sm backdrop-blur transition hover:bg-white"
            aria-label="Expand image"
          >
            <Expand className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-sm backdrop-blur transition hover:bg-white hover:text-red-500"
            aria-label="Add to watchlist"
          >
            <Heart className="h-4 w-4" />
          </button>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={goPrevious}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-md transition hover:scale-105 hover:bg-white"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-md transition hover:scale-105 hover:bg-white"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {images.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 sm:hidden">
          {images.map((image, index) => (
            <button
              key={`${image}-mobile-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-white ${
                index === activeIndex ? "border-blue-600" : "border-slate-200"
              }`}
              aria-label={`View image ${index + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="h-full w-full object-contain p-1" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
