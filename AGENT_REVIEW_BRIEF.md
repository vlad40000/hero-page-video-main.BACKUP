# Agent Review Brief — AI Field Population & Call Paths

## 1. Scope
*   **Included Files**:
    *   `app/employee/inventory/_components/InventoryForm.tsx` (UI/State)
    *   `lib/flood-engine/services/geminiService.ts` (AI Logic/Prompts)
    *   `lib/flood-engine/actions.ts` (Server Entrykits)
    *   `lib/flood-engine/types.ts` (Data Schemas)
*   **Excluded Files**:
    *   `app/api/*` (Legacy routes not used in this specific flow)
    *   `components/*` (Generic UI components)

## 2. Verified Claims Table
| Claim ID | Claim | Evidence | File | Lines | Confidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| C-01 | Description auto-generates reactively on field change | `useEffect` calls `generateDescriptionSafely` | `InventoryForm.tsx` | 144-156 | High |
| C-02 | User manual edits are protected from overwrite | `descriptionTouched` check in guard clause | `InventoryForm.tsx` | 106, 130 | High |
| C-03 | Duplicate API calls prevented | `lastAutoGenKey` comparison | `InventoryForm.tsx` | 107-108 | High |
| C-04 | Nameplate analysis parses text to JSON | `cleanAndParseJSON` utility used | `geminiService.ts` | 157 | High |
| C-05 | Specs lookup uses Google Search tool | `tools: [{ googleSearch: {} }]` config | `geminiService.ts` | 503 | High |
| C-06 | Description generation has fallback | `try/catch` block switches to tool-less call | `geminiService.ts` | 519-547 | High |
| C-07 | All AI calls use `gemini-3-flash-preview` | Hardcoded string literal | `geminiService.ts` | 95, 174, 250, 438 | High |

## 3. Review Protocol (For Future Agents)
When updating or reviewing this system, you **MUST**:
1.  **Verify Code Anchors**: Ensure every claim in `docs/` has a valid file:line reference.
2.  **Check Redundancy**: If `InventoryForm.tsx` logic changes, update `ai-field-call-map.md`.
3.  **Check Models**: If `geminiService.ts` model strings change, update `agent-model-registry.md`.
4.  **Validate Contracts**: If `actions.ts` signatures change, update `ai-endpoint-catalog.md`.

## 4. Regression Watchlist
*   **IF** `InventoryForm.tsx` description `useEffect` is modified -> **RERUN** Section 2 (Call Graphs) in `ai-field-call-map.md`.
*   **IF** `geminiService.ts` prompt templates are edited -> **UPDATE** `agent-model-registry.md`.
*   **IF** `types.ts` `MarketplaceListing` interface changes -> **UPDATE** `ai-endpoint-catalog.md` Output Schemas.

## 5. Fast Acceptance Criteria
*   [ ] Every claim has file:line citation.
*   [ ] "Auto-Generate" (Reactive) and "Auto-Fill" (Button) flows are distinct.
*   [ ] Fallback paths (e.g., Search failure) are documented.
*   [ ] No "presumed" behavior; only "observed".
