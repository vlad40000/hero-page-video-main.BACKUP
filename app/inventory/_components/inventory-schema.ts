
import { z } from 'zod';
import { ItemCondition } from '@/lib/inventory-types';

const numericString = z.preprocess((val) => {
    if (typeof val === 'string') {
        const cleaned = val.replace(/,/g, '').trim();
        if (cleaned === '') return undefined;
        return cleaned;
    }
    return val;
}, z.coerce.number().optional());

export const inventorySchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    brand: z.string().min(1, "Brand is required"),
    model: z.string().min(1, "Model is required"),
    serial: z.string().optional(),
    price: numericString.pipe(z.number().min(1, "Price must be at least $1")),
    originalPrice: numericString,
    ageMonths: numericString,
    category: z.string().min(1, "Category is required"),
    condition: z.nativeEnum(ItemCondition),
    description: z.string().optional(),
    seoKeywords: z.array(z.string()).optional(),
    imageUrl: z.string().url("Must be a valid cloud URL").nullable().or(z.literal('')),
    sources: z.array(z.object({ title: z.string(), uri: z.string() })).optional(),
    websiteParams: z.object({
        slug: z.string(),
        metaTitle: z.string(),
        metaDescription: z.string(),
    }).optional(),
});

export type InventoryFormValues = z.infer<typeof inventorySchema>;

export function mergeInventoryData(
    current: InventoryFormValues,
    incoming: Partial<InventoryFormValues>,
    dirtyFields: Record<string, boolean | undefined>
): InventoryFormValues {
    const result = { ...current };

    (Object.keys(incoming) as Array<keyof InventoryFormValues>).forEach(key => {
        const newValue = incoming[key];

        // Skip undefined values in incoming data
        if (newValue === undefined) return;

        // If field is dirty, skip overwrite (strict safety)
        if (dirtyFields[key]) return;

        // Otherwise overwrite
        // @ts-ignore - excessive typing checks for dynamic key assignment with heterogeneous values
        result[key] = newValue;
    });

    return result;
}
