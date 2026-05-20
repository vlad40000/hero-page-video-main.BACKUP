'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    ChevronRight,
    MapPin,
    Menu,
    PackageSearch,
    Phone,
    Wrench,
    X,
} from 'lucide-react';

const DIRECTIONS_URL = 'https://www.google.com/maps/dir/?api=1&destination=123+W.+Broad+St.+Hemingway,+SC+29554';

export const SiteHeader = () => {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Hide header on the dedicated Triage Tool to focus the user
    if (pathname === '/tools/fix') return null;

    return (
        <>
            <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm font-sans">

                {/* MAIN NAVIGATION BAR */}
                <div className="flex h-16 items-center justify-between gap-3 px-3 md:gap-6 md:px-6">

                    {/* LOGO & DIRECTIONS */}
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3 z-50 relative">
                        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                            <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
                                <Image
                                    src="/road-runner-logo.png"
                                    alt="Road Runner Appliance"
                                    width={48}
                                    height={48}
                                    className="h-9 w-9 object-contain"
                                    priority
                                />
                                <h1 className="max-w-[10.5rem] truncate text-sm font-black leading-none tracking-tight text-slate-900 sm:max-w-none sm:text-base">Road Runner Appliance</h1>
                            </Link>
                            <a
                                href={DIRECTIONS_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white transition-all hover:bg-blue-700 sm:inline-flex"
                                title="Get Directions"
                            >
                                <MapPin size={10} /> <span>Get Directions</span>
                            </a>
                        </div>
                    </div>

                    {/* DESKTOP NAV */}
                    <nav className="hidden items-center gap-9 text-xs font-bold text-slate-600 md:flex">
                        <Link href="/shop" className="hover:text-blue-600 transition-colors">Retail Sales</Link>
                        <Link href="/service" className="hover:text-blue-600 transition-colors">Service & Repair</Link>
                        <Link href="/tools/part-finder" className="hover:text-blue-600 transition-colors">Find Parts</Link>
                        <Link href="/parts" className="hover:text-blue-600 transition-colors">Parts Catalog</Link>
                    </nav>

                    {/* ACTIONS */}
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                        <Link
                            href="/tools/fix"
                            className="hidden items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 sm:flex"
                        >
                            <Wrench size={14} />
                            Troubleshoot
                        </Link>
                        <Link
                            href="/tools/part-finder"
                            className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-700 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 md:hidden"
                        >
                            <PackageSearch size={14} /> Parts
                        </Link>
                        <a
                            href="tel:843-536-6005"
                            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 sm:rounded-xl sm:px-4 sm:py-2.5"
                            title="Call Now"
                        >
                            <Phone size={14} /> <span className="hidden sm:inline">Call</span>
                        </a>
                        <button
                            className="ml-0 p-1.5 text-slate-900 md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        >
                            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* 3. MOBILE MENU OVERLAY */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-white pt-24 px-6 pb-6 overflow-y-auto animate-in slide-in-from-right-10 duration-300">
                    <div className="space-y-2 mb-8">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Consumer Services</p>
                        <Link href="/shop" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 text-lg active:scale-95 transition-transform" onClick={() => setMobileMenuOpen(false)}>
                            Retail Sales <ChevronRight className="text-slate-400" />
                        </Link>
                        <Link href="/service" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 text-lg active:scale-95 transition-transform" onClick={() => setMobileMenuOpen(false)}>
                            Service & Repair <ChevronRight className="text-slate-400" />
                        </Link>
                        <Link href="/tools/part-finder" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 text-lg active:scale-95 transition-transform" onClick={() => setMobileMenuOpen(false)}>
                            Find Parts <ChevronRight className="text-slate-400" />
                        </Link>
                        <Link href="/parts" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 text-lg active:scale-95 transition-transform" onClick={() => setMobileMenuOpen(false)}>
                            Parts Catalog <ChevronRight className="text-slate-400" />
                        </Link>
                        <a
                            href={DIRECTIONS_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 text-lg active:scale-95 transition-transform"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Directions <ChevronRight className="text-slate-400" />
                        </a>
                    </div>

                    <div className="mb-8">
                        <Link
                            href="/tools/fix"
                            className="flex items-center justify-center w-full p-5 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/30 active:scale-95 transition-transform"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Troubleshoot Now
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
};
