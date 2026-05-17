import { ChevronRight, MapPin } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#0b3554] py-10 sm:py-12 md:min-h-[405px] md:py-9">
      <div className="absolute inset-0 opacity-[0.14]" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8 md:min-h-[340px]">
        <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.14em] text-[#ffc400] md:text-sm">
          Sales & Service - All Makes & Models
        </p>

        <h1 className="mb-4 text-4xl font-black leading-[0.95] tracking-normal text-white text-balance sm:text-5xl md:text-6xl">
          Used Appliances <br />
          You Can Trust
        </h1>

        <p className="mx-auto mb-7 max-w-3xl text-lg font-extrabold leading-snug text-[#ffc400] drop-shadow-md sm:text-xl md:mb-8 md:text-2xl">
          Local sales and repair in Hemingway &mdash; priced right.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm font-extrabold sm:text-base">
          <a
            href="/tools/appliance-match"
            className="group inline-flex items-center gap-1.5 text-[#ffc400] underline decoration-[#ffc400]/45 decoration-2 underline-offset-8 transition hover:text-white hover:decoration-white"
          >
            <span>Find Your Match</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.8} />
          </a>

          <a
            href="/tools/fix"
            className="group inline-flex items-center gap-1.5 text-white underline decoration-white/35 decoration-2 underline-offset-8 transition hover:text-[#ffc400] hover:decoration-[#ffc400]"
          >
            <span>Troubleshoot</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.8} />
          </a>

          <a
            href="https://www.google.com/maps/dir/?api=1&destination=123+W.+Broad+St.+Hemingway,+SC+29554"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 text-white underline decoration-white/35 decoration-2 underline-offset-8 transition hover:text-[#ffc400] hover:decoration-[#ffc400]"
          >
            <span>Get Directions</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.8} />
          </a>

          <a
            href="tel:843-536-6005"
            className="group inline-flex items-center gap-1.5 text-[#ffc400] underline decoration-[#ffc400]/45 decoration-2 underline-offset-8 transition hover:text-white hover:decoration-white"
          >
            <span>Call</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.8} />
          </a>
        </div>

        <div className="mt-9 hidden flex-col items-center justify-center gap-6 text-xs text-white/65 sm:flex sm:flex-row">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            123 W. Broad St. Hemingway, SC 29554
          </span>
        </div>
      </div>
    </section>
  );
}
