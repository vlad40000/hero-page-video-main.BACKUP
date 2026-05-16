# AI Agent & Model Registry

## 1. Nameplate Analyzer Agent
*   **Function**: `analyzeProductImage`
*   **File**: `lib/flood-engine/services/geminiService.ts:94`
*   **Model**: `gemini-3-flash-preview` (Vision)
*   **Purpose**: Extract structured data (Brand, Model, Serial) from raw image.
*   **Prompt Location**: `geminiService.ts:104-120`
*   **Tools**: Vision Capabilities (MIME type + Base64 injection).
*   **Determinism**: Default (Temperature/TopP not set).
*   **Call Site**: `geminiService.ts:124`

## 2. Listing Photo Analyzer Agent
*   **Function**: `analyzeListingPhoto`
*   **File**: `lib/flood-engine/services/geminiService.ts:164`
*   **Model**: `gemini-3-flash-preview` (Vision)
*   **Purpose**: Grade aesthetic condition and verify match against claimed brand/model.
*   **Prompt Location**: `geminiService.ts:182-203`
*   **Tools**: Vision Capabilities.
*   **Determinism**: Default.
*   **Call Site**: `geminiService.ts:207`

## 3. Specs Lookup Agent
*   **Function**: `lookupApplianceSpecs`
*   **File**: `lib/flood-engine/services/geminiService.ts:249`
*   **Model**: `gemini-3-flash-preview`
*   **Purpose**: Find original MSRP and verify age using deterministic serial decode, current search evidence, and historical Wayback Machine evidence.
*   **Prompt Location**: `geminiService.ts:275-303`
*   **Tools**: `googleSearch` (Enabled via config `geminiService.ts:311`) plus the Wayback Machine / Internet Archive availability check (`checkWaybackAvailability`) for historical model/MSRP pages.
*   **Determinism**: Default.
*   **Call Site**: `geminiService.ts:307`

## 4. Description Generator Agent
*   **Function**: `generateApplianceDescription`
*   **File**: `lib/flood-engine/services/geminiService.ts:431`
*   **Model**: `gemini-3-flash-preview`
*   **Purpose**: Write SEO-friendly Markdown sales copy.
*   **Prompt Location**: `geminiService.ts:441-493`
*   **Tools**: 
    *   Primary: `googleSearch` (`geminiService.ts:503`).
    *   Fallback: None (Pure generation `geminiService.ts:524`).
*   **Determinism**: Default.
*   **Call Site(s)**: 
    *   Primary: `geminiService.ts:499`
    *   Fallback: `geminiService.ts:524`

## 5. Bulk Description Agent
*   **Function**: `generateBulkDescriptions`
*   **File**: `lib/flood-engine/services/geminiService.ts:349`
*   **Model**: `gemini-3-flash-preview`
*   **Purpose**: Batch process multiple items for description generation.
*   **Prompt Location**: `geminiService.ts:352-370`
*   **Tools**: None (Fast generation).
*   **Determinism**: Default.
*   **Call Site**: `geminiService.ts:374`
