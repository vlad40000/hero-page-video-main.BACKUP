'use server';

import { randomUUID } from 'node:crypto';

import { SchemaType } from '@google/generative-ai';
import { z } from 'zod';

import { getGeminiClient, runGeminiForTool } from '@/lib/ai/gemini-policy';
import { resolveAppliancePartsContext } from '@/lib/tools/parts/appliance-context';
import { resolveDiagnosisEvidence } from '@/lib/tools/parts/diagnosis-evidence';
import { verifyDiagnosticResultsWithPartsContext } from '@/lib/tools/parts/diagnosis-verifier';
import { resolveDiagnosticPartCandidates } from '@/lib/tools/parts/diagnostic-part-search';
import { applyEncompassPriceSnapshot } from '@/lib/tools/parts/part-number-store';
import { decodeSerialNumber } from '@/lib/tools/parts/serial/decoder';
import { ApplianceData, DiagnosticResult } from './types';

const FLASH_MODEL = 'gemini-3-flash-preview';
const LITE_MODEL = 'gemini-3.1-flash-lite-preview';

const APP_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        identification: {
            type: SchemaType.OBJECT,
            properties: {
                brand: { type: SchemaType.STRING },
                category: { type: SchemaType.STRING },
                manufactureDateRange: { type: SchemaType.STRING },
                manufactureDateLogic: { type: SchemaType.STRING },
                manufactureYear: { type: SchemaType.NUMBER },
                manufactureMonth: { type: SchemaType.NUMBER },
                originalMSRP: { type: SchemaType.STRING },
                confidence: { type: SchemaType.NUMBER }
            },
            required: ['brand', 'category', 'manufactureDateRange', 'manufactureYear', 'manufactureMonth', 'originalMSRP']
        }
    },
    required: ['identification']
};

const DIAGNOSIS_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        results: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    issue: { type: SchemaType.STRING },
                    partName: { type: SchemaType.STRING },
                    partNumber: { type: SchemaType.STRING },
                    laborHours: { type: SchemaType.NUMBER },
                    probability: { type: SchemaType.STRING },
                    description: { type: SchemaType.STRING }
                },
                required: ['issue', 'partName', 'partNumber', 'laborHours', 'probability', 'description']
            }
        }
    },
    required: ['results']
};

const AuditApplianceSchema = z.object({
    model: z.string().min(1, 'Model is required'),
    serial: z.string().optional()
});

const DiagnoseApplianceSchema = z.object({
    model: z.string().min(1, 'Model is required'),
    serial: z.string().optional(),
    symptom: z.string().min(1, 'Symptom is required'),
    brand: z.string().optional().nullable(),
    productType: z.string().optional().nullable()
});

function cleanJsonString(str: string): string {
    if (!str) return '{}';
    let text = str.replace(/```json/g, '').replace(/```/g, '');
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        text = text.substring(startIndex, endIndex + 1);
    }
    return text.trim();
}

function stringifyPartsForPrompt(parts: Array<Record<string, unknown>>) {
    return parts
        .slice(0, 120)
        .map((part) => {
            const pn = String(part.partNumber || '').trim();
            const name = String(part.partName || '').trim();
            const section = String(part.section || part.category || '').trim();
            return `- ${pn} | ${name}${section ? ` | ${section}` : ''}`;
        })
        .join('\n');
}

function monthFromDecoder(decoded: any, fallbackMonth: unknown) {
    const directMonth = Number(decoded?.decoded?.month ?? (decoded?.timeValue?.unit === 'month' ? decoded?.timeValue?.value : null));
    if (Number.isFinite(directMonth) && directMonth >= 1 && directMonth <= 12) return Math.round(directMonth);

    const week = Number(decoded?.decoded?.week ?? (decoded?.timeValue?.unit === 'week' ? decoded?.timeValue?.value : null));
    if (Number.isFinite(week) && week >= 1 && week <= 53) {
        return Math.max(1, Math.min(12, Math.ceil(week / 4.345)));
    }

    const fallback = Number(fallbackMonth);
    return Number.isFinite(fallback) && fallback >= 1 && fallback <= 12 ? Math.round(fallback) : 1;
}

