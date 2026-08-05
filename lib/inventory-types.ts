
export enum ItemStatus {
    AVAILABLE = 'available',
    LISTED = 'listed',
    SOLD = 'sold'
}

export enum ItemCondition {
    NEW = 'new',
    LIKE_NEW = 'like-new',
    EXCELLENT = 'excellent',
    GOOD = 'good',
    FAIR = 'fair'
}

export interface WebsiteParams {
    slug: string;
    metaTitle: string;
    metaDescription: string;
}

export interface MarketplaceListing {
    id: string;
    externalId?: string;
    title: string;
    brand?: string;
    model?: string;
    serial?: string;
    category: string;
    price: number;
    originalPrice?: number;
    ageMonths?: number;
    sources?: { title: string; uri: string }[];
    condition: ItemCondition;
    status: ItemStatus;
    description: string;
    seoKeywords: string[];
    websiteParams?: WebsiteParams;
    imageUrl: string | null;
    createdAt: number;
    lastListedAt?: number;
}

export interface InventoryStats {
    totalUnits: number;
    availableCount: number;
    listedCount: number;
    totalValue: number;
}

export type AppView = 'dashboard' | 'inventory' | 'partsCatalog' | 'generator' | 'sidecar';
