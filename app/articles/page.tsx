import Link from "next/link";
import { Metadata } from "next";
import { ArrowRight, BookOpenText, Wrench } from "lucide-react";
import { REPAIR_GUIDES } from "@/lib/repair-guides";

export const metadata: Metadata = {
  title: "Appliance Repair Articles & Guides | Road Runner Appliance",
  description:
    "Read practical appliance repair articles for washer drain issues, dryers not heating, refrigerators not cooling, and loud washer spin cycles.",
  alternates: {
    canonical: "/articles",
  },
};

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <main>
        <section className="bg-slate-950 px-6 py-16 text-white">
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
              <BookOpenText size={30} />
            </div>
            <h1 className="mb-4 text-4xl font-black tracking-tight md:text-5xl">
              Appliance Repair Articles
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Practical repair guides for common washer, dryer, and refrigerator problems, including what to check first and when to call for service.
            </p>
          </div>
        </section>

        <section className="px-6 py-14">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
            {REPAIR_GUIDES.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/repair/${guide.slug}`}
                className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-blue-200 hover:shadow-xl"
              >
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Wrench size={28} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    {guide.category}
                  </span>
                </div>
                <h2 className="mb-3 text-2xl font-black text-slate-950 transition-colors group-hover:text-blue-700">
                  {guide.title}
                </h2>
                <p className="mb-7 text-base leading-7 text-slate-600">
                  {guide.description}
                </p>
                <div className="inline-flex items-center gap-2 text-sm font-black text-blue-600 transition-all group-hover:gap-3">
                  Read Article <ArrowRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
