import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
    ArrowRight,
    BadgeDollarSign,
    Building2,
    CheckCircle2,
    House,
    Phone,
    SearchCheck,
    Wrench,
    Zap,
} from 'lucide-react';

export const metadata: Metadata = {
    title: 'Appliance Repair & Service | Road Runner Appliance',
    description: 'Expert appliance repair for all makes and models in Hemingway, SC. Fast turnaround, affordable rates, and same-day service available. Call 843-536-6005.',
    alternates: {
        canonical: '/service',
    },
};

export default function ServicePage() {
    const services = [
        {
            name: 'Troubleshoot',
            href: '/tools/fix',
            description: 'Use our AI-powered diagnostic tool to troubleshoot your appliance issues instantly.',
            icon: SearchCheck,
            color: 'blue',
            featured: true
        },
        {
            name: 'Repair Services',
            href: '/service',
            description: 'Expert repair services for all makes and models of appliances.',
            icon: Wrench,
            color: 'emerald',
            featured: false
        },
        {
            name: 'Residential Service',
            href: '/service/resident',
            description: 'Quality service and support for homeowners and renters.',
            icon: House,
            color: 'purple',
            featured: false
        },
        {
            name: 'Corporate Service',
            href: '/service/corporate',
            description: 'Priority service for property managers and businesses.',
            icon: Building2,
            color: 'orange',
            featured: false
        }
    ];

    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; hover: string; icon: string; border: string; text: string }> = {
            blue: { bg: 'bg-blue-50', hover: 'hover:bg-blue-100', icon: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-600' },
            emerald: { bg: 'bg-emerald-50', hover: 'hover:bg-emerald-100', icon: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-600' },
            purple: { bg: 'bg-purple-50', hover: 'hover:bg-purple-100', icon: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-600' },
            orange: { bg: 'bg-orange-50', hover: 'hover:bg-orange-100', icon: 'bg-orange-100', border: 'border-orange-200', text: 'text-orange-600' }
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white py-16 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-black mb-4">Appliance Repair & Service</h1>
                    <p className="text-slate-300 text-lg max-w-2xl mx-auto">
                        Expert repair services for all makes and models. Fast, reliable, and affordable solutions for your appliance needs.
                    </p>
                </div>
            </div>

            {/* Service Options Grid */}
            <main className="max-w-6xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {services.map((service) => {
                        const colors = getColorClasses(service.color);
                        const ServiceIcon = service.icon;
                        return (
                            <Link
                                key={service.name}
                                href={service.href}
                                className={`${colors.bg} ${colors.hover} border-2 ${colors.border} rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-100 group ${service.featured ? 'md:col-span-2' : ''}`}
                            >
                                <div className="flex items-start gap-6">
                                    <div className={`w-16 h-16 ${colors.icon} ${colors.text} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                        <ServiceIcon size={30} strokeWidth={2.25} />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-slate-900 mb-2">{service.name}</h2>
                                        <p className="text-slate-600 mb-4 leading-relaxed">{service.description}</p>
                                        <div className={`flex items-center gap-2 ${colors.text} font-bold text-sm group-hover:gap-3 transition-all`}>
                                            {service.featured ? 'Start Diagnostic' : 'Learn More'}
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Trust Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 text-center">
                        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Zap size={24} strokeWidth={2.25} />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-2">Fast Service</h3>
                        <p className="text-slate-600 text-sm">Same-day and next-day appointments available</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 text-center">
                        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <CheckCircle2 size={24} strokeWidth={2.25} />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-2">All Makes & Models</h3>
                        <p className="text-slate-600 text-sm">We service all major appliance brands</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 text-center">
                        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                            <BadgeDollarSign size={24} strokeWidth={2.25} />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-2">Affordable Rates</h3>
                        <p className="text-slate-600 text-sm">Competitive pricing with no hidden fees</p>
                    </div>
                </div>

                {/* Repair Guides Section */}
                <div className="mb-16" id="repair-guides">
                    <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-2">
                        <Wrench size={24} /> Common Repair Guides
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: "Washer Won't Drain", slug: "washer-wont-drain-causes-repair-costs" },
                            { title: "Dryer Not Heating", slug: "dryer-not-heating-common-fixes" },
                            { title: "Fridge Not Cooling", slug: "refrigerator-not-cooling-troubleshooting" },
                            { title: "Spin Cycle Loud", slug: "loud-banging-spin-cycle-diagnosis" }
                        ].map(guide => (
                            <Link
                                key={guide.slug}
                                href={`/guides/repair/${guide.slug}`}
                                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
                            >
                                <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">{guide.title}</h4>
                                <p className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-500">
                                    View typical repair costs and causes <ArrowRight size={13} />
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-blue-600 rounded-2xl p-8 shadow-xl text-center text-white">
                    <h3 className="text-3xl font-bold mb-4">Need Service Now?</h3>
                    <p className="text-blue-100 mb-6 max-w-xl mx-auto">
                        Call us to schedule a repair, ask questions, or get a quote. Our team is ready to help!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="tel:843-536-6005"
                            className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors inline-flex items-center justify-center gap-2"
                        >
                            <Phone size={20} />
                            Call 843-536-6005
                        </a>
                        <Link
                            href="/tools/fix"
                            className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                        >
                            Troubleshoot Now
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
