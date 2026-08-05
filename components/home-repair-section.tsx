import Link from "next/link";
import { ArrowRight, Phone, Wrench } from "lucide-react";

export function HomeRepairSection() {
  return (
    <section className="bg-white py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-[#0b3554] px-6 py-8 text-white shadow-xl sm:px-8 md:px-12 md:py-10">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="flex gap-4">
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#ffc400] text-slate-950 sm:flex">
                <Wrench className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#ffc400]">Appliance repair</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Appliance stopped working?</h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-white/80 sm:text-lg">
                  We service washers, dryers, refrigerators, ranges and other major appliances. Call now to explain the problem and get the next step.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <a
                href="tel:843-536-6005"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ffc400] px-6 py-3 text-base font-extrabold text-slate-950 transition hover:bg-[#ffd43b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b3554]"
              >
                <Phone className="h-5 w-5" />
                Call 843-536-6005
              </a>
              <Link
                href="/service"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-white/50 px-6 py-3 text-base font-extrabold text-white transition hover:border-white hover:bg-white hover:text-[#0b3554] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b3554]"
              >
                View Repair Services
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
