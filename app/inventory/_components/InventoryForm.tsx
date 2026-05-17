
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { X, Boxes, AlertTriangle } from 'lucide-react';
import { LoadingLogo } from '@/components/LoadingLogo';

import { MarketplaceListing, ItemCondition } from '@/lib/inventory-types';
import { analyzeProductImageAction, lookupApplianceSpecsAction, analyzeListingPhotoAction, generateDescriptionAction } from '@/lib/flood-engine/actions';
import { logToServer } from '@/lib/inventory-actions';
import { calculateResaleValue } from '@/lib/flood-engine/services/pricingEngine';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/lib/flood-engine/constants';
import { validateMarketFloodInput } from '@/lib/appliance-intelligence/market-flood';
import type { MarketFloodValidationResult } from '@/lib/appliance-intelligence/types';

import { inventorySchema, InventoryFormValues, mergeInventoryData } from './inventory-schema';
import { ImageUploadSection } from './form-sections/ImageUploadSection';
import { ProductInfoSection } from './form-sections/ProductInfoSection';
import { PricingSection } from './form-sections/PricingSection';

interface InventoryFormProps {
    initialData?: MarketplaceListing;
    items?: MarketplaceListing[];
    onSubmit: (data: Partial<MarketplaceListing>) => void | Promise<void>;
    onClose: () => void;
}

async function enhanceInventoryImage(cloudUrl: string) {
    const response = await fetch("/api/image-enhance", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            imageUrl: cloudUrl,
            useCase: "inventory_listing_photo",
        }),
    });

    if (!response.ok) {
        return {
            originalImageUrl: cloudUrl,
            finalImageUrl: cloudUrl,
            status: "passthrough" as const,
        };
    }

    const result = await response.json();

    return {
        originalImageUrl: result.originalImageUrl || cloudUrl,
        finalImageUrl:
            result.finalImageUrl ||
            result.enhancedImageUrl ||
            result.backgroundRemovedImageUrl ||
            cloudUrl,
        status: result.status || "processed",
    };
}

