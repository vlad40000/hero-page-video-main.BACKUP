# AI Endpoint Contract Catalog

## 1. `analyzeProductImageAction`
*   **Method**: Server Action (POST)
*   **File**: `lib/flood-engine/actions.ts:11`
*   **Caller(s)**: `InventoryForm.tsx:263` (`handleNameplateUpload`)
*   **Input Schema**:
    ```typescript
    base64Data: string // Image data URI
    ```
*   **Output Schema** (JSON):
    ```typescript
    {
        title?: string;
        brand?: string;
        model?: string;
        serial?: string;
        category?: string;
        price?: number | string;
        description?: string;
    }
    ```
*   **Error Handling**:
    *   catches internal errors -> logs to console (`geminiService.ts:159`).
    *   throws error to client -> allows client `try/catch` to handle UI feedback.
*   **Model/Tool**: `gemini-3-flash-preview` (Vision). No external tools.

## 2. `analyzeListingPhotoAction`
*   **Method**: Server Action (POST)
*   **File**: `lib/flood-engine/actions.ts:15`
*   **Caller(s)**: `InventoryForm.tsx:234` (`handleProductImageUpload`)
*   **Input Schema**:
    ```typescript
    base64Data: string;
    claimedBrand?: string;
    claimedModel?: string;
    ```
*   **Output Schema**:
    ```typescript
    {
        condition: string; // "excellent" | "good" | "fair" | "new"
        conditionReasoning: string;
        isMatch: boolean;
        matchReasoning: string;
    }
    ```
*   **Error Handling**:
    *   catches internal errors -> Returns fallback object `{ condition: "good", isMatch: true, ... }` (`geminiService.ts:240`). **Does NOT throw**.
*   **Model/Tool**: `gemini-3-flash-preview` (Vision).

## 3. `lookupApplianceSpecsAction`
*   **Method**: Server Action (POST)
*   **File**: `lib/flood-engine/actions.ts:23`
*   **Caller(s)**: `InventoryForm.tsx:288` (`handleSerialLookup`)
*   **Input Schema**:
    ```typescript
    brand: string;
    model: string;
    serial: string;
    ```
*   **Output Schema**:
    ```typescript
    {
        msrp: number;
        ageMonths: number;
        notes: string;
        sources: Array<{ title: string; uri: string }>;
    }
    ```
*   **Error Handling**:
    *   catches internal errors -> Returns fallback object `{ msrp: 0, ageMonths: 0, ... }` (`geminiService.ts:345`). **Does NOT throw**.
*   **Model/Tool**: `gemini-3-flash-preview` with `googleSearch` tool.
*   **Historical MSRP/Age Evidence**: The specs lookup path must include the Wayback Machine / Internet Archive availability check (`checkWaybackAvailability`) after live search so older appliance model pages can still support original MSRP and age estimates. If Wayback evidence is unavailable, the response should remain low-confidence rather than inventing MSRP.

## 4. `generateDescriptionAction`
*   **Method**: Server Action (POST)
*   **File**: `lib/flood-engine/actions.ts:32`
*   **Caller(s)**: `InventoryForm.tsx:120` (`generateDescriptionSafely`)
*   **Input Schema**:
    ```typescript
    brand: string;
    model: string;
    category: string;
    condition: string;
    specs?: { originalPrice?: string; ageMonths?: string };
    ```
*   **Output Schema**:
    ```typescript
    {
        description: string; // Markdown
        seoKeywords: string[];
    }
    ```
*   **Error Handling**:
    *   **Internal Retry**: If Google Search fails, auto-retries without tools (`geminiService.ts:523`).
    *   **Result**: If both fail, throws error to client.
*   **Model/Tool**: `gemini-3-flash-preview`. Uses `googleSearch` primarily, falls back to pure generation.

## 5. `generateBulkDescriptionsAction`
*   **Method**: Server Action (POST)
*   **File**: `lib/flood-engine/actions.ts:28`
*   **Caller(s)**: `app/employee/inventory/page.tsx` (Bulk Toolbar - *Inferred*)
*   **Input Schema**:
    ```typescript
    items: MarketplaceListing[];
    ```
*   **Output Schema**:
    ```typescript
    Array<Partial<MarketplaceListing>>
    ```
*   **Error Handling**:
    *   catches internal errors -> Returns original items unmodified (`geminiService.ts:422`).
*   **Model/Tool**: `gemini-3-flash-preview`. No external tools.
