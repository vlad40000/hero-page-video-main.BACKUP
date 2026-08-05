import type { InventoryItem } from "./inventory";

const CATEGORY_PATHS: Record<InventoryItem["category"], string> = {
  refrigerators: "/refrigerators",
  washers: "/washers",
  dryers: "/dryers",
  "stoves-ovens": "/stoves-ranges",
  dishwashers: "/dishwashers",
  packages: "/washer-dryer-sets",
};

const CATEGORY_LABELS: Record<InventoryItem["category"], string> = {
  refrigerators: "Refrigerators",
  washers: "Washers",
  dryers: "Dryers",
  "stoves-ovens": "Stoves & Ranges",
  dishwashers: "Dishwashers",
  packages: "Washer & Dryer Sets",
};

export function productPath(slug: string) {
  return `/products/${encodeURIComponent(slug)}`;
}

export function categoryPath(category: InventoryItem["category"]) {
  return CATEGORY_PATHS[category];
}

export function categoryLabel(category: InventoryItem["category"]) {
  return CATEGORY_LABELS[category];
}
