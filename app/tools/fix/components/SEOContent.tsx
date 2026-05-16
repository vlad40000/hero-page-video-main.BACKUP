import React from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, MapPin, Search, Wrench, DollarSign, ArrowRight } from 'lucide-react';

export function SEOContent() {
    return (
        <div className="max-w-4xl mx-auto py-16 px-4 space-y-20 border-t border-slate-200 mt-16">
            {/* 1. Explainer */}
            <section>
                <h2 className="text-3xl font-black text-slate-900 mb-6">Appliance Repair Cost Estimator</h2>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                    <p>
                        Determining whether to fix an aging appliance or invest in a new one is a common dilemma for homeowners. Our **AI-powered diagnosis tool** takes the guesswork out of the equation. By scanning your appliance&apos;s rating plate and analyzing reported symptoms, we provide a real-time estimate for parts and labor based on current retail catalogs and local Hemingway service standards. Whether it&apos;s a washer that won&apos;t spin or a refrigerator that&apos;s lost its cool, get a professional-grade repair estimate in minutes.
                    </p>
                </div>
            </section>

            {/* 2. How it Works */}
            <section id="how-it-works" className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-200 scroll-mt-24">
                <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                    <Search className="text-blue-600" /> How This Repair Estimate Works
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold">1</div>
                            <div>
                                <h3 className="font-bold text-slate-900">Identification</h3>
                                <p className="text-sm text-slate-600">We decode your model and serial number to find the exact manufacture date and original MSRP.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold">2</div>
                            <div>
                                <h3 className="font-bold text-slate-900">Diagnosis</h3>
                                <p className="text-sm text-slate-600">Our AI analyzes your symptoms against failure patterns for your specific model.</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold">3</div>
                            <div>
                                <h3 className="font-bold text-slate-900">Pricing</h3>
                                <p className="text-sm text-slate-600">We search major part retailers for current pricing and calculate labor hours for the repair.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold">4</div>
                            <div>
                                <h3 className="font-bold text-slate-900">Decision</h3>
                                <p className="text-sm text-slate-600">We compare the estimated repair cost against a replacement baseline to suggest the most practical path forward.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Coverage */}
            <section className="grid md:grid-cols-2 gap-12">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Common Problems We Diagnose</h2>
                    <ul className="space-y-3">
                        {[
                            'Washer won\'t drain or spin cycle is loud',
                            'Dryer not heating or takes too long to dry',
                            'Refrigerator not cooling or leaking water',
                            'Dishwasher not cleaning or won\'t start',
                            'Stove or Oven not heating evenly',
                            'Ice maker not working or slow'
                        ].map((item) => (
                            <li key={item} className="flex items-start gap-3 text-slate-600 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4 text-rose-600">When to &quot;Ditch It&quot;?</h2>
                    <p className="text-sm text-slate-600 mb-6">Common indicators that investing in a replacement is the more practical path:</p>
                    <ul className="space-y-3">
                        {[
                            'Repair cost is high relative to a newer, warrantied model',
                            'Appliance has reached the end of its expected life (10-12 years)',
                            'History of recurring failures or recent major repairs',
                            'Required parts are discontinued or no longer available (NLA)'
                        ].map((item) => (
                            <li key={item} className="flex items-start gap-3 text-slate-600 text-sm font-medium">
                                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* 4. FAQs */}
            <section>
                <h2 className="text-3xl font-black text-slate-900 mb-8">Frequently Asked Questions</h2>
                <div className="grid gap-6">
                    {[
                        {
                            q: "What symptoms should I include for best results?",
                            a: "Be as specific as possible! Mention when the issue happens (e.g., 'drains but won\'t spin'), any error codes displayed, unusual sounds (clicking, banging), or smells (burning rubber)."
                        },
                        {
                            q: "Can I run this for multiple appliances?",
                            a: "Yes! The tool is free to use. You can diagnose your entire fleet of machines to prioritize which ones need immediate attention."
                        },
                        {
                            q: "What if I don't know the model number?",
                            a: "The tool works best with a photo of the rating plate. If you can't find it, look inside the door frame, on the back, or under the kickplate."
                        },
                        {
                            q: "Do you cover my area for service?",
                            a: "Road Runner Appliance provides on-site repair throughout our region! Call for details. If the tool recommends repair, and you are in our service area, you can book a tech immediately."
                        },
                        {
                            q: "Do you sell parts for DIY repairs?",
                            a: "Yes! We sell both new and used parts for most major appliance brands. Whether you're looking for a common belt or a specific control board, we can help you find what you need to get the job done."
                        }
                    ].map((faq, i) => (
                        <div key={i} className="group border-b border-slate-100 pb-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                {faq.q}
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 6. Internal Linking - Related Guides */}
            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Popular Repair Cost Guides</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { title: "Washer Won't Drain", slug: "washer-wont-drain-causes-repair-costs" },
                        { title: "Dryer Not Heating", slug: "dryer-not-heating-common-fixes" },
                        { title: "Fridge Not Cooling", slug: "refrigerator-not-cooling-troubleshooting" },
                        { title: "Spin Cycle Loud", slug: "loud-banging-spin-cycle-diagnosis" }
                    ].map(guide => (
                        <Link
                            key={guide.slug}
                            href={`/guides/repair/${guide.slug}`}
                            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-center justify-between group"
                        >
                            <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700">{guide.title}</span>
                            <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </Link>
                    ))}
                </div>
            </section>

            {/* 5. Local SEO Module */}
            <section className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white text-center">
                <MapPin className="w-10 h-10 text-blue-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-4 italic">Need Service or Used Appliance in Hemingway or Beyond?</h2>
                <p className="text-slate-400 max-w-2xl mx-auto mb-8">
                    We&apos;ve been servicing Hemingway, Florence, Georgetown, and Myrtle Beach for years.
                    If our Fix It or Ditch tool suggests it&apos;s worth fixing, our local technicians are ready to get you back up and running.
                </p>
                <div className="flex justify-center">
                    <a href="tel:843-536-6005" className="px-8 py-4 bg-blue-600 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                        Schedule Service
                    </a>
                </div>
            </section>
        </div>
    );
}
