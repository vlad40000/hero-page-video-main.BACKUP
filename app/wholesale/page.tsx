'use client';

// Note: metadata must be in a server component parent.
// noindex is handled via app/wholesale/layout.tsx

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { submitCommercialInquiry } from '@/actions/wholesale';
import { CheckIcon, LoaderIcon } from '@/components/Icons';
import { LoadingLogo } from '@/components/LoadingLogo';
import Link from 'next/link';

function CommercialContent() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') === 'property' ? 'property' : 'dealer'; // Default to dealer

    const [selectedTab, setSelectedTab] = useState<'dealer' | 'property' | null>(null);
    const activeTab = selectedTab ?? initialTab;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        formData.append('type', activeTab); // Inject the active tab type
        const result = await submitCommercialInquiry(formData);
        
        setIsSubmitting(false);
        if (result.success) {
            setIsSuccess(true);
        } else {
            setError(result.error || "Failed to submit application. Please try again.");
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200">

            {/* HERO / TOGGLE */}
            <div className="bg-slate-900 text-white pb-24 pt-12 px-6 text-center">
                <h1 className="text-3xl md:text-5xl font-black mb-4">Volume Purchasing</h1>
                <p className="text-slate-400 max-w-xl mx-auto mb-10 text-lg">
                    Exclusive pricing and inventory access for high-volume partners.
                </p>

                {/* THE TOGGLE */}
                <div className="inline-flex bg-slate-800 p-1.5 rounded-full border border-slate-700">
                    <button
                        onClick={() => { setSelectedTab('dealer'); setIsSuccess(false); }}
                        className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'dealer' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        For Resalers & Dealers
                    </button>
                    <button
                        onClick={() => { setSelectedTab('property'); setIsSuccess(false); }}
                        className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'property' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        For Property Managers
                    </button>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 -mt-16 pb-24">

                {/* CONTENT CARD */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden min-h-[600px] flex flex-col md:flex-row">

                    {/* LEFT SIDE: THE PITCH */}
                    <div className={`p-10 md:w-1/2 flex flex-col justify-center ${activeTab === 'dealer' ? 'bg-blue-50' : 'bg-emerald-50'}`}>

                        {activeTab === 'dealer' ? (
                            // DEALER CONTENT
                            <div className="animate-in fade-in slide-in-from-left-8 duration-500">
                                <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 font-bold text-[10px] uppercase tracking-widest rounded-full mb-6">Wholesale Liquidation</div>
                                <h2 className="text-3xl font-black text-slate-900 mb-6">Source Inventory by the Truckload.</h2>
                                <ul className="space-y-4 mb-8">
                                    <li className="flex gap-3 items-start">
                                        <CheckIcon className="text-blue-600 mt-1 shrink-0" />
                                        <span className="text-slate-600 font-medium"><strong>Raw Returns & Scratch/Dent:</strong> Un-tested loads priced at 15-20% of MSRP.</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <CheckIcon className="text-blue-600 mt-1 shrink-0" />
                                        <span className="text-slate-600 font-medium"><strong>Tested Stock:</strong> &quot;Ready to Retail&quot; units available in smaller lots (5+ units).</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <CheckIcon className="text-blue-600 mt-1 shrink-0" />
                                        <span className="text-slate-600 font-medium"><strong>Parts Harvest:</strong> Scrap units available for $10-20/unit (Motor/Board value).</span>
                                    </li>
                                </ul>
                                <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Recent Manifest Example</p>
                                    <p className="font-mono text-sm text-slate-700"><strong>LOT #492:</strong> 18 Whirlpool Dryers (Elec), 4 LG Washers (TL). Cond: Mixed. <strong>Price: $2,800 FOB.</strong></p>
                                </div>
                            </div>
                        ) : (
                            // PROPERTY MANAGER CONTENT
                            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase tracking-widest rounded-full mb-6">Corporate Accounts</div>
                                <h2 className="text-3xl font-black text-slate-900 mb-6">Keep Your Tenants Happy. Guaranteed.</h2>
                                <ul className="space-y-4 mb-8">
                                    <li className="flex gap-3 items-start">
                                        <CheckIcon className="text-emerald-600 mt-1 shrink-0" />
                                        <span className="text-slate-600 font-medium"><strong>48-Hour Swap Guarantee:</strong> If we can&apos;t fix it, we swap it. No downtime.</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <CheckIcon className="text-emerald-600 mt-1 shrink-0" />
                                        <span className="text-slate-600 font-medium"><strong>Flat-Rate Billing:</strong> Simple invoicing for your AP department. No hidden fees.</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <CheckIcon className="text-emerald-600 mt-1 shrink-0" />
                                        <span className="text-slate-600 font-medium"><strong>Bulk Discounts:</strong> Up to 20% off retail pricing when buying 3+ units.</span>
                                    </li>
                                </ul>
                                <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Priority Service</p>
                                    <p className="font-medium text-sm text-slate-700">&quot;Road Runner handles all 200 units at our Oakwood property. One text and it&apos;s handled.&quot; — <em>Sarah J., Property Mgr</em></p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDE: THE FORM */}
                    <div className="p-10 md:w-1/2 bg-white flex flex-col justify-center">

                        {isSuccess ? (
                            <div className="text-center animate-in zoom-in duration-300">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${activeTab === 'dealer' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    <CheckIcon size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">Application Received</h3>
                                <p className="text-slate-500">Our commercial team reviews applications every Tuesday. Check your email for a confirmation.</p>
                                <button onClick={() => setIsSuccess(false)} className="mt-8 text-sm font-bold text-slate-400 hover:text-slate-600">Submit another request</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-700">
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-slate-900">
                                        {activeTab === 'dealer' ? "Request Wholesale Access" : "Open Corporate Account"}
                                    </h3>
                                    <p className="text-sm text-slate-400">
                                        {activeTab === 'dealer' ? "Valid Tax ID / Reseller Cert Required" : "For 10+ Unit Properties"}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Name</label>
                                        <input name="contactName" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Business Name</label>
                                        <input name="businessName" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                        <input name="email" type="email" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                                        <input name="phone" type="tel" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all" />
                                    </div>
                                </div>

                                {activeTab === 'dealer' ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tax ID / EIN</label>
                                            <input name="taxId" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="XX-XXXXXXX" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Buying Frequency</label>
                                            <select name="volume" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all">
                                                <option>One-time purchase</option>
                                                <option>Monthly (LTL)</option>
                                                <option>Weekly (Truckload)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">What are you looking for?</label>
                                            <textarea name="needs" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 h-20 resize-none" placeholder="E.g. 20 Electric Dryers, any brand..." />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Units Managed</label>
                                            <select name="unitCount" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all">
                                                <option>10 - 50 Units</option>
                                                <option>50 - 100 Units</option>
                                                <option>100+ Units</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Immediate Needs?</label>
                                            <textarea name="needs" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 h-28 resize-none" placeholder="Looking for reliable repair vendor or unit replacement..." />
                                        </div>
                                    </>
                                )}

                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full py-4 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${activeTab === 'dealer' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'}`}
                                >
                                    {isSubmitting ? <LoaderIcon /> : "Submit Application"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function CommercialPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><LoadingLogo size={96} label="Loading wholesale page" /></div>}>
            <CommercialContent />
        </Suspense>
    );
}
