import type { MetadataRoute } from 'next';
import { getInventory } from '@/lib/inventory';
import { REPAIR_GUIDES } from '@/lib/repair-guides';

const BASE = 'https://roadrunnerappliance.com';

export const dynamic = 'force-dynamic';

const STATIC_PATHS = [
  '',
  '/shop',
  '/service',
  '/service/resident',
  '/service/corporate',
  '/resources',
  '/resources/buying-used-appliances',
  '/articles',
  '/faq',
  '/parts',
  '/tools',
  '/tools/fix',
  '/tools/part-finder',
  '/tools/repair-vs-replace',
  '/tools/appliance-match',
  '/tools/size-guide',
  '/tools/temp-guide',
  '/washers',
  '/dryers',
  '/refrigerators',
  '/dishwashers',
  '/stoves-ranges',
  '/washer-dryer-sets',
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const inventory = await getInventory();

  const staticUrls: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${BASE}${path}`,
  }));

  const guideUrls: MetadataRoute.Sitemap = REPAIR_GUIDES.map((guide) => ({
    url: `${BASE}/guides/repair/${guide.slug}`,
  }));

  const productUrls: MetadataRoute.Sitemap = inventory.map((product) => ({
    url: `${BASE}/products/${product.slug}`,
    ...(product.updatedAt ? { lastModified: product.updatedAt } : {}),
  }));

  return [...staticUrls, ...guideUrls, ...productUrls];
}
