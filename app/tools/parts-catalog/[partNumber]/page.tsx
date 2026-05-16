import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    partNumber: string;
  }>;
};

export default async function PartsCatalogToolAliasPartPage({ params }: PageProps) {
  const { partNumber } = await params;
  redirect(`/parts/${encodeURIComponent(decodeURIComponent(partNumber))}`);
}
