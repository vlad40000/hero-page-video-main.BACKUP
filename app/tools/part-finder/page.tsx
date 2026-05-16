import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, PackageSearch } from "lucide-react";
import PartFinderClient from "./components/PartFinderClient";

export const metadata: Metadata = {
  title: "Replacement Part Finder | Road Runner Appliance",
  description:
    "Find likely OEM appliance replacement parts by model number, serial number, or rating plate photo. Review likely matches and send your machine details to Road Runner for help sourcing the right part.",
  alternates: {
    canonical: "/tools/part-finder",
  },
  openGraph: {
    title: "Replacement Part Finder | Road Runner Appliance",
    description:
      "Lookup appliance parts by model number, serial number, or rating plate image.",
    images: ["/opengraph-image.png"],
  },
};

export default function PartFinderPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Road Runner Appliance Part Finder",
    applicationCategory: "Utility",
    operatingSystem: "Web",
    description:
      "Find likely OEM appliance replacement parts by model number, serial number, or rating plate image.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="py-12 md:py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Link href="/tools" className="hover:text-blue-600 transition-colors">
                <ChevronLeft className="mr-1 inline h-4 w-4" />
                Tools Hub
              </Link>
              <span>/</span>
              <span className="text-slate-900">Replacement Part Finder</span>
            </div>
            <Link
              href="/parts"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-xs font-extrabold uppercase tracking-wide text-blue-700 shadow-sm transition hover:border-blue-500 hover:bg-blue-50"
            >
              <PackageSearch className="h-4 w-4" />
              Browse Parts Catalog
            </Link>
          </div>

          <PartFinderClient />
        </div>
      </div>
    </>
  );
}
