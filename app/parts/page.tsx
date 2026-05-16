import type { Metadata } from "next";

import { PartsCatalogGridPage } from "@/components/parts-catalog/PartsCatalogPages";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Parts Catalog | Road Runner Appliance",
  description:
    "Browse Road Runner appliance part catalog entries populated from parts finder and troubleshooting searches.",
  alternates: {
    canonical: "/parts",
  },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PartsCatalogPage({ searchParams }: PageProps) {
  return (
    <PartsCatalogGridPage
      searchParams={await searchParams}
      basePath="/parts"
      detailBasePath="/parts"
    />
  );
}
