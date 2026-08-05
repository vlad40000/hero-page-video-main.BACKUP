"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, MapPin, Menu, Phone, Wrench, X } from "lucide-react";
import { cn } from "@/lib/utils";

const DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1&destination=123+W.+Broad+St.+Hemingway,+SC+29554";

const NAV_ITEMS = [
  { href: "/shop", label: "Shop Appliances" },
  { href: "/service", label: "Repair Service" },
  { href: "/parts", label: "Parts" },
  { href: "/#about", label: "About" },
];

export const SiteHeader = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname === "/tools/fix") return null;

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-3 px-3 sm:px-4 lg:px-8">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:gap-3"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Image
              src="/road-runner-logo.png"
              alt="Road Runner Appliance"
              width={48}
              height={48}
              className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
              priority
            />
            <span className="max-w-[10rem] truncate text-sm font-black leading-tight tracking-tight text-slate-950 sm:max-w-none sm:text-base">
              Road Runner Appliance
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-lg px-4 py-2 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-50 hover:text-blue-700",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="tel:843-536-6005"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-extrabold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 sm:px-4"
              title="Call Road Runner Appliance"
            >
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">Call 843-536-6005</span>
              <span className="sm:hidden">Call</span>
            </a>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-900 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 lg:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div
          id="mobile-navigation"
          className="fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto bg-white px-4 py-5 shadow-2xl lg:hidden"
        >
          <nav className="mx-auto max-w-lg space-y-2" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "flex min-h-14 items-center justify-between rounded-2xl border px-4 py-3 text-lg font-extrabold transition active:scale-[0.99]",
                  isActive(item.href)
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-slate-50 text-slate-950 hover:border-blue-200 hover:bg-blue-50",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </Link>
            ))}
          </nav>

          <div className="mx-auto mt-6 grid max-w-lg gap-3 sm:grid-cols-2">
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <MapPin className="h-5 w-5" />
              Get Directions
            </a>
            <Link
              href="/tools/fix"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Wrench className="h-5 w-5" />
              Troubleshoot
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
};
