import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  Building2,
  CheckCircle2,
  Clock3,
  House,
  MapPin,
  Phone,
  Refrigerator,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  WashingMachine,
  Wrench,
} from "lucide-react";

const PHONE_DISPLAY = "843-536-6005";
const PHONE_HREF = "tel:843-536-6005";
const DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1&destination=123+W.+Broad+St.+Hemingway,+SC+29554";

export const metadata: Metadata = {
  title: "Appliance Repair in Hemingway, SC",
  description:
    "Call Road Runner Appliance for washer, dryer, refrigerator, range, dishwasher, and major-appliance repair in Hemingway, SC. All makes and models.",
  alternates: {
    canonical: "/service",
  },
};

const APPLIANCES = [
  "Washers",
  "Dryers",
  "Refrigerators",
  "Ranges & stoves",
  "Dishwashers",
  "Other major appliances",
];

const GUIDES = [
  { title: "Washer Won't Drain", slug: "washer-wont-drain-causes-repair-costs" },
  { title: "Dryer Not Heating", slug: "dryer-not-heating-common-fixes" },
  { title: "Refrigerator Not Cooling", slug: "refrigerator-not-cooling-troubleshooting" },
  { title: "Loud Spin Cycle", slug: "loud-banging-spin-cycle-diagnosis" },
];

