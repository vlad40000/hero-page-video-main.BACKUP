import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  DollarSign,
  Gauge,
  MapPin,
  Phone,
  Wrench,
} from "lucide-react";
import { notFound } from "next/navigation";
import { REPAIR_GUIDES } from "@/lib/repair-guides";

type GuidePageProps = {
  params: Promise<{ slug: string }>;
};

function renderInlineMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function renderArticleMarkdown(markdown: string) {
  const nodes: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (!bullets.length) return;
    const currentBullets = bullets;
    bullets = [];
    nodes.push(
      <ul key={`bullets-${nodes.length}`} className="ml-5 list-disc space-y-2 text-slate-700">
        {currentBullets.map((bullet) => (
          <li key={bullet}>{renderInlineMarkdown(bullet)}</li>
        ))}
      </ul>
    );
  };

  markdown.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushBullets();
      return;
    }

    if (line.startsWith("# ")) {
      flushBullets();
      return;
    }

    if (line.startsWith("## ")) {
      flushBullets();
      nodes.push(
        <h2 key={`h2-${nodes.length}`} className="pt-8 text-2xl font-black text-slate-900">
          {line.slice(3)}
        </h2>
      );
      return;
    }

    if (line.startsWith("### ")) {
      flushBullets();
      nodes.push(
        <h3 key={`h3-${nodes.length}`} className="pt-5 text-lg font-bold text-slate-900">
          {line.slice(4)}
        </h3>
      );
      return;
    }

    if (line.startsWith("* ")) {
      bullets.push(line.slice(2));
      return;
    }

    flushBullets();
    nodes.push(
      <p key={`p-${nodes.length}`} className="text-slate-700 leading-8">
        {renderInlineMarkdown(line)}
      </p>
    );
  });

  flushBullets();
  return nodes;
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = REPAIR_GUIDES.find((item) => item.slug === slug);
  if (!guide) return { title: "Guide Not Found" };

  return {
    title: `${guide.title} | Road Runner Appliance`,
    description: guide.description,
    alternates: {
      canonical: `/guides/repair/${guide.slug}`,
    },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = REPAIR_GUIDES.find((item) => item.slug === slug);
  if (!guide) notFound();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <main className="max-w-4xl mx-auto px-6 py-16">
        <nav className="mb-8 flex items-center gap-2 text-sm font-medium text-slate-500">
          <Link href="/tools" className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors">
            <ChevronLeft size={16} /> Tools
          </Link>
          <span>/</span>
          <Link href="/service#repair-guides" className="hover:text-blue-600 transition-colors">
            Repair Guides
          </Link>
          <span>/</span>
          <span className="text-slate-900 truncate">{guide.category}</span>
        </nav>

        <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
          <div className="mb-6 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
            {guide.category} Repair Guide
          </div>

          <h1 className="mb-6 text-3xl font-black leading-tight text-slate-900 md:text-4xl">
            {guide.title}
          </h1>

          <p className="mb-10 text-lg leading-relaxed text-slate-600">
            {guide.description}
          </p>

          <div className="mb-12 grid gap-12 md:grid-cols-2">
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
                <AlertTriangle className="text-amber-500" /> Key Symptoms
              </h2>
              <ul className="space-y-3">
                {guide.symptoms.map((symptom) => (
                  <li key={symptom} className="flex items-start gap-2 font-medium text-slate-600">
                    <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                    {symptom}
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex flex-col justify-center rounded-2xl bg-blue-600 p-6 text-white">
              <h3 className="mb-2 flex items-center gap-2 text-xl font-bold">
                <Gauge /> Get an Instant Estimate
              </h3>
              <p className="mb-6 text-sm text-blue-100">
                Not sure if these causes fit? Run your specific symptoms through our Fix It or Ditch It tool.
              </p>
              <Link
                href="/tools/fix"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white py-3 font-black text-blue-600 shadow-xl transition-all hover:bg-blue-50"
              >
                Start AI Diagnosis <ArrowRight size={18} />
              </Link>
            </section>
          </div>

          <section className="mb-14 space-y-7 border-t border-slate-100 pt-10">
            {renderArticleMarkdown(guide.articleMarkdown)}
          </section>

          <section className="border-t border-slate-100 pt-10">
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Wrench className="text-blue-600" /> Most Likely Causes & Costs
            </h2>
            <div className="grid gap-6">
              {guide.causes.map((cause) => (
                <div
                  key={cause.item}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50 p-6 transition-colors hover:border-blue-200 md:flex-row md:items-center"
                >
                  <div className="max-w-lg">
                    <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                      {cause.item}
                    </h3>
                    <p className="text-sm text-slate-500">{cause.description}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-2 shadow-sm md:mt-0">
                    <DollarSign size={16} className="text-emerald-500" />
                    <span className="font-black text-slate-900">{cause.cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 rounded-2xl border border-blue-100 bg-slate-50 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Need help with this issue?</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Run the symptom checker or call Road Runner Appliance to schedule service.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/tools/fix"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700"
                >
                  <Wrench size={18} /> Troubleshoot
                </Link>
                <a
                  href="tel:843-536-6005"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
                >
                  <Phone size={18} /> Schedule Service
                </a>
              </div>
            </div>
          </section>

          <div className="mt-16 border-t border-slate-100 pt-8">
            <p className="text-xs italic leading-relaxed text-slate-400">
              Prices are based on average retail part costs and standard Hemingway, SC labor rates. Actual pricing may vary by model complexity, brand, and parts availability.
            </p>
          </div>
        </article>

        <div className="mt-12 text-center text-slate-500">
          <p className="flex items-center justify-center gap-2 text-sm">
            <MapPin size={16} /> Serving Hemingway, Florence, Georgetown, and Myrtle Beach.
          </p>
        </div>
      </main>
    </div>
  );
}

export async function generateStaticParams() {
  return REPAIR_GUIDES.map((guide) => ({
    slug: guide.slug,
  }));
}
