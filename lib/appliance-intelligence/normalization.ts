const BRAND_ALIASES: Array<{ canonical: string; matches: string[] }> = [
    { canonical: 'Whirlpool', matches: ['whirlpool', 'kitchenaid', 'kitchen aid', 'amana', 'roper'] },
    { canonical: 'GE', matches: ['ge', 'general electric', 'hotpoint', 'cafe', 'profile'] },
    { canonical: 'Maytag', matches: ['maytag'] },
    { canonical: 'Frigidaire', matches: ['frigidaire', 'electrolux'] },
    { canonical: 'Samsung', matches: ['samsung'] },
    { canonical: 'LG', matches: ['lg', 'life good', "life's good"] },
    { canonical: 'Bosch', matches: ['bosch'] },
    { canonical: 'Kenmore', matches: ['kenmore'] },
];

export const MARKET_FLOOD_CATEGORIES = [
    'Washers',
    'Dryers',
    'Refrigerators',
    'Stoves & Ranges',
    'Dishwashers',
    'Washer & Dryer Sets',
] as const;

const CATEGORY_ALIASES: Array<{ canonical: string; matches: string[] }> = [
    { canonical: 'Washers', matches: ['washer', 'washing machine', 'top load', 'front load'] },
    { canonical: 'Dryers', matches: ['dryer', 'electric dryer', 'gas dryer'] },
    { canonical: 'Refrigerators', matches: ['refrigerator', 'fridge', 'freezer', 'french door', 'side by side'] },
    { canonical: 'Stoves & Ranges', matches: ['stove', 'range', 'oven', 'cooktop'] },
    { canonical: 'Dishwashers', matches: ['dishwasher', 'dish washer'] },
    { canonical: 'Washer & Dryer Sets', matches: ['washer dryer set', 'laundry set', 'washer and dryer'] },
];

function compactText(value: unknown): string {
    return String(value ?? '').trim().replace(/\s+/g, ' ');
}

export function normalizeBrand(value: unknown): string {
    const raw = compactText(value);
    const lower = raw.toLowerCase();
    if (!lower) return '';

    for (const entry of BRAND_ALIASES) {
        if (entry.matches.some((match) => lower === match || lower.includes(match))) {
            return entry.canonical;
        }
    }

    return raw.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function normalizeModel(value: unknown): string {
    return compactText(value).replace(/\s+/g, '').toUpperCase();
}

export function normalizeSerial(value: unknown): string {
    return compactText(value).replace(/\s+/g, '').toUpperCase();
}

export function normalizeCategory(value: unknown): string {
    const raw = compactText(value);
    const lower = raw.toLowerCase();
    if (!lower) return '';

    const direct = MARKET_FLOOD_CATEGORIES.find((category) => category.toLowerCase() === lower);
    if (direct) return direct;

    for (const entry of CATEGORY_ALIASES) {
        if (entry.matches.some((match) => lower.includes(match))) {
            return entry.canonical;
        }
    }

    return raw;
}

export function isKnownMarketFloodCategory(value: unknown): boolean {
    const normalized = normalizeCategory(value);
    return MARKET_FLOOD_CATEGORIES.some((category) => category === normalized);
}

export function parsePartNumbers(...values: Array<unknown>): string[] {
    const matches = new Set<string>();
    const partPattern = /\b(?:[A-Z]{1,5}\d[A-Z0-9-]{3,}|\d{3,}[A-Z][A-Z0-9-]*)\b/gi;

    for (const value of values) {
        const text = String(value ?? '');
        for (const match of text.matchAll(partPattern)) {
            matches.add(match[0].toUpperCase());
        }
    }

    return Array.from(matches);
}
