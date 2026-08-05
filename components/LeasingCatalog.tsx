"use client";

import React, { useCallback } from "react";
import { LeasingProductCard } from "./LeasingProductCard";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const LEASING_PRODUCTS = [
    {
        name: "Large Capacity Washer & Dryer Combo",
        specs: "4.2 cu ft Top-Load Washer & 7.2 cu ft Electric Dryer in White",
        description: "The perfect pair for a busy household. These units are built to take on your toughest laundry days while being gentle on your power bill.",
        newPrice: "$59.99",
        usedPrice: "$54.99",
        image: "/images/leasing/washer-dryer-set.png",
        features: [
            "67% more cleaning power",
            "Auto Dry technology",
            "High-capacity 4.2 cu ft",
            "Professional grade performance"
        ],

    },
    {
        name: "Standard Washer & Dryer Combo",
        specs: "3.5 cu ft Top Load Washer & 6.5 cu ft Electric Dryer in White",
        description: "Achieve beautifully clean clothing with both the 3.5 cu ft top load washer, and the 6.5 cu ft electric dryer. This washer is armed with 120-volts of power and a 3.5 cu ft capacity while the spacious 6.5 cu ft dryer allows you to do more laundry in less time.",
        newPrice: "$49.99",
        usedPrice: "$43.99",
        image: "/images/leasing/washer-dryer-set.png",
        features: [
            "120-volts of power",
            "Dual Action Agitator",
            "Automatic Dryness Control",
            "Efficiency optimized"
        ],

    },
    {
        name: "Stackable Washer & Dryer Combo",
        specs: "2.0 cu ft Washer & 4.4 cu ft Electric Dryer",
        description: "Featuring a space-saving stacked design, this washer and electric dryer was designed with fast, easy and effective use in mind. The washer’s auto-load sensing means it will automatically measure the load size and add the right amount of water.",
        newPrice: "$53.99",
        usedPrice: "$46.99",
        image: "/images/leasing/stackable-combo.jpg",
        features: [
            "Space-saving stacked design",
            "Auto-load sensing technology",
            "Ideal for urban living",
            "Fast cycle performance"
        ],

    },
    {
        name: "Standard Washer",
        specs: "3.5 cubic feet (cu ft) Top Load Washer with Dual Action Agitator in White",
        description: "Achieve beautifully clean clothing with this top load washer with dual action agitator in white, armed with 120-volts of power and a 3.5 cu ft capacity that allows you to do more laundry in less time.",
        newPrice: "$25.00",
        image: "/images/leasing/washer.png",
        features: [
            "Dual Action Agitator",
            "High-torque 120v motor",
            "Compact sizing",
            "Reliable daily operation"
        ]
    },
    {
        name: "Standard Dryer",
        specs: "6.5 cu ft Electric Dryer with Automatic Dryness Control in White",
        description: "Reliable drying that doesn't break the bank. This unit handles large loads easily and keeps your clothes wrinkle-free, so you spend less time ironing and more time relaxing.",
        newPrice: "$25.00",
        image: "/images/leasing/dryer.png",
        features: [
            "6.5 cu ft spacious drum",
            "Automatic Dryness Control",
            "Wrinkle prevent cycle",
            "Quiet-flow technology"
        ]
    }
];



export function LeasingCatalog() {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        align: "start",
        containScroll: "trimSnaps"
    });

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    return (
        <section id="catalog" className="py-24 bg-white relative">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                        Our Leasing <span className="text-blue-600">Collection</span>
                    </h2>
                    <p className="text-xl text-slate-600 leading-relaxed">
                        Select a product below and get your delivery scheduled with Road Runner Appliance today!
                    </p>
                </div>

                <div className="relative group">
                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex -ml-4 py-8">
                            {LEASING_PRODUCTS.map((product, index) => (
                                <div key={index} className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.33%] min-w-0 pl-4">
                                    <LeasingProductCard {...product} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    {/* Left Arrow - Mobile: Small icon, Desktop: Full button */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-2 md:left-0 top-1/2 -translate-y-1/2 md:-translate-x-1/2 h-10 w-10 md:h-14 md:w-14 rounded-full shadow-lg md:shadow-xl bg-white/90 md:bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-blue-300 z-10"
                        onClick={scrollPrev}
                    >
                        <ChevronLeft className="h-5 w-5 md:h-8 md:w-8 text-slate-700" />
                    </Button>

                    {/* Right Arrow - Mobile: Small icon, Desktop: Full button */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 md:right-0 top-1/2 -translate-y-1/2 md:translate-x-1/2 h-10 w-10 md:h-14 md:w-14 rounded-full shadow-lg md:shadow-xl bg-white/90 md:bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-blue-300 z-10"
                        onClick={scrollNext}
                    >
                        <ChevronRight className="h-5 w-5 md:h-8 md:w-8 text-slate-700" />
                    </Button>
                </div>

                <div className="mt-16 p-10 bg-slate-900 rounded-[3rem] text-center text-white relative overflow-hidden max-w-7xl mx-auto">
                    <div className="relative z-10">
                        <h3 className="text-3xl font-bold mb-4">Didn&apos;t find the perfect match?</h3>
                        <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
                            We get new arrivals daily. Give our leasing team a call and we&apos;ll help you find exactly what you&apos;re looking for.
                        </p>
                        <a href="#cta" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/40">
                            Speak with a Leasing Specialist
                        </a>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
                </div>
            </div>
        </section>
    );
}
