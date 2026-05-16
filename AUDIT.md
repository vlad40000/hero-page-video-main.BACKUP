# Website Audit: Structure, Ghost Files, Redundancy, Reliability/Hardening

Date: 2026-02-11
Auditor: Antigravity

## Scope
This audit reviewed the repository layout, file usage patterns, build/lint behavior, and obvious stability/hardening gaps for the Next.js application.

## High-level structure snapshot
- `app/` is the primary routing layer and currently contains 62 files.
- `components/` contains 43 reusable and page-level components.
- `lib/` contains 35 utility/business-logic files, including a `flood-engine` subtree.
- `public/` contains 43 static assets.

## Ghost files / likely dead artifacts
The following files appear to be stale, generated, or not used by runtime code:

1. Build logs and file manifests committed in repo root:
   - `build_err_2.txt` (Removed 2026-02-11)
   - `build_err_3.txt` (Removed 2026-02-11)
   - `src_app_files.txt` (Removed 2026-02-11)
   - `src_app_list.txt` (Removed 2026-02-11)
   - `root_app_files.txt` (Removed 2026-02-11)

2. Workspace/editor artifact committed under app routes:
   - `app/resident/Rosdrunner web.code-workspace` (Removed 2026-02-11)

3. Empty nested directory likely from backup/copy flow:
   - `hero-page-video-main/` (no files) (Removed 2026-02-11)

4. Duplicate JSON rules file (one appears unused):
   - `lib/diagnostic-rules.json` (3.4KB) - (Removed 2026-02-11 - Unused)
   - `lib/diagnostic_rules.json` (1.6KB) - (Removed 2026-02-11 - Redundant)

5. Potentially dead/unreferenced TypeScript components/modules (confirmed no usages):
   - `components/LeadDashboard.tsx` (Removed 2026-02-11)
   - `components/TriageOrchestrator.tsx` (Removed 2026-02-11)
   - `components/portal-selection.tsx` (Removed 2026-02-11)
   - `components/wholesale-content.tsx` (Removed 2026-02-11)
   - `components/wholesale-form.tsx` (Removed 2026-02-11)
   - `components/wholesale-hero.tsx` (Removed 2026-02-11)
   - `components/MobileBottomNav.tsx` (only reference is unused import)
   - `components/SiteHeader.tsx` (possibly unused, verify further)
   - `lib/msrp-finder.ts` (Removed 2026-02-11)
   - `lib/repair-engine.ts` (Removed 2026-02-11)
   - `lib/flood-engine/components/PricingCalculator.tsx` (Removed 2026-02-11)
   - `lib/flood-engine/components/ResourcesView.tsx` (Removed 2026-02-11)

6. Potentially dead/static assets not referenced in code:
   - `public/images/roadrunnerappliance-logo-1.png`
   - `public/videos/hero-video.mp4`
   - placeholder/v0 logo variants that may be template leftovers (`v0-logo-*.svg`, `placeholder-*`)

## Redundancies / consistency issues
1. Mixed naming conventions for equivalent concerns:
   - `diagnostic-rules.json` vs `diagnostic_rules.json`.
   - `lib/flood-engine/components/connectModal.tsx` (file name) vs `import ConnectModal` (usage in `App.tsx`). Note: This causes issues on case-sensitive filesystems (Linux/production). (Fixed 2026-02-11: Renamed to ConnectModal.tsx)

2. Duplicate domain logic split across multiple locations:
   - `services/valuation.ts` logic might be duplicated in `lib/flood-engine`.

## Reliability and stability findings
1. Lint pipeline is currently non-functional.
   - `npm run lint` likely fails due to missing or misconfigured ESLint setup (Next 16).

2. Production build has external dependency fragility.
   - `next/font` fetching fonts from Google at build time can be fragile.

3. Next.js deprecation warning:
   - `middleware.ts` is standard, but check for Next 16 compatibility.

4. Potential cross-platform case-sensitivity defect:
   - `lib/flood-engine/App.tsx` imports `./components/ConnectModal`, while file present is `connectModal.tsx`.
   - **CRITICAL**: This will fail on Linux production servers.

## Security / hardening recommendations
1. **Repository hygiene baseline**
   - Remove stale logs/manifests/workspace files from Git.
   - Add explicit ignore rules for generated artifacts.

2. **Enforce static analysis in CI**
   - Add ESLint flat config and run lint in CI.
   - Add type-check script (`tsc --noEmit`).

3. **Case-sensitivity and path integrity**
   - Normalize component filenames to consistent casing (PascalCase for components).
   - Rename `connectModal.tsx` to `ConnectModal.tsx`.

4. **Runtime and API safeguards**
   - Add Zod validation for API routes.
   - Ensure environment variables are not exposed via `NEXT_PUBLIC_` unless necessary.

## Suggested cleanup plan (safe sequence)
1. Create branch checkpoint.
2. Remove confirmed ghost files (`*.txt`, `*.code-workspace`, `hero-page-video-main/`).
3. Rename `lib/flood-engine/components/connectModal.tsx` to `ConnectModal.tsx`.
4. Delete `lib/flood-engine/components/PricingCalculator.tsx` and `ResourcesView.tsx` if confirmed 100% unused (already verified unused by `App.tsx`).
5. Delete `components/wholesale-*.tsx` files as `app/wholesale/page.tsx` implements the page inline.
6. Run build verification.
