import type { Metadata } from "next";

import { PartsCatalogDetailPage } from "@/components/parts-catalog/PartsCatalogPages";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{
    partNumber: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { partNumber } = await params;
  const decoded = decodeURIComponent(partNumber);
  return {
    title: `${decoded} | Parts Catalog`,
    description: `Road Runner appliance part catalog record for ${decoded}.`,
  };
}

export default async function PartsCatalogPartPage({ params }: PageProps) {
  const { partNumber } = await params;
  return <PartsCatalogDetailPage partNumber={decodeURIComponent(partNumber)} />;
}
