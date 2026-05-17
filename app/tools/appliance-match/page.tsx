import { Metadata } from "next";
import { ApplianceMatchClient, type ApplianceMatchItem } from "./ApplianceMatchClient";
import { getInventory, isFrontendVisibleInventoryStatus, type InventoryItem } from "@/lib/inventory";
import { productPath } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Appliance Match | Road Runner Appliance",
  description:
    "Answer three quick questions and match with current Road Runner Appliance inventory using live machine prices.",
  alternates: {
    canonical: "/tools/appliance-match",
  },
};

const CATEGORY_LABELS: Record<InventoryItem["category"], string> = {
  refrigerators: "Refrigerators",
  washers: "Washers",
  dryers: "Dryers",
  "stoves-ovens": "Stoves & Ranges",
  dishwashers: "Dishwashers",
  packages: "Washer & Dryer Sets",
};

const IMAGE_FALLBACKS: Record<InventoryItem["category"], string> = {
  refrigerators: "/images/products/refrigerator-french-door.jpg",
  washers: "/images/products/washer-top-load.jpg",
  dryers: "/images/products/dryer-electric.jpg",
  "stoves-ovens": "/images/products/stove-electric.jpg",
  dishwashers: "/placeholder.jpg",
  packages: "/images/products/washer-dryer-set.jpg",
};

function safeImage(item: InventoryItem) {
  const fallback = IMAGE_FALLBACKS[item.category] || "/images/roadrunner-running.png";
  const image = item.images?.[0];
  if (typeof image !== "string") return fallback;
  const value = image.trim();
  if (!value || value === "null" || value === "undefined" || value === "[object Object]") return fallback;
  if (value.startsWith("/") || value.startsWith("https://") || value.startsWith("http://")) return value;
  return fallback;
}

function titleFor(item: InventoryItem) {
  return item.seo_title || `${item.brand || "Appliance"} ${item.model || ""}`.trim();
}

function toMatchItem(item: InventoryItem): ApplianceMatchItem {
  return {
    id: item.id,
    slug: item.slug,
    title: titleFor(item),
    brand: item.brand || "Appliance",
    model: item.model || "Unknown",
    category: item.category,
    categoryLabel: CATEGORY_LABELS[item.category] || "Appliances",
    price: item.price,
    condition: item.condition,
    status: item.status,
    image: safeImage(item),
    href: productPath(item.slug),
    description:
      item.short_description ||
      "Tested used appliance available from Road Runner Appliance in Hemingway, SC.",
  };
}

export default async function ApplianceMatchPage() {
  const inventory = (await getInventory())
    .filter((item) => isFrontendVisibleInventoryStatus(item.status))
    .map(toMatchItem);

  return <ApplianceMatchClient inventory={inventory} />;
}
