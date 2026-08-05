import { Metadata } from "next";
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
      <div className="fix-tool-page min-h-screen py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PartFinderClient />
        </div>
      </div>
    </>
  );
}