const InventoryForm: React.FC<InventoryFormProps> = ({ initialData, items = [], onSubmit, onClose }) => {
    // Initialize Form
    const methods = useForm<InventoryFormValues>({
        resolver: zodResolver(inventorySchema),
        defaultValues: {
            title: initialData?.title || '',
            brand: initialData?.brand || '',
            model: initialData?.model || '',
            serial: initialData?.serial || '',
            price: initialData?.price && initialData.price > 0 ? initialData.price : undefined,
            originalPrice: initialData?.originalPrice || undefined,
            ageMonths: initialData?.ageMonths || undefined,
            category: initialData?.category || CATEGORIES[0],
            condition: initialData?.condition || ItemCondition.EXCELLENT,
            description: initialData?.description || '',
            seoKeywords: initialData?.seoKeywords || [],
            imageUrl: initialData?.imageUrl || '',
            sources: initialData?.sources || [],
            websiteParams: initialData?.websiteParams,
        },

        mode: 'onBlur',
    });

    const { handleSubmit, watch, setValue, formState: { isSubmitting, dirtyFields } } = methods;

    // Local UI State
    const [productImage, setProductImage] = useState<string | null>(initialData?.imageUrl || null);
    const [nameplateImage, setNameplateImage] = useState<string | null>(null);
    const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
    const [isAnalyzingNameplate, setIsAnalyzingNameplate] = useState(false);
    const [photoAnalysisResult, setPhotoAnalysisResult] = useState<{ isMatch: boolean, reasoning: string, conditionReasoning: string } | null>(null);
    const [isLookingUpSerial, setIsLookingUpSerial] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [duplicateItem, setDuplicateItem] = useState<MarketplaceListing | null>(null);
    const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
    const [decoderResult, setDecoderResult] = useState<any | null>(null); // Store decoder result
    const [marketFloodValidation, setMarketFloodValidation] = useState<MarketFloodValidationResult | null>(null);

    // Request IDs for stale response protection
    const requestIds = useRef({
        photo: 0,
        nameplate: 0,
        serial: 0,
        description: 0
    });

    // Watch values for side effects
    const brand = watch('brand');
    const model = watch('model');
    const serial = watch('serial');
    const condition = watch('condition');
    const category = watch('category');
    const originalPrice = watch('originalPrice');
    const ageMonths = watch('ageMonths');
    const sources = watch('sources'); // Watch sources for updates from serial lookup

    // Duplicate Check Effect
    useEffect(() => {
        if (!initialData && model && serial && items.length > 0) {
            const match = items.find(i =>
                i.model?.toLowerCase() === model.toLowerCase() &&
                i.serial?.toLowerCase() === serial.toLowerCase()
            );
            setDuplicateItem(match || null);
        } else {
            setDuplicateItem(null);
        }
    }, [model, serial, items, initialData]);

    // Pricing Engine Effect
    useEffect(() => {
        // Ensure values are numbers (RHF handles coercion but safe to check)
        const p0 = Number(originalPrice);
        const age = Number(ageMonths);

        if (p0 > 0 && age >= 0 && brand) {
            const result = calculateResaleValue({
                p0,
                ageMonths: age,
                brand: brand,
                condition: condition
            });
            setSuggestedPrice(Math.round(result.finalPrice));
        } else {
            setSuggestedPrice(null);
        }
    }, [originalPrice, ageMonths, brand, condition]);

    // Handlers
    const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const id = ++requestIds.current.photo;
            setIsAnalyzingPhoto(true);
            setPhotoAnalysisResult(null);

            // 1) Instant local preview (NOT persisted)
            const localPreview = URL.createObjectURL(file);
            setProductImage(localPreview);

            // 2) Upload to Blob
            await logToServer("[IMAGE-STAB] Starting background cloud upload", { name: file.name, size: file.size });

            const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
                method: "POST",
                body: file,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.error || response.statusText);
            }

            const blobData = await response.json();
            const cloudUrl = blobData?.url;

            if (!cloudUrl || typeof cloudUrl !== "string" || !cloudUrl.startsWith("http")) {
                throw new Error("Upload succeeded but no valid cloud URL returned.");
            }

            await logToServer("[IMAGE-STAB] Cloud upload success", { cloudUrl });

            // 3) Process the uploaded image through the provider-neutral inventory pipeline.
            await logToServer("[IMAGE-STAB] Starting image processing", { cloudUrl });

            const enhanced = await enhanceInventoryImage(cloudUrl);
            const finalImageUrl = enhanced.finalImageUrl;

            setValue("imageUrl", finalImageUrl, { shouldDirty: true, shouldValidate: true });
            setProductImage(finalImageUrl);

            // 4) Analyze only after the final inventory image URL exists.
            await logToServer("[IMAGE-STAB] Starting Market Flood listing analysis", {
                originalImageUrl: cloudUrl,
                finalImageUrl,
            });

            const analysis = await analyzeListingPhotoAction(finalImageUrl, brand, model);

            if (id !== requestIds.current.photo) return;

            if (Object.values(ItemCondition).includes(analysis.condition as ItemCondition)) {
                setValue("condition", analysis.condition as ItemCondition, { shouldDirty: true });
            }

            setPhotoAnalysisResult({
                isMatch: analysis.isMatch,
                reasoning: analysis.matchReasoning,
                conditionReasoning: analysis.conditionReasoning,
            });

            toast.success("Image uploaded and analyzed");
        } catch (error) {
            console.error("Image processing failed:", error);
            const message = error instanceof Error ? error.message : "Unknown error";
            await logToServer("[IMAGE-STAB] FULL FAILURE", { message });
            toast.error(`Image failure: ${message}`);
        } finally {
            setIsAnalyzingPhoto(false);
            // allow re-selecting same file
            e.target.value = "";
        }
    };

    const handleNameplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const id = ++requestIds.current.nameplate;
            setIsAnalyzingNameplate(true);

            // 1. Local preview (transient)
            const localPreview = URL.createObjectURL(file);
            setNameplateImage(localPreview);

            // 2. Background Upload
            await logToServer("[IMAGE-STAB] Nameplate: Starting background upload", { name: file.name });
            const response = await fetch(`/api/upload?filename=nameplate_${encodeURIComponent(file.name)}`, {
                method: 'POST',
                body: file,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.error || response.statusText);
            }

            const blobData = await response.json();
            const cloudUrl = blobData.url;
            await logToServer("[IMAGE-STAB] Nameplate: Upload success", { cloudUrl });

            // 3. Trigger Analysis using the URL
            const productData = await analyzeProductImageAction(cloudUrl);

            if (id !== requestIds.current.nameplate) return;
            setNameplateImage(cloudUrl); // Switch to permanent cloud URL

            // Prepare incoming data
            const incoming: Partial<InventoryFormValues> = {
                title: productData.title,
                brand: productData.brand,
                model: productData.model,
                serial: productData.serial,
                price: productData.price ? parseFloat(productData.price.toString()) : undefined, // Ensure number
                description: productData.description,
                websiteParams: productData.websiteParams,
                seoKeywords: productData.seoKeywords || [],
            };

            // Handle Category matching
            const matchedCategory = CATEGORIES.find(c => c.toLowerCase() === productData.category?.toLowerCase());
            if (matchedCategory) incoming.category = matchedCategory;

            // Merge safely
            const currentValues = methods.getValues();
            // We pass dirtyFields which is a proxy, we need to convert to record or just rely on RHF structure?
            // dirtyFields is generic structure. Our helper expects Record<string, boolean>.
            // RHF dirtyFields is { fieldName: true }.
            // @ts-ignore - straightforward mapping
            const cleanDirtyFields: Record<string, boolean | undefined> = dirtyFields;

            const merged = mergeInventoryData(currentValues, incoming, cleanDirtyFields);

            // Apply updates
            Object.entries(merged).forEach(([key, value]) => {
                if (value !== undefined) {
                    // @ts-ignore
                    setValue(key as keyof InventoryFormValues, value, { shouldValidate: true, shouldDirty: true });
                }
            });

            toast.success("Nameplate scanned and form updated");

        } catch (error) {
            console.error("Nameplate analysis failed:", error);
            toast.error("Failed to analyze nameplate");
        } finally {
            setIsAnalyzingNameplate(false);
        }
    };

    const handleSerialLookup = async () => {
        if (!brand || !serial || !model) return;  // require model too — prevents bad API calls

        try {
            const id = ++requestIds.current.serial;
            setIsLookingUpSerial(true);
            setDecoderResult(null); // Reset

            // Call Action - returns { msrp, ageMonths, notes, sources, decoderResult }
            const specs: any = await lookupApplianceSpecsAction(brand, model, serial);

            if (id !== requestIds.current.serial) return;

            // --- DECODER PROTOCOL HANDLING ---
            if (specs.decoderResult) {
                setDecoderResult(specs.decoderResult);

                // GUARDRAIL: If AI returned an age but it conflicts with remainingCandidates?
                // The specs.ageMonths is what is used. 
                // We trust the decoder result which is already passed through the service logic.
            }

            const incoming: Partial<InventoryFormValues> = {};
            if (specs.msrp > 0) incoming.originalPrice = specs.msrp;
            if (specs.ageMonths > 0) incoming.ageMonths = specs.ageMonths;
            if (specs.sources) incoming.sources = specs.sources;

            // Apply updates (bypass dirtyFields check for explicit Auto-Fill)
            const currentValues = methods.getValues();

            // We intentionally ignore dirtyFields here because this is a deliberate user action (clicking Auto-Fill)
            // that should overwrite current values.
            const merged = mergeInventoryData(currentValues, incoming, {});

            Object.entries(merged).forEach(([key, value]) => {
                if (value !== undefined) {
                    // @ts-ignore
                    setValue(key as keyof InventoryFormValues, value, { shouldValidate: true, shouldDirty: true });
                }
            });

            // Trigger auto-description if we got new specs
            await handleRegenerateDescription(true); // Force regenerate? Original code did force safe regen.
            toast.success("Serial lookup complete");

        } catch (error) {
            console.error("Serial lookup failed:", error);
            toast.error("Serial lookup failed");
        } finally {
            setIsLookingUpSerial(false);
        }
    };

    const handleRegenerateDescription = async (force: boolean = false) => {
        console.log("[Form] handleRegenerateDescription trigger, force:", force);
        // Guard: check if description is dirty (user edited) and we are not forcing
        if (!force && dirtyFields.description) {
            console.log("[Form] Skipping generation: field is dirty and not forced");
            return; // Don't overwrite user work automatically
        }

        // Manual trigger (button click) implies force=undefined (or true logic if we pass explicit true)
        // But from button click, event is passed.
        // If called from button, force is likely event object, effectively true-ish? No check signature.

        // Let's refine signature to be clear.
        // Wrapper for button click: () => handleRegenerateDescription(true)

        // Requirements for generation
        const currentBrand = methods.getValues('brand');
        const currentModel = methods.getValues('model');
        const currentCategory = methods.getValues('category');
        const currentCondition = methods.getValues('condition');
        const currentSpecs = {
            originalPrice: methods.getValues('originalPrice'),
            ageMonths: methods.getValues('ageMonths'),
            price: methods.getValues('price'),
            title: methods.getValues('title'),
            imageUrl: methods.getValues('imageUrl'),
            description: methods.getValues('description'),
        };

        console.log("[Form] Generation data:", { currentBrand, currentModel, currentCategory, currentCondition, currentSpecs });

        if (!currentBrand || !currentModel) {
            console.warn("[Form] Generation aborted: Missing brand or model");
            return;
        }

        try {
            const id = ++requestIds.current.description;
            setIsRegenerating(true);
            const descResult = await generateDescriptionAction(
                currentBrand,
                currentModel,
                currentCategory,
                currentCondition,
                currentSpecs,
                'website'
            );

            if (id !== requestIds.current.description) return;

            if (!descResult.success) {
                toast.error(descResult.error || "Description generation failed");
                return;
            }

            setMarketFloodValidation({
                normalized: { brand: '', model: '', serial: '', category: '', partNumbers: [] },
                hardInvalids: [],
                canSubmit: true,
                canGenerate: true,
                warnings: descResult.warnings || [],
                provenance: descResult.provenance || [],
                confidence: descResult.confidence || { score: 0, level: 'low' },
            });

            const desc = descResult.data;

            if (desc && desc.description && desc.description.length > 10) {
                // Only overwrite title if it's currently generic or empty
                const currentTitle = methods.getValues('title');
                if (!currentTitle || currentTitle.length < 5 || !methods.getFieldState('title').isDirty) {
                    setValue('title', desc.title, { shouldValidate: true, shouldDirty: true });
                }

                setValue('description', desc.description, { shouldValidate: true, shouldDirty: true });
                setValue('seoKeywords', desc.seoKeywords, { shouldValidate: true, shouldDirty: true });
                if (desc.websiteParams) {
                    setValue('websiteParams', desc.websiteParams, { shouldValidate: true, shouldDirty: true });
                }
                // Force RHF to re-render the fields
                methods.trigger(['title', 'description', 'seoKeywords', 'websiteParams']);
                toast.success("Listing content generated");
            } else {
                console.warn("AI returned empty or short description:", desc);
                toast.error("AI returned an incomplete description. Please try again.");
            }
        } catch (error) {
            console.error("Auto description failed:", error);
            toast.error("Description generation failed");
        } finally {
            setIsRegenerating(false);
        }
    };

    // Auto-gen effect debounced? 
    // Original code had generic effect. 
    // Plan says "Async Logic: Race Condition Guard... Disable ONLY related fields".
    // "Implement handleAutoFill with setValue".
    // The "Regenerate" button handles description.
    // Did original code auto-generate description on field change?
    // Yes: "Reactive Auto-Generation useEffect... debounce 800ms".
    // I should probably keep this feature.
    // Proactive generation removed as it's unreliable during typing.
    // Generation now only happens:
    // 1. Manually via "Regenerate" button
    // 2. Automatically ONLY after a successful Serial Lookup (handleSerialLookup)


    const onFormSubmit = async (data: InventoryFormValues) => {
        try {
            const validation = validateMarketFloodInput(
                {
                    id: initialData?.id,
                    title: data.title,
                    brand: data.brand,
                    model: data.model,
                    serial: data.serial,
                    category: data.category,
                    condition: data.condition,
                    price: data.price,
                    originalPrice: data.originalPrice,
                    ageMonths: data.ageMonths,
                    imageUrl: data.imageUrl,
                    imageUploadState: isAnalyzingPhoto || isAnalyzingNameplate
                        ? 'uploading'
                        : productImage?.startsWith('blob:')
                            ? 'local-preview'
                            : 'ready',
                },
                {
                    mode: 'submit',
                    priceReference: suggestedPrice !== null
                        ? { suggestedPrice, source: 'flood-engine.pricingEngine' }
                        : undefined,
                }
            );

            setMarketFloodValidation(validation);

            if (!validation.canSubmit) {
                toast.error(validation.hardInvalids[0]?.message || "Inventory item is not ready to save");
                return;
            }

            if (validation.warnings.length > 0) {
                toast.warning("Saved with Market Flood validation warnings");
            }

            await onSubmit(data); // data is typed
            toast.success(initialData ? "Unit updated successfully" : "Unit saved successfully");
            onClose();
        } catch (error) {
            console.error("Submit failed", error);
            toast.error(error instanceof Error ? error.message : "Failed to save unit");
        }

    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full md:max-w-lg md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in duration-200 h-[92vh] md:h-auto md:max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                        <Boxes className="text-indigo-600" size={24} />
                        {initialData ? 'Edit Unit' : 'New Unit'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onFormSubmit, (errors) => logToServer('VALIDATION ERRORS', errors))} className="p-6 space-y-6 overflow-y-auto pb-safe">

                        <ImageUploadSection
                            productImage={productImage}
                            nameplateImage={nameplateImage}
                            isAnalyzingProduct={isAnalyzingPhoto}
                            isAnalyzingNameplate={isAnalyzingNameplate}
                            photoAnalysisResult={photoAnalysisResult}
                            onProductImageUpload={handleProductImageUpload}
                            onNameplateImageUpload={handleNameplateUpload}
                        />

                        {duplicateItem && (
                            <div className="p-4 rounded-xl border bg-amber-50 border-amber-200 flex gap-3 animate-pulse">
                                <div className="shrink-0">
                                    <AlertTriangle className="text-amber-600" size={20} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
                                        Duplicate Detected
                                    </p>
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        An item with this model and serial already exists. Saving will <strong>update</strong> the existing listing instead of creating a new one.
                                    </p>
                                </div>
                            </div>
                        )}

                        {marketFloodValidation && (marketFloodValidation.hardInvalids.length > 0 || marketFloodValidation.warnings.length > 0) && (
                            <div className={cn(
                                "p-4 rounded-xl border flex gap-3",
                                marketFloodValidation.hardInvalids.length > 0
                                    ? "bg-red-50 border-red-200"
                                    : "bg-amber-50 border-amber-200"
                            )}>
                                <div className="shrink-0">
                                    <AlertTriangle
                                        className={marketFloodValidation.hardInvalids.length > 0 ? "text-red-600" : "text-amber-600"}
                                        size={20}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <p className={cn(
                                            "text-xs font-bold uppercase tracking-wide",
                                            marketFloodValidation.hardInvalids.length > 0 ? "text-red-800" : "text-amber-800"
                                        )}>
                                            Market Flood Internal Validation
                                        </p>
                                        <p className="text-xs text-slate-600">
                                            Confidence {marketFloodValidation.confidence.score}/100 ({marketFloodValidation.confidence.level})
                                        </p>
                                    </div>
                                    <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1">
                                        {[...marketFloodValidation.hardInvalids, ...marketFloodValidation.warnings].slice(0, 5).map((issue, index) => (
                                            <li key={`${issue.code}-${index}`}>{issue.message}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <ProductInfoSection
                                isRegenerating={isRegenerating}
                                isLookingUpSerial={isLookingUpSerial}
                                serialLookupSources={sources || []}
                                onSerialLookup={handleSerialLookup}
                                onRegenerateDescription={() => handleRegenerateDescription(true)}
                            />

                            {/* --- DECODER PROVENANCE PANEL --- */}
                            {decoderResult && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm mt-2">
                                    <details className="group">
                                        <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-slate-700">
                                            <div className="flex items-center gap-2">
                                                <span>Manufacture Date Provenance</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${decoderResult.confidence === 'Evidence High' ? 'bg-green-100 text-green-700' :
                                                    decoderResult.confidence === 'Heuristic Medium' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {decoderResult.confidence}
                                                </span>
                                            </div>
                                            <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                                        </summary>
                                        <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                                            {decoderResult.selectedYear && (
                                                <div>
                                                    <span className="text-slate-500 text-xs block mb-1">Detected Manufacture Date</span>
                                                    <div className="font-mono font-bold text-slate-900 border-l-2 border-indigo-500 pl-2 bg-white py-1">
                                                        {decoderResult.monthOrWeek?.unit === 'month' ?
                                                            new Date(0, decoderResult.monthOrWeek.value - 1).toLocaleString('default', { month: 'long' }) :
                                                            `Week ${decoderResult.monthOrWeek?.value}`} {decoderResult.selectedYear}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-[10px] text-slate-400 italic">
                                                Resolution: {decoderResult.resolutionReason}
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            )}
                        </div>

                        <PricingSection
                            suggestedPrice={suggestedPrice}
                            onApplySuggestedPrice={(price) => setValue('price', price, { shouldValidate: true, shouldDirty: true })}
                        />

                        <div className="flex items-center gap-4 mt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={cn(
                                    "flex-1 py-4 rounded-2xl font-bold shadow-xl transition-all sticky bottom-0 disabled:cursor-not-allowed",
                                    duplicateItem
                                        ? "bg-amber-600 text-white shadow-amber-100 hover:bg-amber-700 disabled:bg-amber-300"
                                        : "bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700 disabled:bg-blue-300"
                                )}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <LoadingLogo size={22} label="Saving unit" />
                                        <span>Saving to DB...</span>
                                    </div>
                                ) : (
                                    initialData ? "Update Unit" : (duplicateItem ? "Update Existing Unit" : "Save Inventory Unit")
                                )}
                            </button>
                            <span className="text-[10px] font-mono text-slate-300 rotate-90">SYNC_v5</span>
                        </div>

                    </form>
                </FormProvider>
            </div>
        </div>
    );
};

export default InventoryForm;
