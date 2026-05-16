'use client';

/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { useInventoryContext } from '../layout';
import { Copy, Check, ChevronRight, ChevronLeft, Send, Code, Globe, Facebook, LayoutTemplate } from 'lucide-react';
import { ItemStatus } from '@/lib/inventory-types';
import { formatUsd } from '@/lib/money';

export default function SidecarPage() {
    const { items, updateItemStatus } = useInventoryContext();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [mode, setMode] = useState<'facebook' | 'website'>('facebook');

    const readyItems = items.filter(i => i.status !== 'sold');
    const currentItem = readyItems[currentIndex];

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 1500);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const copyAll = async () => {
        if (!currentItem) return;
        const allText = `Title: ${currentItem.title}\n\nPrice: ${formatUsd(currentItem.price)}\n\nDescription:\n${currentItem.description}`;
        await copyToClipboard(allText, 'all');
    };

    const copyHTML = async () => {
        if (!currentItem) return;
        const html = `
<div style="border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; max-width:400px; font-family:sans-serif;">
  <img src="${currentItem.imageUrl || ''}" alt="${currentItem.title}" style="width:100%; height:auto; display:block;">
  <div style="padding:16px;">
    <h3 style="margin:0 0 8px 0; color:#1e293b; font-size:18px;">${currentItem.title}</h3>
    <div style="color:#2563eb; font-weight:bold; font-size:20px; margin-bottom:12px;">${formatUsd(currentItem.price)}</div>
    <p style="color:#475569; font-size:14px; line-height:1.5; margin:0;">${currentItem.description.replace(/\n/g, '<br>')}</p>
    <div style="margin-top:16px; font-size:12px; color:#94a3b8; text-transform:uppercase; font-weight:bold;">
      ${currentItem.brand} • ${currentItem.model}
    </div>
  </div>
</div>`;
        await copyToClipboard(html, 'html');
    };

    const nextItem = () => {
        if (currentIndex < readyItems.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const prevItem = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    if (!currentItem) {
        return (
            <div className="h-[80vh] flex items-center justify-center text-slate-400 flex-col gap-4">
                <Send size={48} className="opacity-20" />
                <p>No items ready to post.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Sidecar Copy-Paste View</h1>
                    <p className="text-slate-500 text-sm mt-1">Tap copy buttons to post in ~15 seconds per listing</p>
                </div>
                <div className="text-slate-400 font-bold text-sm">
                    {currentIndex + 1} of {readyItems.length}
                </div>
            </header>

            {/* Mode Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                <button
                    onClick={() => setMode('facebook')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'facebook' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Facebook size={16} /> Facebook Marketplace
                </button>
                <button
                    onClick={() => setMode('website')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'website' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Globe size={16} /> Website SEO
                </button>
            </div>

            <div className="flex gap-4">
                <div className="flex gap-2">
                    <button
                        onClick={prevItem}
                        disabled={currentIndex === 0}
                        className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold flex items-center gap-2 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={18} /> Previous
                    </button>
                    <button
                        onClick={nextItem}
                        disabled={currentIndex === readyItems.length - 1}
                        className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold flex items-center gap-2 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Next <ChevronRight size={18} />
                    </button>
                </div>

                <div className="ml-auto flex gap-2">
                    {mode === 'website' && (
                        <button
                            onClick={copyHTML}
                            className="bg-white text-slate-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 border border-slate-200 transition-colors"
                            title="Copy Embeddable HTML for Website"
                        >
                            {copiedField === 'html' ? <Check size={18} className="text-emerald-500" /> : <Code size={18} />}
                            <span className="hidden sm:inline">HTML Embed</span>
                        </button>
                    )}
                    {mode === 'facebook' && (
                        <button
                            onClick={copyAll}
                            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                        >
                            {copiedField === 'all' ? <Check size={18} /> : <Copy size={18} />}
                            Copy All
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                {/* Large Product Image */}
                <div className="relative h-64 md:h-96 bg-slate-50">
                    <img src={currentItem.imageUrl || ''} alt={currentItem.title} className="w-full h-full object-contain" />
                    <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md text-blue-600 px-4 py-2 rounded-2xl text-xl font-extrabold shadow-2xl">
                        {formatUsd(currentItem.price)}
                    </div>
                    <div className="absolute bottom-6 left-6 flex gap-2">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-lg ${currentItem.condition === 'excellent' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {currentItem.condition}
                        </span>
                    </div>
                </div>

                <div className="p-8 space-y-10">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">{currentItem.title}</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-wider text-sm">
                                {currentItem.brand} • {currentItem.model}
                            </p>
                        </div>
                    </div>

                    {/* FACEBOOK MODE */}
                    {mode === 'facebook' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <Facebook size={12} /> Marketplace Title
                                    </label>
                                    <button
                                        onClick={() => copyToClipboard(currentItem.title, 'title')}
                                        className="flex items-center gap-1.5 text-blue-600 font-bold text-sm hover:underline"
                                    >
                                        {copiedField === 'title' ? <Check size={16} /> : <Copy size={16} />}
                                        Copy
                                    </button>
                                </div>
                                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 text-slate-700 font-medium">
                                    {currentItem.title}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <LayoutTemplate size={12} /> Description
                                    </label>
                                    <button
                                        onClick={() => copyToClipboard(currentItem.description, 'desc')}
                                        className="flex items-center gap-1.5 text-blue-600 font-bold text-sm hover:underline"
                                    >
                                        {copiedField === 'desc' ? <Check size={16} /> : <Copy size={16} />}
                                        Copy
                                    </button>
                                </div>
                                <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                                    {currentItem.description}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* WEBSITE MODE */}
                    {mode === 'website' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="p-4 bg-indigo-50 rounded-xl text-indigo-900 text-sm border border-indigo-100">
                                <strong>SEO Tip:</strong> These fields are optimized for Google Search ranking. Use them in your CMS (WordPress, Shopify, etc).
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <Globe size={12} /> URL Slug
                                    </label>
                                    <button
                                        onClick={() => copyToClipboard(currentItem.websiteParams?.slug || '', 'slug')}
                                        className="flex items-center gap-1.5 text-indigo-600 font-bold text-sm hover:underline"
                                    >
                                        {copiedField === 'slug' ? <Check size={16} /> : <Copy size={16} />}
                                        Copy
                                    </button>
                                </div>
                                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 text-slate-700 font-mono text-sm">
                                    {currentItem.websiteParams?.slug || 'Generate listings to see slug'}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meta Title (Max 60 chars)</label>
                                    <button
                                        onClick={() => copyToClipboard(currentItem.websiteParams?.metaTitle || '', 'metaTitle')}
                                        className="flex items-center gap-1.5 text-indigo-600 font-bold text-sm hover:underline"
                                    >
                                        {copiedField === 'metaTitle' ? <Check size={16} /> : <Copy size={16} />}
                                        Copy
                                    </button>
                                </div>
                                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 text-slate-700 font-medium">
                                    {currentItem.websiteParams?.metaTitle || 'Generate listings to see meta title'}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meta Description (Max 160 chars)</label>
                                    <button
                                        onClick={() => copyToClipboard(currentItem.websiteParams?.metaDescription || '', 'metaDesc')}
                                        className="flex items-center gap-1.5 text-indigo-600 font-bold text-sm hover:underline"
                                    >
                                        {copiedField === 'metaDesc' ? <Check size={16} /> : <Copy size={16} />}
                                        Copy
                                    </button>
                                </div>
                                <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed font-medium text-sm">
                                    {currentItem.websiteParams?.metaDescription || 'Generate listings to see meta description'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Completion Action */}
                <div className="px-8 pb-8">
                    <button
                        onClick={() => updateItemStatus(currentItem.id, ItemStatus.LISTED)}
                        disabled={currentItem.status === 'listed'}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                        <Check size={20} />
                        {currentItem.status === 'listed' ? 'Already Listed' : 'Mark as Successfully Listed'}
                    </button>
                </div>
            </div>
        </div>
    );
}