export default function ServicePage() {
  return (
    <div className="bg-slate-50 text-slate-950">
      <section className="overflow-hidden bg-[#0b3554] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] lg:items-center lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#ffc400]">Local appliance repair</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Need appliance repair? Call Road Runner.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/80 sm:text-xl">
              Tell us what is happening with your appliance. We repair all major makes and models and will help you determine the right next step.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={PHONE_HREF}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#ffc400] px-7 py-4 text-lg font-black text-slate-950 shadow-lg shadow-black/20 transition hover:bg-[#ffd43b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b3554]"
              >
                <Phone className="h-5 w-5" />
                Call {PHONE_DISPLAY}
              </a>
              <Link
                href="/tools/fix"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-white/45 px-7 py-4 text-base font-extrabold text-white transition hover:border-white hover:bg-white hover:text-[#0b3554] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <SearchCheck className="h-5 w-5" />
                Troubleshoot Online
              </Link>
            </div>

            <div className="mt-8 grid max-w-3xl gap-3 text-sm font-bold text-white/85 sm:grid-cols-3">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-[#ffc400]" /> All makes & models</div>
              <div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-[#ffc400]" /> Fast scheduling</div>
              <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#ffc400]" /> 4.8 Google rating</div>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/15 bg-white p-6 text-slate-950 shadow-2xl sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">Before you call</p>
            <h2 className="mt-2 text-2xl font-black">Have these details ready</h2>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-700">
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><span>Appliance type and brand</span></li>
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><span>Model number, when available</span></li>
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><span>What the appliance is doing—or not doing</span></li>
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><span>Your service address</span></li>
            </ul>
            <a
              href={PHONE_HREF}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-extrabold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <Phone className="h-5 w-5" />
              Call for Repair
            </a>
          </aside>
        </div>
      </section>

      <main>
        <section className="bg-white py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-blue-700">What we repair</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Major household appliances</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Call with the appliance type, brand, and symptoms. We will tell you whether Road Runner can service it and how to proceed.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {APPLIANCES.map((appliance, index) => {
                const Icon = index === 0 || index === 1 ? WashingMachine : index === 2 ? Refrigerator : Wrench;
                return (
                  <div key={appliance} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center shadow-sm">
                    <Icon className="mx-auto h-7 w-7 text-blue-700" />
                    <p className="mt-3 text-sm font-extrabold text-slate-900">{appliance}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-100 py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-blue-700">Simple service process</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Call first. We will guide the next step.</h2>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  A quick phone conversation helps us understand the appliance, the issue, and the service location before scheduling.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                  <a
                    href={PHONE_HREF}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-extrabold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                  >
                    <Phone className="h-5 w-5" />
                    Call {PHONE_DISPLAY}
                  </a>
                  <a
                    href={DIRECTIONS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 font-extrabold text-slate-800 transition hover:border-blue-500 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <MapPin className="h-5 w-5" />
                    Get Directions
                  </a>
                </div>
              </div>

              <ol className="grid gap-4 sm:grid-cols-3">
                {[
                  { number: "1", title: "Call us", body: "Describe the appliance and the problem." },
                  { number: "2", title: "Confirm the next step", body: "We will discuss service availability and what information is needed." },
                  { number: "3", title: "Schedule service", body: "Set the visit and keep your appliance details handy." },
                ].map((step) => (
                  <li key={step.number} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ffc400] text-lg font-black text-slate-950">{step.number}</span>
                    <h3 className="mt-4 text-xl font-black">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="bg-white py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-blue-700">Choose your next step</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Get help in the way that works for you</h2>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <a href={PHONE_HREF} className="group rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 transition hover:border-emerald-400 hover:shadow-lg">
                <Phone className="h-9 w-9 text-emerald-700" />
                <h3 className="mt-4 text-2xl font-black">Call for Repair</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">The fastest path when you want to discuss the problem and schedule service.</p>
                <span className="mt-5 inline-flex items-center gap-2 font-extrabold text-emerald-700">Call {PHONE_DISPLAY}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </a>

              <Link href="/tools/fix" className="group rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 transition hover:border-blue-400 hover:shadow-lg">
                <SearchCheck className="h-9 w-9 text-blue-700" />
                <h3 className="mt-4 text-2xl font-black">Troubleshoot Online</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Work through the symptoms and get guidance before making the call.</p>
                <span className="mt-5 inline-flex items-center gap-2 font-extrabold text-blue-700">Start Troubleshooting<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </Link>

              <a href="#repair-guides" className="group rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 transition hover:border-amber-400 hover:shadow-lg">
                <Wrench className="h-9 w-9 text-amber-700" />
                <h3 className="mt-4 text-2xl font-black">Read Repair Guides</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Review common causes and typical repair considerations for frequent problems.</p>
                <span className="mt-5 inline-flex items-center gap-2 font-extrabold text-amber-800">Browse Common Problems<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </a>
            </div>
          </div>
        </section>

        <section id="repair-guides" className="border-y border-slate-200 bg-slate-50 py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-blue-700">Common problems</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Repair guides</h2>
              </div>
              <Link href="/resources" className="inline-flex min-h-11 items-center gap-2 font-extrabold text-blue-700 hover:text-blue-900">
                View All Resources <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {GUIDES.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guides/repair/${guide.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                >
                  <Wrench className="h-6 w-6 text-blue-700" />
                  <h3 className="mt-4 text-lg font-black group-hover:text-blue-700">{guide.title}</h3>
                  <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-slate-600">View causes and costs <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-5 md:grid-cols-2">
              <Link href="/service/resident" className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:border-blue-300 hover:shadow-md">
                <House className="h-8 w-8 text-blue-700" />
                <h2 className="mt-4 text-2xl font-black">Residential Programs</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Explore resident appliance leasing and service options.</p>
                <span className="mt-4 inline-flex items-center gap-2 font-extrabold text-blue-700">View Residential Options <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </Link>
              <Link href="/service/corporate" className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:border-blue-300 hover:shadow-md">
                <Building2 className="h-8 w-8 text-blue-700" />
                <h2 className="mt-4 text-2xl font-black">Property & Business Programs</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Explore appliance programs for property managers and business customers.</p>
                <span className="mt-4 inline-flex items-center gap-2 font-extrabold text-blue-700">View Corporate Options <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-[#0b3554] py-12 text-white md:py-16">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <ShieldCheck className="mx-auto h-10 w-10 text-[#ffc400]" />
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Ready to talk about the repair?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-white/80">Call Road Runner Appliance and tell us what is happening. We will help you determine the next step.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <a href={PHONE_HREF} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#ffc400] px-7 py-4 text-lg font-black text-slate-950 transition hover:bg-[#ffd43b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <Phone className="h-5 w-5" /> Call {PHONE_DISPLAY}
              </a>
              <Link href="/shop" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-white/45 px-7 py-4 font-extrabold text-white transition hover:border-white hover:bg-white hover:text-[#0b3554]">
                <BadgeDollarSign className="h-5 w-5" /> Shop Replacement Appliances
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
