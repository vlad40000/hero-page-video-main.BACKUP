import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

type ApplianceIconVariant = 'refrigerator' | 'washer' | 'dryer' | 'range' | 'laundry-set';

export const metadata: Metadata = {
    title: 'Shop Used Appliances | Road Runner Appliance',
    description: 'Browse our selection of quality used appliances including refrigerators, washers, dryers, and stoves & ranges in Hemingway, SC. All units tested and guaranteed.',
    alternates: {
        canonical: '/shop',
    },
};

const categories: Array<{
    name: string;
    href: string;
    description: string;
    icon: ApplianceIconVariant;
}> = [
    {
        name: 'Refrigerators',
        href: '/refrigerators',
        description: 'Wide selection of quality used refrigerators in various sizes and styles.',
        icon: 'refrigerator',
    },
    {
        name: 'Washers',
        href: '/washers',
        description: 'Reliable washing machines including top load and front load units.',
        icon: 'washer',
    },
    {
        name: 'Dryers',
        href: '/dryers',
        description: 'Quality electric and gas dryers for all your laundry needs.',
        icon: 'dryer',
    },
    {
        name: 'Stoves & Ranges',
        href: '/stoves-ranges',
        description: 'Gas and electric stoves and ranges for your kitchen.',
        icon: 'range',
    },
    {
        name: 'Washer & Dryer Sets',
        href: '/washer-dryer-sets',
        description: 'Matching washer and dryer pairs for a complete laundry solution.',
        icon: 'laundry-set',
    },
];

export default function ShopPage() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white py-16 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-black mb-4">Shop Used Appliances</h1>
                    <p className="text-slate-300 text-lg max-w-2xl mx-auto">
                        From refrigerators to washing machines, we have the used appliances you need at prices you can afford.
                    </p>
                </div>
            </div>

            {/* Product Categories Grid */}
            <main className="max-w-6xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
                    {categories.map((category) => (
                        <Link
                            key={category.name}
                            href={category.href}
                            className="group rounded-2xl border-2 border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:bg-cyan-50/50 hover:shadow-xl active:translate-y-0"
                        >
                            <ApplianceIcon variant={category.icon} />
                            <h2 className="mt-5 mb-2 text-xl font-bold text-slate-900">{category.name}</h2>
                            <p className="mb-4 text-sm leading-relaxed text-slate-600">{category.description}</p>
                            <div className="flex items-center gap-2 text-sm font-bold text-blue-600 transition-all group-hover:gap-3">
                                View Products
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Additional Info */}
                <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
                    <div className="text-center max-w-2xl mx-auto">
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Quality Guaranteed</h3>
                        <p className="text-slate-600 mb-6">
                            Every appliance is inspected, tested, and cleaned before sale. We stand behind our products with a 30-day warranty.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/service"
                                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-bold transition-colors"
                            >
                                Learn About Our Guarantee
                            </Link>
                            <a
                                href="tel:843-536-6005"
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                            >
                                Call 843-536-6005
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function ApplianceIcon({ variant }: { variant: ApplianceIconVariant }) {
    const iconProps = {
        className: 'h-20 w-20 text-slate-950',
        viewBox: '0 0 96 96',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        'aria-hidden': true,
    };

    return (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200 transition-transform group-hover:scale-105">
            {variant === 'refrigerator' ? (
                <svg {...iconProps}>
                    <rect x="31" y="13" width="34" height="70" rx="5" fill="#C7F8FA" stroke="currentColor" strokeWidth="4" />
                    <path d="M31 39H65" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <path d="M39 25V34M39 51V65" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <path d="M57 20L51 26M51 20L57 26M54 18V28M49 23H59" stroke="#0891B2" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M37 83V87M59 83V87" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
            ) : null}
            {variant === 'washer' ? (
                <svg {...iconProps}>
                    <rect x="18" y="18" width="60" height="60" rx="6" fill="#C7F8FA" stroke="currentColor" strokeWidth="4" />
                    <path d="M18 33H78" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="48" cy="55" r="18" fill="white" stroke="currentColor" strokeWidth="4" />
                    <path d="M37 55C42 49 50 62 59 55" stroke="#0891B2" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="62" cy="25" r="3" fill="currentColor" />
                    <circle cx="71" cy="25" r="3" fill="#0891B2" />
                    <path d="M25 25H42" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <path d="M25 78V82M71 78V82" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
            ) : null}
            {variant === 'dryer' ? (
                <svg {...iconProps}>
                    <rect x="18" y="18" width="60" height="60" rx="6" fill="#D6E7E9" stroke="currentColor" strokeWidth="4" />
                    <path d="M18 33H78" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="48" cy="55" r="18" fill="#C7F8FA" stroke="currentColor" strokeWidth="4" />
                    <path d="M39 52H57M39 58H57" stroke="white" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="63" cy="25" r="3" fill="currentColor" />
                    <circle cx="72" cy="25" r="3" fill="#0891B2" />
                    <path d="M25 25H42" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <path d="M25 78V82M71 78V82" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
            ) : null}
            {variant === 'range' ? (
                <svg {...iconProps}>
                    <rect x="17" y="16" width="62" height="64" rx="5" fill="#C7F8FA" stroke="currentColor" strokeWidth="4" />
                    <path d="M17 34H79" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <rect x="27" y="45" width="42" height="25" rx="3" fill="white" stroke="currentColor" strokeWidth="4" />
                    <path d="M32 27H64" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="27" cy="24" r="3.5" fill="#0891B2" stroke="currentColor" strokeWidth="2" />
                    <circle cx="41" cy="24" r="3.5" fill="#C7F8FA" stroke="currentColor" strokeWidth="2" />
                    <circle cx="55" cy="24" r="3.5" fill="#C7F8FA" stroke="currentColor" strokeWidth="2" />
                    <circle cx="69" cy="24" r="3.5" fill="currentColor" />
                    <path d="M39 51L31 59M55 51L47 59" stroke="#0891B2" strokeWidth="3" strokeLinecap="round" />
                    <path d="M25 80V84M71 80V84" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
            ) : null}
            {variant === 'laundry-set' ? (
                <svg {...iconProps}>
                    <rect x="12" y="21" width="34" height="56" rx="5" fill="#C7F8FA" stroke="currentColor" strokeWidth="4" />
                    <rect x="50" y="21" width="34" height="56" rx="5" fill="#D6E7E9" stroke="currentColor" strokeWidth="4" />
                    <path d="M12 35H46M50 35H84" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="29" cy="56" r="12" fill="white" stroke="currentColor" strokeWidth="4" />
                    <circle cx="67" cy="56" r="12" fill="#C7F8FA" stroke="currentColor" strokeWidth="4" />
                    <path d="M23 56C27 52 31 60 35 56" stroke="#0891B2" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M62 52H72M62 60H72" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="37" cy="28" r="2.5" fill="currentColor" />
                    <circle cx="75" cy="28" r="2.5" fill="#0891B2" />
                    <path d="M20 77V81M38 77V81M58 77V81M76 77V81" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
            ) : null}
        </div>
    );
}
