'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, PackageSearch, RefreshCw, Save, Search, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { generatePartDescriptionAction } from '@/lib/flood-engine/actions';

type CatalogPartRow = {
    canonicalPartNumber: string;
    rawPartNumber: string;
    canonicalPartName: string;
    description: string | null;
    normalizedCategory: string | null;
    normalizedSection: string | null;
    observedModels: string[];
    latestPriceCents: number | null;
    priceCurrency: string;
    imageUrl: string | null;
    brand: string | null;
    updatedAt: string | null;
};

type CatalogResponse = {
    success: boolean;
    parts?: CatalogPartRow[];
    error?: string;
};

function formatPartPrice(cents: number | null, currency: string) {
    if (typeof cents !== 'number' || !Number.isFinite(cents)) return 'No price';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
    }).format(cents / 100);
}

function defaultDescription(part: CatalogPartRow) {
    const modelText = part.observedModels.length
        ? ` Observed on model searches including ${part.observedModels.slice(0, 4).join(', ')}.`
        : '';
    return `${part.canonicalPartNumber} is cataloged as ${part.canonicalPartName || 'an appliance part'}.${modelText} Confirm fitment before purchase or installation.`;
}

export default function PartsCatalogInventory() {
    const [parts, setParts] = useState<CatalogPartRow[]>([]);
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [savingPartNumber, setSavingPartNumber] = useState<string | null>(null);
    const [generatingPartNumber, setGeneratingPartNumber] = useState<string | null>(null);

    const loadParts = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/tools/parts/catalog-sync?limit=all&status=all', {
                cache: 'no-store',
            });
            const payload = (await response.json()) as CatalogResponse;

            if (!response.ok || !payload.success) {
                throw new Error(payload.error || 'Could not load parts catalog.');
            }

            const nextParts = payload.parts || [];
            setParts(nextParts);
            setDrafts(
                Object.fromEntries(
                    nextParts.map((part) => [
                        part.canonicalPartNumber,
                        part.description || '',
                    ]),
                ),
            );
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not load parts catalog.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadParts();
    }, []);

    const visibleParts = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return parts;

        return parts.filter((part) =>
            [
                part.canonicalPartNumber,
                part.rawPartNumber,
                part.canonicalPartName,
                part.description || '',
                part.normalizedCategory || '',
                part.normalizedSection || '',
                ...part.observedModels,
            ]
                .join(' ')
                .toLowerCase()
                .includes(needle),
        );
    }, [parts, query]);

    const saveDescription = async (part: CatalogPartRow) => {
        const nextDescription = drafts[part.canonicalPartNumber] || '';
        setSavingPartNumber(part.canonicalPartNumber);

        try {
            const response = await fetch('/api/tools/parts/catalog-sync', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partNumber: part.canonicalPartNumber,
                    description: nextDescription,
                }),
            });
            const payload = (await response.json()) as { success: boolean; part?: CatalogPartRow; error?: string };

            if (!response.ok || !payload.success || !payload.part) {
                throw new Error(payload.error || 'Could not save part description.');
            }

            const savedPart = payload.part;
            setParts((current) =>
                current.map((item) =>
                    item.canonicalPartNumber === savedPart.canonicalPartNumber ? savedPart : item,
                ),
            );
            setDrafts((current) => ({
                ...current,
                [savedPart.canonicalPartNumber]: savedPart.description || '',
            }));
            toast.success('Part description saved.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not save part description.');
        } finally {
            setSavingPartNumber(null);
        }
    };

    const generateDescription = async (part: CatalogPartRow) => {
        setGeneratingPartNumber(part.canonicalPartNumber);

        try {
            const result = await generatePartDescriptionAction({
                partNumber: part.canonicalPartNumber,
                partName: part.canonicalPartName,
                brand: part.brand || undefined,
                category: part.normalizedCategory || undefined,
                section: part.normalizedSection || undefined,
                observedModels: part.observedModels,
                price: typeof part.latestPriceCents === 'number' ? part.latestPriceCents / 100 : undefined,
                imageUrl: part.imageUrl,
                description: drafts[part.canonicalPartNumber] || part.description || undefined,
            }, 'website');

            if (!result.success) {
                throw new Error(result.error || 'Could not generate part description.');
            }

            const generated = result.data.description?.trim();
            if (!generated || generated.length < 10) {
                throw new Error('Generated description was too short.');
            }

            setDrafts((current) => ({
                ...current,
                [part.canonicalPartNumber]: generated,
            }));
            toast.success('Part description generated. Review and save it.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not generate part description.');
        } finally {
            setGeneratingPartNumber(null);
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-wide text-indigo-600">Parts inventory</p>
                    <h1 className="mt-2 text-2xl font-bold text-slate-900">Parts Catalog Descriptions</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        Add customer-facing descriptions for part catalog entries using the same inventory workflow as whole machines.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={loadParts}
                    disabled={loading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search part number, name, model, category, or description..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm font-medium outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        Loading parts catalog
                    </div>
                </div>
            ) : visibleParts.length === 0 ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-center">
                    <PackageSearch className="h-10 w-10 text-slate-300" />
                    <p className="mt-4 text-sm font-bold text-slate-600">No parts matched your search.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {visibleParts.map((part) => {
                        const draft = drafts[part.canonicalPartNumber] ?? '';
                        const savedDescription = part.description || '';
                        const hasChanges = draft.trim() !== savedDescription.trim();
                        const isSaving = savingPartNumber === part.canonicalPartNumber;
                        const isGenerating = generatingPartNumber === part.canonicalPartNumber;

                        return (
                            <section
                                key={part.canonicalPartNumber}
                                className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[220px_minmax(0,1fr)]"
                            >
                                <div className="space-y-3">
                                    <div className="flex h-32 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                        {part.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={part.imageUrl} alt="" className="h-full w-full object-contain p-2" />
                                        ) : (
                                            <PackageSearch className="h-9 w-9 text-slate-300" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-mono text-sm font-black text-slate-900">{part.canonicalPartNumber}</p>
                                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                                            {formatPartPrice(part.latestPriceCents, part.priceCurrency)}
                                        </p>
                                    </div>
                                    <a
                                        href={`/parts/${encodeURIComponent(part.canonicalPartNumber)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                    >
                                        View public part
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900">{part.canonicalPartName || 'Appliance part'}</h2>
                                        <p className="mt-1 text-xs font-semibold text-slate-500">
                                            {[part.normalizedCategory, part.normalizedSection, part.observedModels.slice(0, 3).join(', ')]
                                                .filter(Boolean)
                                                .join(' / ') || 'No category context yet'}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            Public catalog description
                                        </label>
                                        <textarea
                                            value={draft}
                                            onChange={(event) =>
                                                setDrafts((current) => ({
                                                    ...current,
                                                    [part.canonicalPartNumber]: event.target.value,
                                                }))
                                            }
                                            placeholder={defaultDescription(part)}
                                            rows={5}
                                            className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium leading-6 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-xs text-slate-500">
                                            Generate uses the same Market Flood flow as whole-machine descriptions.
                                        </p>
                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            <button
                                                type="button"
                                                onClick={() => generateDescription(part)}
                                                disabled={isGenerating || isSaving}
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                                            >
                                                <Zap className="h-4 w-4" />
                                                {isGenerating ? 'Generating...' : 'Generate'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => saveDescription(part)}
                                                disabled={!hasChanges || isSaving || isGenerating}
                                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                                            >
                                                <Save className="h-4 w-4" />
                                                {isSaving ? 'Saving...' : 'Save Description'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
