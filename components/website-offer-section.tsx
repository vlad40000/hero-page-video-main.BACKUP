import Link from "next/link";
import { ArrowRight, BadgePercent, Phone } from "lucide-react";

export function WebsiteOfferSection() {
  return (
    <section className="bg-slate-50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-lg shadow-slate-200/60">
          <div className="grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:p-10">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <BadgePercent className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700">Website offer</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Mention this website and get 10% off your appliance purchase.
                </h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                  No form is required. Browse available appliances, then mention the website when you call or buy in store.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Link
                href="/shop"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Shop Appliances
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="tel:843-536-6005"
                data-track-placement="offer_10pct"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-sm font-extrabold text-slate-900 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <Phone className="h-4 w-4" />
                Call to Confirm
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
