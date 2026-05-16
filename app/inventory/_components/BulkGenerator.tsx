'use client';

/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { ItemStatus, MarketplaceListing, WebsiteParams } from '@/lib/inventory-types';
import { Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { generateBulkDescriptionsAction } from '@/lib/flood-engine/actions';
import { getDisplayUrl } from '@/lib/utils';
import { formatUsd } from '@/lib/money';
import type { ApplianceWarning, ListingPlacement } from '@/lib/appliance-intelligence/types';

interface BulkGeneratorProps {
    availableItems: MarketplaceListing[];
    onGenerated: (updates: { id: string, updates: Partial<MarketplaceListing> }[]) => void;
}

interface BulkCopyResult {
    id?: string;
    placement: ListingPlacement;
    title: string;
    description: string;
    seoKeywords: string[];
    websiteParams?: WebsiteParams;
    channelCopy?: string;
    warnings?: ApplianceWarning[];
}

const MAX_BULK_ITEMS = 50;
const PLACEMENTS: Array<{ value: ListingPlacement; label: string }> = [
    { value: 'website', label: 'Website' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'ebay', label: 'eBay' },
    { value: 'amazon', label: 'Amazon' },
];

const BulkGenerator: React.FC<BulkGeneratorProps> = ({ availableItems, onGenerated }) => {
    const generatorItems = availableItems.filter((item) => item.status !== ItemStatus.SOLD);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isGenerating, setIsGenerating] = useState(false);
    const [placement, setPlacement] = useState<ListingPlacement>('website');
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [warnings, setWarnings] = useState<ApplianceWarning[]>([]);
    const [channelCopies, setChannelCopies] = useState<BulkCopyResult[]>([]);

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else {
            if (next.size >= MAX_BULK_ITEMS) {
                setError(`Bulk generation is capped at ${MAX_BULK_ITEMS} items.`);
                return;
            }
            next.add(id);
        }
        setError(null);
        setSelectedIds(next);
    };

    const selectAll = () => {
        if (selectedIds.size === generatorItems.length || selectedIds.size === MAX_BULK_ITEMS) {
            setSelectedIds(new Set());
            return;
        }

        setSelectedIds(new Set(generatorItems.slice(0, MAX_BULK_ITEMS).map(i => i.id)));
        setError(generatorItems.length > MAX_BULK_ITEMS ? `Selected the first ${MAX_BULK_ITEMS} items.` : null);
    };

    const handleGenerate = async () => {
        if (selectedIds.size === 0) return;

        setIsGenerating(true);
        setError(null);
        setStatusMessage(null);
        setWarnings([]);
        setChannelCopies([]);

        try {
            const itemsToProcess = generatorItems.filter(i => selectedIds.has(i.id)).slice(0, MAX_BULK_ITEMS);
            const result = await generateBulkDescriptionsAction(itemsToProcess, placement);

            setWarnings(result.warnings || []);

            if (!result.success) {
                setError(result.error || 'Bulk listing generation failed.');
                return;
            }

            const results = result.data.items as BulkCopyResult[];

            if (placement === 'website') {
                const formattedUpdates = results.map((res) => {
                    if (!res.id) return null;

                    return {
                        id: res.id,
                        updates: {
                            title: res.title,
                            description: res.description,
                            seoKeywords: res.seoKeywords,
                            websiteParams: res.websiteParams
                        }
                    };
                }).filter(item => item !== null) as { id: string, updates: Partial<MarketplaceListing> }[];

                onGenerated(formattedUpdates);
                setStatusMessage(`Website copy applied to ${formattedUpdates.length} item(s).`);
            } else {
                setChannelCopies(results);
                setStatusMessage(`${PLACEMENTS.find((item) => item.value === placement)?.label} copy generated for ${results.length} item(s).`);
            }

            setSelectedIds(new Set());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bulk listing generation failed.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Bulk Listing Generator</h1>
                <p className="text-slate-500 mt-2">Select up to 50 existing units to generate marketplace-ready listing copy.</p>
            </header>

            {/* Selection Control Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={selectAll}
                        className="px-6 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        {selectedIds.size > 0 ? 'Deselect All' : 'Select Up To 50'}
                    </button>
                    <span className="text-sm font-medium text-slate-900">
                        <span className="font-bold">{selectedIds.size}</span> of {generatorItems.length} selected
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                        {PLACEMENTS.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => setPlacement(item.value)}
                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${placement === item.value
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <button
                        disabled={selectedIds.size === 0 || isGenerating}
                        onClick={handleGenerate}
                        className="bg-slate-200 text-slate-400 px-8 py-3 rounded-xl font-bold transition-all disabled:cursor-not-allowed flex items-center gap-2 enabled:bg-indigo-600 enabled:text-white enabled:shadow-lg enabled:shadow-indigo-100"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Zap size={18} className={selectedIds.size > 0 ? 'fill-white' : ''} />
                                Generate Listings
                            </>
                        )}
                    </button>
                </div>
            </div>

            {(error || statusMessage || warnings.length > 0) && (
                <div className="space-y-3">
                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                            {error}
                        </div>
                    )}
                    {statusMessage && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                            {statusMessage}
                        </div>
                    )}
                    {warnings.length > 0 && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            <p className="font-bold mb-2">Internal validation warnings</p>
                            <ul className="list-disc pl-5 space-y-1">
                                {warnings.slice(0, 8).map((warning, index) => (
                                    <li key={`${warning.code}-${index}`}>{warning.message}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {channelCopies.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                    <h2 className="text-lg font-bold text-slate-900">Generated Operator Copy</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {channelCopies.map((copy) => (
                            <div key={copy.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{copy.placement}</p>
                                    <h3 className="font-bold text-slate-900">{copy.title}</h3>
                                </div>
                                <textarea
                                    readOnly
                                    value={copy.channelCopy || copy.description}
                                    rows={8}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Grid of Product Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatorItems.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                        <div
                            key={item.id}
                            onClick={() => !isGenerating && toggleSelect(item.id)}
                            className={`bg-white rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-200 group relative ${isSelected ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-slate-100 hover:border-slate-200'
                                }`}
                        >
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src={getDisplayUrl(item.imageUrl) || ''}
                                    alt={item.title}
                                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                                    <span className="text-blue-600 font-bold">{formatUsd(item.price)}</span>
                                </div>
                                {isSelected && (
                                    <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center">
                                        <div className="bg-indigo-600 text-white rounded-full p-2 shadow-xl">
                                            <CheckCircle2 size={32} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{item.title}</h3>
                                        <p className="text-slate-400 text-sm font-medium">
                                            {item.brand} • {item.model}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${item.condition === 'excellent' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {item.condition}
                                    </span>
                                    <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">{item.category}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {generatorItems.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-400">
                        <AlertCircle className="mx-auto mb-3 opacity-20" size={64} />
                        <p className="text-lg">No inventory units found to list.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BulkGenerator;
