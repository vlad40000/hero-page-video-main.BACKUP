"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, ShoppingBag, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const HIDDEN_PREFIXES = [
  "/corporate",
  "/employee",
  "/forms",
  "/inventory",
  "/leasing",
  "/packages",
  "/place-order",
  "/resident",
  "/sales",
  "/tools/fix",
  "/wholesale",
];

export function MobileConversionBar() {
  const pathname = usePathname();

  if (HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null;
  }

  const shopActive = pathname === "/shop" || pathname.startsWith("/products/") || [
    "/washers",
    "/dryers",
    "/refrigerators",
    "/dishwashers",
    "/stoves-ranges",
    "/washer-dryer-sets",
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const repairActive = pathname === "/service" || pathname.startsWith("/service/") || pathname.startsWith("/guides/repair/");

  return (
    <>
      <div
        aria-hidden="true"
        className="h-[calc(4.75rem+env(safe-area-inset-bottom))] lg:hidden"
      />
      <nav
        aria-label="Quick actions"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2">
          <Link
            href="/shop"
            aria-current={shopActive ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
              shopActive ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50 hover:text-blue-700",
            )}
          >
            <ShoppingBag className="h-5 w-5" />
            Shop
          </Link>
          <Link
            href="/service"
            aria-current={repairActive ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
              repairActive ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50 hover:text-blue-700",
            )}
          >
            <Wrench className="h-5 w-5" />
            Repair
          </Link>
          <a
            href="tel:843-536-6005"
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-emerald-600 px-2 py-2 text-xs font-extrabold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            aria-label="Call Road Runner Appliance at 843-536-6005"
          >
            <Phone className="h-5 w-5" />
            Call
          </a>
        </div>
      </nav>
    </>
  );
}
