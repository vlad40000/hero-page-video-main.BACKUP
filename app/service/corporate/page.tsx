import { Metadata } from 'next';
import {
    Building2,
    BarChart3,
    ShieldCheck,
    Users,
    ArrowRight,
    CheckCircle2,
    Lock,
    Calculator
} from "lucide-react";

export const metadata: Metadata = {
    title: 'Corporate Leasing Program | Road Runner Inc Appliance',
    description: 'Direct leasing programs for property management companies and owners. Ensure in-unit laundry for all your residents.',
    alternates: {
        canonical: '/service/corporate',
    },
};

export default function CorporatePortal() {
    return (
        <>
            <main className="flex-1">
                {/* Hero Section */}
                <section className="bg-slate-900 text-white py-24 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="max-w-3xl">
                            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold uppercase tracking-widest bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/30">
                                Institutional Solutions
                            </span>
                            <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-[1.05]">
                                Let Us Lighten <br />
                                <span className="text-blue-500">Your Load.</span>
                            </h1>
                            <p className="text-xl text-slate-400 mb-10 leading-relaxed">
                                Our corporate leasing program for property management companies and owners ensures you can provide premium in-unit laundry without the capital drag.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a href="#login" className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-500 transition shadow-2xl flex items-center justify-center">
                                    <Lock className="mr-2 h-5 w-5" /> Corporate Login
                                </a>
                                <a href="#benefits" className="border border-slate-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition flex items-center justify-center">
                                    Program Details <ArrowRight className="ml-2 h-5 w-5" />
                                </a>
                            </div>
                            <div className="mt-8 pt-8 border-t border-slate-800">
                                <a href="/tools/portfolio-appliance-deal-analyzer" className="inline-flex items-center text-blue-400 hover:text-blue-300 transition font-semibold group">
                                    <Calculator className="mr-2 h-5 w-5" />
                                    Try our new Portfolio Deal Analyzer
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </div>
                    </div>
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/10 blur-[120px] rounded-full -mr-20 -mt-20"></div>
                </section>

                {/* Value Propositions */}
                <section id="benefits" className="py-24 bg-white border-b border-slate-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-20">
                            <h2 className="text-3xl md:text-5xl font-bold mb-4">Corporate Direct Leasing</h2>
                            <p className="text-lg text-slate-500">Scale your portfolio with predictable, service-backed operations.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-12">
                            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
                                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6">
                                    <BarChart3 className="w-7 h-7" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Financial Efficiency</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start text-slate-600"><CheckCircle2 className="mr-2 h-5 w-5 text-blue-600 shrink-0" /> Zero Upfront Capital</li>
                                    <li className="flex items-start text-slate-600"><CheckCircle2 className="mr-2 h-5 w-5 text-blue-600 shrink-0" /> Off-Balance Sheet Financing</li>
                                    <li className="flex items-start text-slate-600"><CheckCircle2 className="mr-2 h-5 w-5 text-blue-600 shrink-0" /> OPEX Ready Reporting</li>
                                </ul>
                            </div>
                            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
                                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6">
                                    <ShieldCheck className="w-7 h-7" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Full Maintenance</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start text-slate-600"><CheckCircle2 className="mr-2 h-5 w-5 text-blue-600 shrink-0" /> 24hr Service Guarantee</li>
                                    <li className="flex items-start text-slate-600"><CheckCircle2 className="mr-2 h-5 w-5 text-blue-600 shrink-0" /> Unlimited Parts & Labor</li>
                                    <li className="flex items-start text-slate-600"><CheckCircle2 className="mr-2 h-5 w-5 text-blue-600 shrink-0" /> Next-Day Replacements</li>
                                </ul>
                            </div>
                            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
                                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6">
                                    <Users className="w-7 h-7" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Tenant Satisfaction</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start text-slate-600"><CheckCircle2 className="mr-2 h-5 w-5 text-blue-600 shrink-0" /> Premium Brand Selection</li>
                                    <li className="flex items-start text-slate-600"><CheckCircle2 className="mr-2 h-5 w-5 text-blue-600 shrink-0" /> Modern User Interface</li>
                                    <li className="flex items-start text-slate-600"><CheckCircle2 className="mr-2 h-5 w-5 text-blue-600 shrink-0" /> Higher Retention Rates</li>
                                </ul>
                            </div>
                        </div>

                        {/* Financial Tools Teaser */}
                        <div className="mt-16 p-8 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div>
                                <span className="inline-block px-3 py-1 mb-3 text-xs font-bold uppercase tracking-widest bg-blue-100 text-blue-700 rounded-full">
                                    New Tool
                                </span>
                                <h3 className="text-2xl font-bold mb-2">Portfolio Deal Analyzer</h3>
                                <p className="text-slate-600 max-w-xl">
                                    Run the numbers yourself. Compare the 1, 3, and 5-year costs of owning vs. leasing your appliance fleet with our interactive calculator.
                                </p>
                            </div>
                            <a
                                href="/tools/portfolio-appliance-deal-analyzer"
                                className="whitespace-nowrap bg-white border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:border-blue-500 hover:text-blue-600 transition flex items-center"
                            >
                                Launch Calculator <Calculator className="ml-2 h-5 w-5" />
                            </a>
                        </div>
                    </div>
                </section >

                {/* Quote Analysis Section */}
                < section id="login" className="py-24 bg-slate-50" >
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white rounded-[3rem] p-12 md:p-20 shadow-xl border border-slate-200">
                            <div className="grid md:grid-cols-2 gap-16 items-center">
                                <div>
                                    <h2 className="text-3xl font-bold mb-6">Corporate Portal Login</h2>
                                    <p className="text-slate-500 mb-8">
                                        Access your portfolio metrics, request new unit installations, or manage existing inventory across multiple properties.
                                    </p>
                                    <form className="space-y-4">
                                        <input type="email" placeholder="Corporate Email" className="w-full px-6 py-4 rounded-2xl border bg-slate-50" />
                                        <input type="password" placeholder="Password" className="w-full px-6 py-4 rounded-2xl border bg-slate-50" />
                                        <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-shadow transition">
                                            Sign In
                                        </button>
                                    </form>
                                </div>
                                <div className="bg-slate-900 rounded-3xl p-10 text-white">
                                    <Building2 className="h-12 w-12 text-blue-500 mb-6" />
                                    <h3 className="text-2xl font-bold mb-4">New to the program?</h3>
                                    <p className="text-slate-400 mb-8">
                                        Start your portfolio analysis today and see how we can optimize your ROI.
                                    </p>
                                    <button className="text-blue-400 font-bold flex items-center hover:text-blue-300">
                                        Request Portfolio Model <ArrowRight className="ml-2 h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section >
            </main >
        </>
    );
}
