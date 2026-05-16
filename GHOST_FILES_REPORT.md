# Ghost File Audit Report

## 1. Confirmed Ghost Files (Safe to Delete)
These files have **zero** references in the codebase and appear to be superseded by the `lib/flood-engine` architecture.

| Path | Size | Reason | Replaced By |
| :--- | :--- | :--- | :--- |
| `services/geminiService.ts` | 4.7KB | Unused Duplicate | `lib/flood-engine/services/geminiService.ts` |
| `services/decoder.ts` | 1.8KB | Unused Duplicate | `lib/flood-engine/services/serialDecoder.ts` |
| `services/valuation.ts` | 4.2KB | Unused Duplicate | `lib/flood-engine/services/pricingEngine.ts` |
| `services/repair.ts` | 8.1KB | Unused | No direct replacement found, likely dead feature. |
| `app/api/identify/route.ts` | 4.9KB | Unused Legacy API | `analyzeProductImageAction` (Server Action) |

## 2. Active Legacy Files (DO NOT DELETE)
These files are in root directories but are **still in use** by the application.

| Path | Used By | Status |
| :--- | :--- | :--- |
| `actions/wholesale.ts` | `app/wholesale/page.tsx` | **Protected** |
| `actions/booking.ts` | `components/BookingForm.tsx` | **Protected** |
| `actions/auth.ts` | `app/employee/login/page.tsx` | **Protected** |

## 3. Needs Review
These files have no internal references but might be used by external tools or are incomplete features.

| Path | Reason | Recommendation |
| :--- | :--- | :--- |
| `app/api/leads/route.ts` | No internal usage found. Standard lead capture endpoint. | Keep (Low risk) |
| `app/api/seed/route.ts` | Developer utility? | Keep (Dev tools) |

## Action Plan
1.  **DELETE** the entire `services/` directory.
2.  **DELETE** the `app/api/identify` directory.
3.  **KEEP** `actions/` and `app/api/leads` for now.
