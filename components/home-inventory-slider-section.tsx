import { HomeInventorySlider, type HomeInventorySliderItem } from "@/components/home-inventory-slider";
import { getInventory, isFrontendVisibleInventoryStatus, type InventoryItem } from "@/lib/inventory";
import { formatUsd } from "@/lib/money";
import { productPath } from "@/lib/routes";

const INVENTORY_CATEGORY_LABELS: Record<InventoryItem["category"], string> = {
  refrigerators: "Refrigerators",
  washers: "Washers",
  dryers: "Dryers",
  "stoves-ovens": "Stoves & Ranges",
  dishwashers: "Dishwashers",
  packages: "Washer & Dryer Sets",
};

const STOVES_CATEGORY: InventoryItem["category"] = "stoves-ovens";

const INVENTORY_IMAGE_FALLBACKS: Record<InventoryItem["category"], string> = {
  refrigerators: "/images/products/refrigerator-french-door.jpg",
  washers: "/images/products/washer-top-load.jpg",
  dryers: "/images/products/dryer-electric.jpg",
  "stoves-ovens": "/images/products/stove-electric.jpg",
  dishwashers: "/placeholder.jpg",
  packages: "/images/products/washer-dryer-set.jpg",
};

const STOVES_PLACEHOLDER_ITEM: HomeInventorySliderItem = {
  id: "stoves-ranges-placeholder",
  title: "Used Stoves & Ranges",
  href: "/stoves-ranges",
  image: "/images/products/stove-electric.jpg",
  fallbackImage: "/images/products/stove-electric.jpg",
  category: STOVES_CATEGORY,
  categoryLabel: INVENTORY_CATEGORY_LABELS[STOVES_CATEGORY],
  price: "Call for price",
  condition: "Check Availability",
  status: "available",
  brand: "Road Runner Appliance",
  model: "Stoves & Ranges",
  description:
    "Gas and electric stoves rotate through inventory. Call or check the stoves section for current availability.",
};

function getSafePublicImage(input: unknown, fallback: string) {
  if (typeof input !== "string") return fallback;
  const value = input.trim();
  if (!value) return fallback;

  const lower = value.toLowerCase();
  if (lower === "null" || lower === "undefined" || lower === "[object object]") return fallback;

  if (value.startsWith("/") || value.startsWith("https://") || value.startsWith("http://")) {
    return value;
  }

  return fallback;
}

function getProductTitle(item: InventoryItem) {
  return item.seo_title || `${item.brand || "Appliance"} ${item.model || ""}`.trim();
}

function toSliderItem(item: InventoryItem): HomeInventorySliderItem {
  const title = getProductTitle(item);
  const fallbackImage = INVENTORY_IMAGE_FALLBACKS[item.category] || "/images/roadrunner-running.png";

  return {
    id: item.id,
    title,
    href: productPath(item.slug),
    image: getSafePublicImage(item.images?.[0], fallbackImage),
    fallbackImage,
    category: item.category,
    categoryLabel: INVENTORY_CATEGORY_LABELS[item.category] || "Appliances",
    price: formatUsd(item.price),
    condition: item.condition,
    status: item.status,
    brand: item.brand || "Appliance",
    model: item.model || "Unknown",
    description:
      item.short_description ||
      "Tested used appliance available from Road Runner Appliance in Hemingway, SC.",
  };
}

function ensureStovesSliderItem(items: HomeInventorySliderItem[], inventory: InventoryItem[]) {
  if (items.some((item) => item.category === STOVES_CATEGORY)) return items;

  const availableStove = inventory.find((item) => item.category === STOVES_CATEGORY && isFrontendVisibleInventoryStatus(item.status));
  if (availableStove) {
    return [...items, toSliderItem(availableStove)];
  }

  return [...items, STOVES_PLACEHOLDER_ITEM];
}

export async function HomeInventorySliderSection() {
  const inventory = await getInventory();
  const availableInventory = inventory.filter((item) => isFrontendVisibleInventoryStatus(item.status));
  const sliderItems = ensureStovesSliderItem(
    availableInventory
      .slice(0, 8)
      .map(toSliderItem),
    availableInventory,
  );

  if (sliderItems.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#f6f8fb] pb-10 pt-10 md:pb-16 md:pt-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-4 flex flex-col justify-between gap-3 md:mb-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-blue-700">Used appliances in stock</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-[32px]">
              Ready for pickup or delivery
            </h2>
          </div>
          <a href="/shop" className="text-xs font-extrabold text-blue-700 hover:text-blue-800">
            Browse all appliances
          </a>
        </div>

        <HomeInventorySlider items={sliderItems} />
      </div>
    </section>
  );
}
