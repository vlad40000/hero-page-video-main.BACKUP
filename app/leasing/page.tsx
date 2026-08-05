import React from "react";
import Image from "next/image";
import {
    Zap,
    TrendingUp,
    Wrench,
    Home,
    Check,
    MapPin,
    Map as MapIcon,
    CheckCircle,
    ArrowUp,
    Calculator
} from "lucide-react";
import { Metadata } from 'next';
import { LeasingCatalog } from "@/components/LeasingCatalog";

export const metadata: Metadata = {
    title: 'Road Runner Leasing | Institutional Appliance Solutions & Portfolio NOI Analysis',
    description: 'Optimize portfolio NOI and eliminate CapEx volatility. Our scale-ready appliance leasing programs convert unpredictable maintenance drag into fixed, accretive operating yield.',
};

export default function LeasingPage() {
    return (
        <div className="bg-gray-50 text-slate-900 leading-tight font-sans">
            {/* Custom Grid Background for Hero */}
            <style>{`
                .hero-gradient { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); }
            `}</style>

            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center space-x-2">
                            <div className="mr-2">
                                <Image
                                    src="/road-runner-logo.png"
                                    alt="Road Runner Inc Logo"
                                    width={48}
                                    height={48}
                                    className="h-12 w-auto"
                                />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-slate-900">
                                Road Runner Inc <span className="text-blue-600">Leasing</span>
                            </span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8 text-sm font-semibold uppercase tracking-wider text-slate-600">
                            <a href="#benefits" className="hover:text-blue-600 transition">Value</a>
                            <a href="#portfolios" className="hover:text-blue-600 transition">Solutions</a>
                            <a href="#tools" className="hover:text-blue-600 transition">Tools</a>
                            <a href="#service" className="hover:text-blue-600 transition">Coverage</a>
                            <a href="#cta" className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                                Request Analysis
                            </a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Deal Analyzer Promoted */}
            <section id="tools" className="hero-gradient text-white py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/5"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold uppercase tracking-widest bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/30">
                                New Financial Tool
                            </span>
                            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                                Analyze Your <br />
                                <span className="text-blue-400">True Portfolio Costs.</span>
                            </h1>
                            <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-lg">
                                Stop guessing about the hidden costs of appliance ownership. Our new Portfolio Deal Analyzer models your specific unit count, purchase costs, and capital costs to reveal the true financial impact of leasing vs. buying.
                            </p>

                            <ul className="space-y-4 mb-10">
                                <li className="flex items-center text-slate-300">
                                    <CheckCircle className="mr-3 h-6 w-6 text-blue-500 flex-shrink-0" />
                                    <span>Compare Cash vs. Accrual Accounting Views</span>
                                </li>
                                <li className="flex items-center text-slate-300">
                                    <CheckCircle className="mr-3 h-6 w-6 text-blue-500 flex-shrink-0" />
                                    <span>Model 1, 3, and 5-Year Financial Horizons</span>
                                </li>
                                <li className="flex items-center text-slate-300">
                                    <CheckCircle className="mr-3 h-6 w-6 text-blue-500 flex-shrink-0" />
                                    <span>Customize Maintenance & Admin Burden Assumptions</span>
                                </li>
                            </ul>

                            <a
                                href="/tools/portfolio-appliance-deal-analyzer"
                                className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-500 transition shadow-lg shadow-blue-900/20 group"
                            >
                                Launch Deal Analyzer
                                <TrendingUp className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </a>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 blur-3xl rounded-full"></div>
                            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-2 shadow-2xl transform rotate-1 hover:rotate-0 transition duration-500">
                                <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700/50">
                                    {/* Simplified UI Mockup for Visual Interest */}
                                    <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    </div>
                                    <div className="p-8 space-y-6 opacity-90">
                                        <div className="flex justify-between items-end border-b border-slate-700 pb-4">
                                            <div>
                                                <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Projected 3-Year Savings</div>
                                                <div className="text-3xl font-bold text-white">$42,590.00</div>
                                            </div>
                                            <div className="text-green-500 font-bold flex items-center text-sm">
                                                <ArrowUp className="w-4 h-4 mr-1" /> 18.2% ROI
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="h-2 bg-slate-700 rounded-full w-full"></div>
                                            <div className="h-2 bg-slate-700 rounded-full w-5/6"></div>
                                            <div className="h-2 bg-slate-700 rounded-full w-4/6"></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                                                <div className="w-8 h-1 bg-blue-500 rounded-full mb-2"></div>
                                                <div className="h-2 w-12 bg-slate-600 rounded-full"></div>
                                            </div>
                                            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                                                <div className="w-8 h-1 bg-purple-500 rounded-full mb-2"></div>
                                                <div className="h-2 w-12 bg-slate-600 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section id="benefits" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Why Scaled Operators Lease Appliances
                        </h2>
                        <p className="text-lg text-slate-600">
                            Remove friction, reduce volatility, and protect long-term portfolio value.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Balance Sheet Optimization</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Avoid lump-sum capital calls. Convert appliance debt into 100% tax-deductible operating expenses while preserving cash for high-yield allocations.
                            </p>
                        </div>

                        <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                <Wrench className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">O&M Risk Transfer</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Offload the entire repair and maintenance lifecycle. Our institutional-grade service backend ensures 99.9% appliance uptime across your portfolio.
                            </p>
                        </div>

                        <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                <Home className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Yield Enhancement</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Modern, reliable appliances drive higher effective rents and improved tenant retention, directly contributing to portfolio-wide yield appreciation.
                            </p>
                        </div>
                    </div>
                </div>
            </section>


            <LeasingCatalog />

            {/* CTA */}
            <section id="cta" className="py-24 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col md:flex-row overflow-hidden">
                        <div className="md:w-2/5 hero-gradient p-12 text-white">
                            <h3 className="text-2xl font-bold mb-4">
                                Portfolio Leasing Analysis
                            </h3>
                            <p className="text-slate-300 text-sm mb-8">
                                Provide your unit count and asset mix. We’ll model cost avoidance, service coverage, and NOI impact.
                            </p>
                            <div className="text-sm space-y-3">
                                <div className="flex items-center"><CheckCircle className="mr-2 text-blue-400 w-5 h-5" />No obligation</div>
                                <div className="flex items-center"><CheckCircle className="mr-2 text-blue-400 w-5 h-5" />OPEX-ready reporting</div>
                            </div>
                        </div>

                        <div className="md:w-3/5 p-12">
                            <form className="space-y-4">
                                <input type="text" placeholder="Full Name" className="w-full px-4 py-3 border rounded-lg bg-gray-50" />
                                <input type="text" placeholder="Company / Portfolio" className="w-full px-4 py-3 border rounded-lg bg-gray-50" />
                                <select className="w-full px-4 py-3 border rounded-lg bg-gray-50">
                                    <option>1 – 50 Units</option>
                                    <option>51 – 250 Units</option>
                                    <option>251 – 1,000 Units</option>
                                    <option>1,000+ Units</option>
                                </select>
                                <input type="email" placeholder="Email Address" className="w-full px-4 py-3 border rounded-lg bg-gray-50" />
                                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition">
                                    Generate Analysis
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="bg-gray-100 py-12 border-t border-gray-200 text-center text-sm text-slate-500">
                © 2026 Road Runner Inc Leasing. All Rights Reserved.
            </footer>
        </div>
    );
}
