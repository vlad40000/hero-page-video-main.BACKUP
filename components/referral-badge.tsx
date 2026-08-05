"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function ReferralBadge() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show badge after scrolling down a bit (e.g., 200px)
            if (window.scrollY > 200) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToReferral = (e: React.MouseEvent) => {
        e.preventDefault();
        const element = document.getElementById("referral-program");
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <button
            onClick={scrollToReferral}
            className={cn(
                "fixed bottom-6 right-6 z-50 transition-all duration-500 hover:scale-110",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
            )}
            aria-label="Referral Program"
        >
            <div className="relative group">
                {/* Use the specific referral badge image */}
                <Image
                    src="/images/referral-badge-final.png"
                    alt="Refer a Friend! Get $50 Credit"
                    width={144}
                    height={144}
                    className="w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-2xl hover:brightness-110 transition-all"
                />

                {/* Tooltip on hover */}
                <div className="absolute -top-12 right-0 bg-white text-slate-900 px-4 py-2 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap font-bold text-sm border-2 border-blue-500">
                    Refer a neighbor & save!
                    <div className="absolute bottom-[-6px] right-8 w-3 h-3 bg-white border-b-2 border-r-2 border-blue-500 transform rotate-45"></div>
                </div>
            </div>
        </button>
    );
}
