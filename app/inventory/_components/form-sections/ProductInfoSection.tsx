
import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Sparkles, Loader2, Wand2, Link as LinkIcon, Facebook, Globe, Zap } from 'lucide-react';
import { CATEGORIES } from '@/lib/flood-engine/constants';
import { ItemCondition } from '@/lib/inventory-types';
import { InventoryFormValues } from '../inventory-schema';
import { cn } from '@/lib/utils';

interface ProductInfoSectionProps {
    isRegenerating: boolean;
    isLookingUpSerial: boolean;
    serialLookupSources: { title: string; uri: string }[];
    onSerialLookup: () => void;
    onRegenerateDescription: () => void;
}

export const ProductInfoSection: React.FC<ProductInfoSectionProps> = ({
    isRegenerating,
    isLookingUpSerial,
    serialLookupSources,
    onSerialLookup,
    onRegenerateDescription,
}) => {
    const { register, watch, setValue, control, formState: { errors } } = useFormContext<InventoryFormValues>();
    const [activeView, setActiveView] = React.useState<'facebook' | 'seo'>('facebook');

    // Watch fields for conditional disabling
    const brand = watch('brand');
    const model = watch('model');
    const serial = watch('serial');
    const seoKeywords = watch('seoKeywords') || [];
    const condition = watch('condition');
    const isAnalyzing = isRegenerating; // Alias for UI consistency

    return (
        <div className="space-y-4">
            {/* Title */}
            <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Unit Title</label>
                <input
                    {...register('title')}
                    placeholder="e.g. LG Front Load Washer"
                    className={cn(
                        "w-full px-4 py-3 rounded-xl border focus:ring-4 outline-none transition-all font-medium",
                        errors.title ? "border-red-300 focus:border-red-500 focus:ring-red-100" : "border-slate-200 focus:ring-blue-500/10 focus:border-blue-600",
                        isAnalyzing && "bg-slate-50 border-slate-100 text-slate-400"
                    )}
                />
                {errors.title && <span className="text-[10px] text-red-500 mt-1 block">{errors.title.message}</span>}
                {isAnalyzing && <Sparkles className="absolute right-4 bottom-3.5 text-blue-400 animate-pulse" size={18} />}
            </div>

            {/* Brand & Model */}
            <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Brand</label>
                    <input
                        {...register('brand')}
                        disabled={isAnalyzing}
                        placeholder="LG"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    {errors.brand && <span className="text-[10px] text-red-500 mt-1 block">{errors.brand.message}</span>}
                </div>
                <div className="relative">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Model</label>
                    <input
                        {...register('model')}
                        disabled={isAnalyzing}
                        placeholder="WM3900HWA"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    {errors.model && <span className="text-[10px] text-red-500 mt-1 block">{errors.model.message}</span>}
                </div>
            </div>

            {/* Serial Number */}
            <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Serial Number</label>
                <div className="flex gap-2">
                    <input
                        {...register('serial')}
                        disabled={isAnalyzing}
                        placeholder="Required for age/pricing"
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    <button
                        type="button"
                        onClick={onSerialLookup}
                        disabled={!serial || !brand || isLookingUpSerial || isAnalyzing}
                        className="bg-indigo-600 text-white px-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLookingUpSerial ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                        <span className="hidden sm:inline">Auto-Fill</span>
                    </button>
                </div>
                {errors.serial && <span className="text-[10px] text-red-500 mt-1 block">{errors.serial.message}</span>}

                <div className="flex flex-col gap-1 mt-1.5 ml-1">
                    <p className="text-[10px] text-slate-400">Enter Serial & Brand to auto-detect Age & Original MSRP</p>
                    {serialLookupSources.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 items-center">
                            <LinkIcon size={10} />
                            <span className="font-bold">
                                {serialLookupSources.length} lookup reference{serialLookupSources.length === 1 ? "" : "s"} saved
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Category */}
            <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Category</label>
                <select
                    {...register('category')}
                    disabled={isAnalyzing}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none bg-white font-medium transition-all disabled:bg-slate-50"
                >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {/* Description / Content Views */}
            <div className="relative space-y-4">
                <div className="flex justify-between items-center">
                    <div className="bg-slate-100 p-1 rounded-xl flex gap-1 w-fit">
                        <button
                            type="button"
                            onClick={() => setActiveView('facebook')}
                            className={cn(
                                "py-2 px-6 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all",
                                activeView === 'facebook'
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Facebook size={16} /> Facebook Marketplace
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveView('seo')}
                            className={cn(
                                "py-2 px-6 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all",
                                activeView === 'seo'
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Globe size={16} /> Website SEO
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={onRegenerateDescription}
                        disabled={!brand || !model || isAnalyzing}
                        className="bg-slate-200 text-slate-400 px-6 py-2.5 rounded-xl font-bold transition-all disabled:cursor-not-allowed flex items-center gap-2 enabled:bg-indigo-600 enabled:text-white enabled:shadow-lg enabled:shadow-indigo-100 text-sm"
                    >
                        {isAnalyzing ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <Zap size={18} className={cn(brand && model && "fill-white")} />
                        )}
                        {isAnalyzing ? 'Generating...' : 'Generate Listings'}
                    </button>
                </div>

                {activeView === 'facebook' ? (
                    <div className="relative">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Main Description (Sales Copy)</label>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <textarea
                                    {...field}
                                    placeholder="e.g. Excellent condition washer, fully tested..."
                                    rows={12}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-medium resize-none text-sm leading-relaxed"
                                />
                            )}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Website Slug (URL)</label>
                            <input
                                {...register('websiteParams.slug')}
                                placeholder="lg-front-load-washer-wm3900hwa"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none bg-white font-medium text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">SEO Meta Title</label>
                            <input
                                {...register('websiteParams.metaTitle')}
                                placeholder="LG WM3900HWA Front Load Washer | Roadrunner Appliance"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none bg-white font-medium text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">SEO Meta Description</label>
                            <textarea
                                {...register('websiteParams.metaDescription')}
                                placeholder="Buy this LG WM3900HWA washer from Roadrunner Appliance. Fully tested with a 30-day warranty..."
                                rows={3}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none bg-white font-medium text-sm resize-none"
                            />
                        </div>
                    </div>
                )}
                {seoKeywords.length > 0 && (
                    <div className="mt-4">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Hidden Search Keywords (Meta Tags)</label>
                        <div className="flex flex-wrap gap-2">
                            {seoKeywords.map((k, i) => (
                                <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-bold">
                                    {k}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Condition */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Condition</label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {Object.values(ItemCondition).map((cond) => (
                        <label
                            key={cond}
                            className={cn(
                                "py-2 px-3 text-[10px] rounded-xl border font-bold transition-all uppercase tracking-tighter cursor-pointer text-center",
                                condition === cond
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-500'
                            )}
                        >
                            <input
                                type="radio"
                                value={cond}
                                {...register('condition')}
                                className="hidden"
                            />
                            {cond.replace('-', ' ')}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};
