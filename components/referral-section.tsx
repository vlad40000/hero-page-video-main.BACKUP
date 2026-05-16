import { HandHeart, Users } from "lucide-react";

export function ReferralSection() {
    return (
        <section id="referral-program" className="py-20 bg-blue-50 border-t border-blue-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-blue-100 relative overflow-hidden">
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-60"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-60"></div>

                    <div className="relative z-10 grid md:grid-cols-3 gap-10 items-center">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-blue-100 p-3 rounded-xl transform rotate-3">
                                    <Users className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
                                    Share the Love, Get Rewarded
                                </h2>
                            </div>

                            <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                                <p>
                                    <span className="font-semibold text-slate-900">We’re a local, family-owned shop,</span> and our best customers come from word-of-mouth.
                                </p>
                                <p className="italic border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 rounded-r-lg">
                                    &quot;If you love your new washer or dryer, tell a friend! When they make a purchase, we’ll give you a <span className="font-bold text-blue-700">$50 Service Credit</span> to use toward any future repair or maintenance. It’s our way of saying thanks for being a great neighbor.&quot;
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center text-center bg-blue-600 rounded-2xl p-8 text-white shadow-lg transform md:-rotate-1 hover:rotate-0 transition-transform duration-300">
                            <HandHeart className="w-16 h-16 mb-4 text-blue-200" />
                            <div className="text-5xl font-black mb-1">$50</div>
                            <div className="text-xl font-bold uppercase tracking-wide mb-4 text-blue-100">Service Credit</div>
                            <p className="text-sm text-blue-100 opacity-90">
                                For every friend you refer who makes a purchase.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
