import { ItemCondition } from './inventory-types';

/**
 * Ensures a brand name does not repeat at the start of a title or model string.
 * This prevents redundancy when assembling component parts (e.g. "Whirlpool" + "Whirlpool Washer").
 * Example: ensureBrandNotRepeated("Whirlpool", "Whirlpool Washer") -> "Washer"
 */
export function ensureBrandNotRepeated(brand: string | undefined, text: string | undefined): string {
    if (!text) return "";
    if (!brand || brand.toLowerCase() === 'unknown') return text.trim();

    const brandPart = brand.trim();
    const brandLower = brandPart.toLowerCase();
    const textLower = text.toLowerCase().trim();

    if (textLower.startsWith(brandLower)) {
        // Extract the part after the brand
        let afterBrand = text.substring(brandPart.length).trim();
        // Remove leading hyphen, space, or colon that might separate brand from model
        afterBrand = afterBrand.replace(/^[:\-\s]+/, '');

        // If we emptied the string (e.g. text was just the brand name), return original
        return afterBrand || text.trim();
    }

    return text.trim();
}


/**
 * Maps category values from the employee inventory system to database schema values
 */
export function mapCategoryToDatabase(category: string): string {
    const mapping: Record<string, string> = {
        'washers': 'washers',
        'dryers': 'dryers',
        'refrigerators': 'refrigerators',
        'stoves & ranges': 'stoves-ovens',
        'stoves': 'stoves-ovens',
        'ovens': 'stoves-ovens',
        'ranges': 'stoves-ovens',
        'dishwashers': 'dishwashers',
        'ice machines': 'dishwashers',
        'microwaves': 'dishwashers',
        'washer & dryer sets': 'packages',
        'packages': 'packages'
    };
    if (!category) return 'refrigerators';
    return mapping[category.toLowerCase()] || 'refrigerators';
}

/**
 * Maps database category values back to UI labels
 */
export function mapDatabaseToCategory(dbCategory: string): string {
    const mapping: Record<string, string> = {
        'washers': 'Washers',
        'dryers': 'Dryers',
        'refrigerators': 'Refrigerators',
        'stoves-ovens': 'Stoves & Ranges',
        'dishwashers': 'Dishwashers',
        'packages': 'Washer & Dryer Sets'
    };
    return mapping[dbCategory] || 'Refrigerators';
}

/**
 * Maps ItemCondition enum to database condition values
 */
export function mapConditionToDatabase(condition: ItemCondition): string {
    const mapping: Record<ItemCondition, string> = {
        [ItemCondition.NEW]: 'Like New',
        [ItemCondition.LIKE_NEW]: 'Like New',
        [ItemCondition.EXCELLENT]: 'Excellent',
        [ItemCondition.GOOD]: 'Good',
        [ItemCondition.FAIR]: 'Scratch & Dent'
    };
    return mapping[condition] || 'Good';
}

/**
 * Generates a deterministic URL-friendly slug from brand, model, and optionally serial.
 * NEVER uses Math.random() — that caused duplicate rows on every update for no-serial items.
 * For editing existing items, always prefer the stored slug over regenerating.
 */
export function generateSlug(brand: string, model: string, serial?: string, _location: string = 'hemingway-sc'): string {
    const cleanBrand = (brand || 'appliance').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cleanModel = (model || 'unit').toLowerCase().replace(/[^a-z0-9]+/g, '-');

    let slugBase = `${cleanBrand}-${cleanModel}`;

    if (serial) {
        const cleanSerial = serial.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        slugBase = `${slugBase}-${cleanSerial}`;
    } else {
        // If no serial, add a deterministic suffix based on the name length to prevent 
        // total collision while remaining stable across re-renders/syncs.
        const hash = (brand.length + model.length).toString(36);
        slugBase = `${slugBase}-${hash}`;
    }

    return slugBase
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}
