"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

type Params = Record<string, string | number | boolean>;

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: Params) => void;
  }
}

/**
 * Global click instrumentation for Road Runner Appliance.
 *
 * Mount ONCE in app/layout.tsx. Uses event delegation on the document, so every
 * tel:, mailto:, and maps link on the site is tracked automatically — no need to
 * touch the 29 files that contain CTAs.
 *
 * To track anything else, add data-track to the element:
 *   <button data-track="offer_claim" data-track-model="GTW500ASN0WS">…</button>
 * Any data-track-* attribute is forwarded as an event param.
 */
export function ClickTracker() {
  useEffect(() => {
    // Vercel Pro allows 2 keys max per custom event object (8 with Web Analytics
    // Plus). Raise to 8 only if you upgrade. GA4 has no comparable limit, so it
    // receives the full payload.
    const VERCEL_KEY_LIMIT = 2;

    // Highest-value keys first — the survivors of the truncation below.
    const VERCEL_KEY_PRIORITY = ["model", "placement", "link_text", "page_path"];

    function forVercel(params: Params): Params {
      const ordered = Object.keys(params).sort((a, b) => {
        const ia = VERCEL_KEY_PRIORITY.indexOf(a);
        const ib = VERCEL_KEY_PRIORITY.indexOf(b);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      });

      const out: Params = {};
      for (const key of ordered.slice(0, VERCEL_KEY_LIMIT)) {
        const value = params[key];
        // Vercel rejects values over 255 chars.
        out[key] = typeof value === "string" ? value.slice(0, 255) : value;
      }
      return out;
    }

    function send(name: string, params: Params) {
      window.gtag?.("event", name, {
        ...params,
        // Guarantees the request survives the dialer handoff on the money event.
        ...(name === "call_click" ? { transport_type: "beacon" } : {}),
      });
      track(name, forVercel(params));

      if (process.env.NODE_ENV === "development") {
        console.debug("[track]", name, params, "→ vercel:", forVercel(params));
      }
    }

    function classify(el: HTMLElement, href: string): string | null {
      // Phone links always stay on the hardened call path. This prevents a future
      // data-track attribute from accidentally moving a tel: CTA back to click-phase.
      if (href.startsWith("tel:")) return "call_click";

      const explicit = el.closest<HTMLElement>("[data-track]")?.dataset.track;
      if (explicit) return explicit;
      if (href.startsWith("mailto:")) return "email_click";
      if (/maps\.google|google\.[a-z.]+\/maps/i.test(href)) return "directions_click";
      if (/facebook\.com|nextdoor\.com/i.test(href)) return "social_click";
      if (/^\/products\//.test(href)) return "product_click";
      if (/^\/(shop|washers|dryers|refrigerators|dishwashers|stoves-ranges|washer-dryer-sets)(\/|$)/.test(href))
        return "inventory_click";
      if (/^\/(service|guides\/repair)(\/|$)/.test(href)) return "repair_click";
      return null;
    }

    // Tapping a tel: link can hand off to the dialer before a click-phase beacon
    // flushes. Calls are the money event here, so they fire on pointerdown and
    // the follow-up click is suppressed.
    let lastCall: { el: HTMLElement; ts: number } | null = null;

    function handle(event: Event, phase: "pointerdown" | "click") {
      const target = event.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>("a, button, [data-track]");
      if (!el) return;

      const raw = el.getAttribute("href") ?? "";
      // Normalize absolute same-origin URLs down to a path for cleaner reports.
      let href = raw;
      try {
        if (/^https?:/i.test(raw)) {
          const url = new URL(raw);
          if (url.origin === window.location.origin) href = url.pathname;
        }
      } catch {
        /* leave href as-is */
      }

      const name = classify(el, href);
      if (!name) return;

      const isCall = name === "call_click";
      if (phase === "pointerdown" && !isCall) return;

      if (isCall) {
        const now = Date.now();
        if (lastCall && lastCall.el === el && now - lastCall.ts < 1500) return;
        lastCall = { el, ts: now };
      }

      const params: Params = {
        link_url: raw.slice(0, 200),
        link_text: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 100),
        page_path: window.location.pathname,
        placement: el.closest<HTMLElement>("[data-placement]")?.dataset.placement ?? "unknown",
      };

      // Forward any data-track-* attributes (e.g. data-track-model → model).
      // These override the defaults above.
      for (const [key, value] of Object.entries(el.dataset)) {
        if (key.startsWith("track") && key !== "track" && value) {
          const paramKey = key.slice(5).replace(/^[A-Z]/, (c) => c.toLowerCase());
          params[paramKey] = value.slice(0, 100);
        }
      }

      send(name, params);
    }

    const onPointerDown = (e: Event) => handle(e, "pointerdown");
    const onClick = (e: Event) => handle(e, "click");

    // Capture phase: fires before navigation/dialer handoff.
    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, { capture: true });
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

  return null;
}
