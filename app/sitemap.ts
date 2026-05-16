import { MetadataRoute } from 'next'
import { getInventory } from '@/lib/inventory'
import { REPAIR_GUIDES } from '@/lib/repair-guides'

const BASE = 'https://roadrunnerappliance.com'

const STATIC_PAGES: MetadataRoute.Sitemap = [
    {
        url: BASE,
        priority: 1.0,
        changeFrequency: 'daily',
    },
    {
        url: `${BASE}/shop`,
        priority: 0.9,
        changeFrequency: 'weekly',
    },
    {
        url: `${BASE}/service`,
        priority: 0.9,
        changeFrequency: 'monthly',
    },
    {
        url: `${BASE}/service/resident`,
        priority: 0.8,
        changeFrequency: 'monthly',
    },
    {
        url: `${BASE}/service/corporate`,
        priority: 0.8,
        changeFrequency: 'monthly',
    },
    {
        url: `${BASE}/resources`,
        priority: 0.7,
        changeFrequency: 'monthly',
    },
    {
        url: `${BASE}/resources/buying-used-appliances`,
        priority: 0.6,
        changeFrequency: 'monthly',
    },
    {
        url: `${BASE}/articles`,
        priority: 0.7,
        changeFrequency: 'monthly',
    },
    {
        url: `${BASE}/tools`,
        priority: 0.7,
        changeFrequency: 'monthly',
    },
    {
        url: `${BASE}/tools/fix`,
        priority: 0.8,
        changeFrequency: 'monthly',
    },
    {
        url: `${BASE}/tools/part-finder`,
        priority: 0.7,
        changeFrequency: 'monthly',
    },
    {
        url: `${BASE}/washers`,
        priority: 0.8,
        changeFrequency: 'weekly',
    },
    {
        url: `${BASE}/dryers`,
        priority: 0.8,
        changeFrequency: 'weekly',
    },
    {
        url: `${BASE}/refrigerators`,
        priority: 0.8,
        changeFrequency: 'weekly',
    },
    {
        url: `${BASE}/dishwashers`,
        priority: 0.7,
        changeFrequency: 'weekly',
    },
    {
        url: `${BASE}/stoves-ranges`,
        priority: 0.7,
        changeFrequency: 'weekly',
    },
    {
        url: `${BASE}/washer-dryer-sets`,
        priority: 0.7,
        changeFrequency: 'weekly',
    },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const inventory = await getInventory()

    const productUrls: MetadataRoute.Sitemap = inventory.map((product) => ({
        url: `${BASE}/products/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    const guideUrls: MetadataRoute.Sitemap = REPAIR_GUIDES.map((guide) => ({
        url: `${BASE}/guides/repair/${guide.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }))

    return [
        ...STATIC_PAGES.map((page) => ({ ...page, lastModified: new Date() })),
        ...guideUrls,
        ...productUrls,
    ]
}