const SYMPTOM_PART_HINTS: Array<{ match: RegExp; terms: string[] }> = [
    { match: /leak|leaking|water\s+under|water\s+on\s+floor/i, terms: ['fill hose', 'drain pump', 'tub seal', 'water inlet valve'] },
    { match: /\bdrain|standing water|won'?t empty|not empty/i, terms: ['drain pump', 'drain hose'] },
    { match: /\bfill|no water|slow fill|overfill/i, terms: ['water inlet valve', 'fill hose'] },
    { match: /heat|not heating|not drying|no heat/i, terms: ['heating element', 'thermal fuse', 'thermostat', 'igniter'] },
    { match: /cool|not cooling|warm fridge|not cold|freezer/i, terms: ['start relay', 'condenser fan motor', 'evaporator fan motor', 'thermostat'] },
    { match: /noise|loud|banging|grinding|vibrat/i, terms: ['drum bearing', 'drive belt', 'drum support roller', 'blower wheel'] },
    { match: /door|latch|lock|won'?t close/i, terms: ['door latch', 'door lock', 'door gasket', 'door hinge'] },
    { match: /spin|agitat|tumble/i, terms: ['drive belt', 'motor coupler', 'lid switch', 'clutch'] },
    { match: /ignit|burner|won'?t light|spark/i, terms: ['igniter', 'spark module', 'gas valve', 'surface burner'] },
    { match: /ice|dispens/i, terms: ['ice maker assembly', 'water inlet valve', 'ice maker module'] },
];

function getPredictedParts(symptom: string, contextParts: any[]): any[] {
    if (!symptom || !Array.isArray(contextParts) || contextParts.length === 0) return [];
    const matchingTerms: string[] = [];
    for (const hint of SYMPTOM_PART_HINTS) {
        if (hint.match.test(symptom)) matchingTerms.push(...hint.terms);
    }
    if (!matchingTerms.length) return [];
    return contextParts
        .filter((part) => {
            const haystack = `${part.partName || ''} ${part.category || ''} ${part.section || ''}`.toLowerCase();
            return matchingTerms.some((term) => haystack.includes(term.toLowerCase()));
        })
        .slice(0, 4);
}

function localSymptomDiagnosis(symptom: string) {
    const text = symptom.toLowerCase();
    if (/leak|water\s+under|water\s+on\s+floor/.test(text)) {
        return [
            {
                issue: 'Water leaking from washer fill or drain path',
                partName: 'Fill Hose',
                partNumber: '',
                laborHours: 0.75,
                probability: 'High',
                description: 'Leaks commonly come from loose, cracked, or worn fill hoses, especially near the wall valves or washer inlet.'
            },
            {
                issue: 'Water leaking from pump area',
                partName: 'Drain Pump',
                partNumber: '',
                laborHours: 1.25,
                probability: 'Medium',
                description: 'A leaking or cracked drain pump can leave water under the washer during drain or spin portions of the cycle.'
            },
            {
                issue: 'Water leaking from tub seal or bearing area',
                partName: 'Tub Seal and Bearing Kit',
                partNumber: '',
                laborHours: 3,
                probability: 'Medium',
                description: 'Leaks from the center underside of the tub can indicate worn seals or bearing-related repair parts.'
            }
        ];
    }

    if (/drain|standing water|won'?t empty|not empty/.test(text)) {
        return [{
            issue: 'Washer is not draining correctly',
            partName: 'Drain Pump',
            partNumber: '',
            laborHours: 1.25,
            probability: 'High',
            description: 'Drain failures commonly involve the pump, drain hose, or debris blocking the pump path.'
        }];
    }

    if (/fill|no water|slow fill|overfill/.test(text)) {
        return [{
            issue: 'Washer fill problem',
            partName: 'Water Inlet Valve',
            partNumber: '',
            laborHours: 1,
            probability: 'High',
            description: 'Fill problems commonly involve the inlet valve, fill hoses, screens, or water supply path.'
        }];
    }

    return [{
        issue: 'Likely appliance issue',
        partName: 'Service Part',
        partNumber: '',
        laborHours: 1.5,
        probability: 'Medium',
        description: 'A technician should verify the failed subsystem against the exact model parts list.'
    }];
}

async function generateContextAwareDiagnosis(input: {
    model: string;
    serial?: string;
    symptom: string;
    brand?: string | null;
    productType?: string | null;
    partsContext: any;
    requestContext?: Record<string, unknown> | null;
}) {
    const verifiedPartsList = stringifyPartsForPrompt(input.partsContext.parts || []);
    const contextWarnings = (input.partsContext.warnings || [])
        .map((warning: any) => `- ${warning.code}: ${warning.message}`)
        .slice(0, 8)
        .join('\n');

    const prompt = `
You are an expert appliance repair technician.

TASK:
Diagnose likely causes for the following problem:
- Appliance Model: ${input.model}
- Serial Number: ${input.serial || 'Not provided'}
- Brand: ${input.brand || input.partsContext.brand || 'Not provided'}
- Appliance/System: ${input.productType || input.partsContext.productType || 'Not provided'}
- Symptom: ${input.symptom}

MODEL-SPECIFIC PARTS CONTEXT FROM THE SHARED PART FINDER/BOM BACKEND:
Status: ${input.partsContext.status || 'unknown'}
Canonical Model: ${input.partsContext.canonicalModel || input.model}
Known Parts:
${verifiedPartsList || '- No model-specific parts were found.'}
Warnings:
${contextWarnings || '- none'}

INSTRUCTIONS:
1. Infer the failed subsystem first: drain, wash, spin, heat, ignition, cooling, control, door/latch, water inlet, or another specific appliance subsystem.
2. Identify up to 3 likely causes for this symptom.
3. Prefer partName and partNumber values from the Known Parts list when a relevant match exists.
4. If a needed part is not in the Known Parts list, leave partNumber empty unless you have exact model-fit evidence.
5. Do NOT generate part prices. Pricing is verified after this step through the supplier catalog waterfall.
6. Estimate laborHours only.
7. Assign probability as High, Medium, or Low.

STRICT RULES:
- Return a JSON object with a 'results' array.
- Do not invent OEM part numbers.
- Do not output prices.
`;

    const result = await runGeminiForTool(
        {
            tool: 'diagnosis',
            bucket: 'diag.heavy',
            model: FLASH_MODEL,
            requestContext: input.requestContext || undefined,
        },
        async ({ model }: { model: string }) => {
            const modelAi = getGeminiClient().getGenerativeModel({
                model,
                generationConfig: {
                    temperature: 0,
                    responseMimeType: 'application/json',
                    responseSchema: DIAGNOSIS_SCHEMA as any,
                }
            });

            return modelAi.generateContent(prompt);
        }
    );
    const rawText = result.response.text();
    const parsed = JSON.parse(cleanJsonString(rawText));
    return Array.isArray(parsed.results) ? parsed.results : [];
}

async function applyDeterministicSerialDecode(parsed: any, model: string, serial: string) {
    const identification = parsed?.identification;
    if (!identification || !serial) return parsed;

    const decoded = await decodeSerialNumber(serial, {
        brand: identification.brand,
        model,
    });

    if (!decoded?.selectedYear) return parsed;

    const confidence = String(decoded.confidence || '').toLowerCase();
    const existingYear = Number(identification.manufactureYear);
    const shouldApply = confidence === 'high' || confidence === 'medium' || !Number.isFinite(existingYear) || existingYear <= 0;
    if (!shouldApply) return parsed;

    const manufactureMonth = monthFromDecoder(decoded, identification.manufactureMonth);
    const confidenceScore = confidence === 'high' ? 0.95 : confidence === 'medium' ? 0.82 : Number(identification.confidence) || 0.55;

    return {
        ...parsed,
        identification: {
            ...identification,
            manufactureYear: decoded.selectedYear,
            manufactureMonth,
            manufactureDateRange: `${manufactureMonth}/${decoded.selectedYear}`,
            manufactureDateLogic: `Deterministic serial decoder (${decoded.brandFamily}; ${decoded.resolutionReason})`,
            confidence: Math.max(Number(identification.confidence) || 0, confidenceScore),
        },
    };
}

export async function extractApplianceInfoFromImage(base64Image: string, mimeType: string): Promise<{ model: string; serial: string }> {
    const parts = [
        {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        },
        {
            text: "Find the Model Number and Serial Number on this appliance rating plate. Return them as a JSON object with 'model' and 'serial' keys. If one is not found, use an empty string. Only return the JSON.",
        },
    ];

    const result = await runGeminiForTool(
        {
            tool: 'identity',
            bucket: 'identity.heavy',
            model: FLASH_MODEL,
            requestContext: { route: 'fix.extract', requestId: randomUUID() },
        },
        async ({ model }: { model: string }) => {
            const modelAi = getGeminiClient().getGenerativeModel({
                model,
                generationConfig: {
                    temperature: 0,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            model: { type: SchemaType.STRING },
                            serial: { type: SchemaType.STRING }
                        },
                        required: ['model', 'serial']
                    }
                }
            });

            return modelAi.generateContent({ contents: [{ role: 'user', parts }] });
        }
    );
    const rawText = result.response.text();
    return JSON.parse(cleanJsonString(rawText));
}

export async function auditAppliance(model: string, serial: string): Promise<ApplianceData> {
    AuditApplianceSchema.parse({ model, serial });
    const requestContext = { route: 'fix.audit', requestId: randomUUID(), model };

    const prompt = `
You are a verification-first appliance auditor operating in a production environment.

TASK:
Find the original MSRP and decode the Manufacture Date (Month/Year) for this appliance:
- Model Number: ${model}
- Serial Number: ${serial || 'Not provided'}

INSTRUCTIONS:
1. Decode manufacture date using known serial/date-code patterns when possible.
2. If the serial is missing/insufficient, infer a plausible manufacture date range from model family release period.
3. Provide original MSRP as a string (e.g., "$1,199") and include confidence.
4. DO NOT provide parts lists, listing templates, or used market values.

STRICT RULES:
- Return ONLY valid JSON matching the schema.
`;

    const result = await runGeminiForTool(
        {
            tool: 'diagnosis',
            bucket: 'diag.lite',
            model: LITE_MODEL,
            requestContext,
        },
        async ({ model }: { model: string }) => {
            const modelAi = getGeminiClient().getGenerativeModel({
                model,
                generationConfig: {
                    temperature: 0,
                    responseMimeType: 'application/json',
                    responseSchema: APP_SCHEMA as any,
                }
            });

            return modelAi.generateContent(prompt);
        }
    );
    const rawText = result.response.text();
    let parsed = JSON.parse(cleanJsonString(rawText));

    if (!parsed.identification) {
        throw new Error('Could not identify appliance details. Please check the model number and try again.');
    }

    parsed = await applyDeterministicSerialDecode(parsed, model, serial);

    return {
        identification: parsed.identification,
        groundingSources: []
    };
}

export async function diagnoseAppliance(model: string, symptom: string, serial = '', options: { brand?: string | null; productType?: string | null } = {}): Promise<DiagnosticResult[]> {
    const input = DiagnoseApplianceSchema.parse({ model, serial, symptom, ...options });
    const requestContext = { route: 'fix.diagnose', requestId: randomUUID(), model };

    const emptyPartsContext: any = {
        status: 'no_result',
        parts: [],
        warnings: [{ code: 'parts_context_unavailable', message: 'Part Finder context was unavailable.' }],
        provenance: []
    };

    // Stage 1: fetch BOM + evidence in parallel — no Gemini, fast
    let partsContext = emptyPartsContext;
    try {
        partsContext = await resolveAppliancePartsContext({
            modelNumber: model,
            serialNumber: serial,
            brand: input.brand || null,
            productType: input.productType || null,
            exhaustiveMode: false,
            includePricing: false,
            maxPricedParts: 0,
        } as any);
    } catch (error) {
        console.error('[Fix Diagnose] Shared parts context failed', error);
    }

    let diagnosisEvidence: any = { results: [], provenance: [] };
    const hasPartsContext = Array.isArray(partsContext.parts) && partsContext.parts.length > 0;
    if (!hasPartsContext) {
        try {
            diagnosisEvidence = await resolveDiagnosisEvidence({
                modelNumber: model,
                serialNumber: serial,
                brand: input.brand || null,
                productType: input.productType || null,
                symptom,
                requestContext,
            } as any);
        } catch (error) {
            console.error('[Fix Diagnose] Diagnosis evidence failed', error);
        }
    }

    const preExistingResults = Array.isArray(diagnosisEvidence.results) ? diagnosisEvidence.results : [];

    // Stage 2: one heavy diagnosis plus one Lite prefetch batch, bounded by the diagnosis policy.
    // Flash handles synthesis; Flash-Lite prefetches one cached pricing/candidate batch when available.
    // Flash-Lite × 2 (gemini-3.1-flash-lite-preview): price pre-fetch for symptom-predicted parts
    const predictedParts = getPredictedParts(symptom, partsContext.parts);
    const buildCandidates = (parts: any[], offset: number) =>
        parts.map((p: any, i: number) => ({ candidateIndex: i + offset, issue: '', partName: p.partName, partNumber: p.partNumber || '' }));

    const prefetchArgs = {
        brand: (partsContext.brand || input.brand || null) as string | null,
        modelNumber: model,
        productType: (partsContext.productType || input.productType || null) as string | null,
    };

    const [diagnosisSettled, prefetchSettled] = await Promise.allSettled([
        preExistingResults.length === 0
            ? generateContextAwareDiagnosis({ model, serial, symptom, brand: input.brand || null, productType: input.productType || null, partsContext, requestContext })
            : Promise.resolve(preExistingResults),
        predictedParts.length > 0
            ? resolveDiagnosticPartCandidates({ ...prefetchArgs, candidates: buildCandidates(predictedParts.slice(0, 4), 0), requestContext } as any)
            : Promise.resolve([]),
    ]);

    // Persist pre-fetched prices to the parts store so the verifier finds them cached
    const prefetchedCandidates = prefetchSettled.status === 'fulfilled' ? prefetchSettled.value as any[] : [];
    if (prefetchedCandidates.length > 0) {
        await Promise.allSettled(
            prefetchedCandidates
                .filter((c: any) => c.retailPriceVerified && c.partNumber)
                .map((c: any) => applyEncompassPriceSnapshot(c.partNumber, c))
        );
    }

    let diagnosisResults: any[];
    if (diagnosisSettled.status === 'fulfilled') {
        diagnosisResults = diagnosisSettled.value as any[];
    } else {
        console.error('[Fix Diagnose] Flash diagnosis failed', diagnosisSettled.reason);
        diagnosisResults = localSymptomDiagnosis(symptom);
    }

    partsContext = {
        ...partsContext,
        provenance: [
            ...(partsContext.provenance || []),
            ...(diagnosisEvidence.provenance || []),
        ],
    };

    return await verifyDiagnosticResultsWithPartsContext(diagnosisResults, partsContext, { requestContext });
}
