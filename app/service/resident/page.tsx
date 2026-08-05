import Image from "next/image";
import { LeasingCatalog } from "@/components/LeasingCatalog";
import { Metadata } from 'next';
import { ShoppingCart, CheckCircle, Clock, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
    title: 'Resident Leasing Portal | Road Runner Inc Appliance',
    description: 'Easy and affordable washer and dryer leasing for residents. Next-day delivery and free maintenance included.',
    alternates: {
        canonical: '/service/resident',
    },
};

export default function ResidentPortal() {
    return (
        <>
            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative bg-slate-50 py-20 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
                                    Quality Used Appliances <br />
                                    <span className="text-blue-600">You Can Actually Trust</span>
                                </h1>
                                <p className="text-xl text-slate-600 mb-8 max-w-lg">
                                    We know a broken appliance is a major headache. Since we&apos;re right here in Hemingway, we make it easy to get a reliable replacement or a professional repair without the &quot;new appliance&quot; price tag.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <a href="#catalog" className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg text-center">
                                        Browse Appliances
                                    </a>
                                    <a href="#get-started" className="border border-slate-300 text-slate-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-100 transition text-center">
                                        How to Get Started
                                    </a>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="bg-white p-4 rounded-3xl shadow-2xl rotate-3">
                                    <Image
                                        src="/images/products/resident-hero-final-v2.png"
                                        alt="Modern Washer and Dryer"
                                        width={720}
                                        height={540}
                                        className="rounded-2xl w-full h-auto"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="get-started" className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-4 gap-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <ShoppingCart className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">Easy Selection</h3>
                                <p className="text-slate-500 text-sm">Choose the perfect set for your home and needs.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">Fast Delivery</h3>
                                <p className="text-slate-500 text-sm">Next-day delivery and professional installation.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <ShieldCheck className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">Free Repairs</h3>
                                <p className="text-slate-500 text-sm">Full maintenance and repair service included.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">Top Performance</h3>
                                <p className="text-slate-500 text-sm">Energy-efficient, newer model appliances.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Catalog Section */}
                <LeasingCatalog />

                {/* CTA Section */}
                <section className="py-20 bg-slate-900 text-white">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to upgrade your laundry?</h2>
                        <p className="text-xl text-slate-400 mb-10">
                            Join thousands of residents who enjoy hassle-free appliance leasing.
                        </p>
                        <a href="tel:843-536-6005" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-5 rounded-2xl transition-all shadow-xl text-xl">
                            Call to Order: 843-536-6005
                        </a>
                    </div>
                </section>
            </main>
        </>
    );
}
