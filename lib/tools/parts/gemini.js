import 'server-only';

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

import { getGeminiClient, runGeminiForTool } from '@/lib/ai/gemini-policy';

const MODEL_ALIASES = {
  supervisor: 'gemini-3-flash-preview',
  reviewer: 'gemini-3-flash-preview',
  analyzer: 'gemini-3-flash-preview',
  discovery: 'gemini-3-flash-preview',
  designer: 'gemini-3-flash-preview',
};

const RESOLVED_MODEL_NAMES = {
  'gemini-3.1-pro': 'gemini-3-flash-preview',
  'gemini-3-flash-preview': 'gemini-3-flash-preview',
  'gemini-3-pro-image': 'gemini-3-flash-preview',
};

const ALL_SOURCES = [
  { id: 'sears', label: 'https://www.searspartsdirect.com/' },
  { id: 'partselect', label: 'https://partselect.com/' },
  { id: 'repairclinic', label: 'https://repairclinic.com/' },
  { id: 'reliableparts', label: 'https://www.reliableparts.com/' },
  { id: 'dlpartsco', label: 'https://dlpartsco.com/' },
];

function resolveModelName(modelOrRole) {
  if (!modelOrRole) return RESOLVED_MODEL_NAMES[MODEL_ALIASES.analyzer];
  const aliasedModel = MODEL_ALIASES[modelOrRole] || modelOrRole;
  return RESOLVED_MODEL_NAMES[aliasedModel] || aliasedModel;
}

function createClient() {
  return getGeminiClient();
}

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON parse error', error, text);
    return fallback;
  }
}

function toPart(item) {
  if (!item) return { text: '' };
  if (typeof item === 'string') return { text: item };
  if (item.text || item.inlineData || item.fileData || item.functionCall || item.functionResponse) {
    return item;
  }
  return { text: String(item) };
}

function normalizeContents(contents) {
  if (typeof contents === 'string') {
    return [
      {
        role: 'user',
        parts: [{ text: contents }],
      },
    ];
  }

  if (Array.isArray(contents)) {
    // Already in full content format
    if (contents.every((item) => item && typeof item === 'object' && Array.isArray(item.parts))) {
      return contents;
    }

    // Array of parts -> wrap as one user message
    return [
      {
        role: 'user',
        parts: contents.map((item) => toPart(item)),
      },
    ];
  }

  if (contents && typeof contents === 'object') {
    if (Array.isArray(contents.parts)) {
      return [contents];
    }

    return [
      {
        role: 'user',
        parts: [toPart(contents)],
      },
    ];
  }

  return [{ role: 'user', parts: [{ text: '' }] }];
}

function getGroundingSources(response) {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  return chunks
    .flatMap((chunk) => {
      if (!chunk.web?.uri) return [];
      return [{ title: chunk.web.title || new URL(chunk.web.uri).hostname, uri: chunk.web.uri }];
    })
    .filter((source, index, array) => array.findIndex((item) => item.uri === source.uri) === index);
}

function filterSourcesByDomain(sources, allowedDomains = []) {
  if (!Array.isArray(sources) || allowedDomains.length === 0) return [];
  return sources.filter((source) => {
    try {
      const hostname = new URL(source.uri).hostname.replace(/^www\./, '');
      return allowedDomains.includes(hostname);
    } catch {
      return false;
    }
  });
}

function buildSourceRequirements(selectedSourceIds = [], { forPricing = false } = {}) {
  const activeSources = selectedSourceIds.length > 0
    ? ALL_SOURCES.filter((source) => selectedSourceIds.includes(source.id))
    : ALL_SOURCES;

  if (forPricing) {
    return `- You MUST ONLY use the following ${activeSources.length} source${activeSources.length > 1 ? 's' : ''} for pricing and parts, prioritizing them in this exact order:\n${activeSources.map((s, i) => `  ${i + 1}. ${s.label}`).join('\n')}\n- Do NOT use any other sources outside of these under any circumstances.`;
  }

  return `- Use ONLY these source domain${activeSources.length > 1 ? 's' : ''} when identifying parts:\n${activeSources.map((s, i) => `  ${i + 1}. ${s.label}`).join('\n')}\n- Do not use any domains outside this list.`;
}

export function getConfiguredModelName(modelOrRole) {
  return resolveModelName(modelOrRole);
}

function isGroundedTools(tools = []) {
  return (tools || []).some((tool) => tool?.googleSearch || tool?.google_search);
}

function inferToolFromRole(role) {
  if (role === 'reviewer' || role === 'supervisor' || role === 'analyzer' || role === 'discovery') return 'bom';
  if (role === 'designer') return 'sales';
  return 'global';
}

function inferBucket({ tool, role, modelName, grounded }) {
  const tier = String(modelName || '').toLowerCase().includes('lite') ? 'lite' : 'heavy';
  if (tool === 'bom') return `bom.${tier}${grounded ? '_grounded' : ''}`;
  if (tool === 'partFinder') return `parts.${tier}${grounded ? '_grounded' : ''}`;
  if (tool === 'diagnosis') return `diag.${tier}${grounded ? '_grounded' : ''}`;
  if (tool === 'identity') return `identity.${tier}`;
  if (tool === 'partsCatalog') return `catalog.${tier}${grounded ? '_grounded' : ''}`;
  if (tool === 'ebay') return `ebay.${tier}${grounded ? '_grounded' : ''}`;
  if (tool === 'market') return `market.${tier}${grounded ? '_grounded' : ''}`;
  if (tool === 'inventory') return `inventory.${tier}`;
  if (tool === 'sales') return `sales.${tier}`;
  if (tool === 'calculators') return `calculators.${tier}${grounded ? '_grounded' : ''}`;
  if (role === 'reviewer' || role === 'supervisor') return `bom.${tier}`;
  return `global.${tier}`;
}

export async function generateText({ model, role, contents, config = {} }) {
  const modelName = resolveModelName(model || role);
  const {
    tools,
    tool: configuredTool,
    bucket: configuredBucket,
    requestContext,
    ...generationConfig
  } = config;
  const grounded = isGroundedTools(tools);
  const tool = configuredTool || inferToolFromRole(role);
  const bucket = configuredBucket || inferBucket({ tool, role, modelName, grounded });

  try {
    return await runGeminiForTool(
      {
        tool,
        bucket,
        model: modelName,
        grounded,
        requestContext,
      },
      async ({ model: scheduledModel }) => {
        const genAI = createClient();
        const generativeModel = genAI.getGenerativeModel({
          model: scheduledModel,
        });

        const result = await generativeModel.generateContent({
          contents: normalizeContents(contents),
          generationConfig: {
            temperature: 0.1,
            ...generationConfig,
          },
          tools: tools || [],
        });

        const response = await result.response;

        return {
          text: response.text()?.trim() || '',
          response,
          model: scheduledModel,
          sources: getGroundingSources(response),
        };
      }
    );
  } catch (error) {
    console.error(`[Gemini API Error - Text] Model: ${modelName}`, error);
    throw new Error(`Failed to generate text using ${modelName}: ${error.message}`);
  }
}

export async function generateStructuredJson({
  model,
  role,
  contents,
  schema,
  tools = [],
  temperature = 0.1,
  config = {},
  fallback = {},
  tool = null,
  bucket = null,
  requestContext = null,
}) {
  const { text, response, model: modelName, sources } = await generateText({
    model,
    role,
    contents,
    config: {
      temperature,
      tools,
      tool,
      bucket,
      requestContext,
      responseMimeType: 'application/json',
      responseSchema: schema,
      ...config,
    },
  });

  return {
    data: safeJsonParse(text || '{}', fallback),
    text,
    response,
    model: modelName,
    sources,
  };
}

export async function generateImageAsset({
  prompt,
  model,
  role = 'designer',
  storageTarget = process.env.NODE_ENV === 'production' ? 'tmp' : 'public',
}) {
  const modelName = resolveModelName(model || role);
  const tool = role === 'designer' ? 'sales' : 'global';
  const bucket = role === 'designer' ? 'sales.heavy' : 'global.heavy';

  try {
    return await runGeminiForTool({ tool, bucket, model: modelName }, async ({ model: scheduledModel }) => {
      const genAI = createClient();
      const generativeModel = genAI.getGenerativeModel({
        model: scheduledModel,
      });

      const result = await generativeModel.generateContent({
        contents: normalizeContents(prompt),
      });
      const response = await result.response;

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const imagePart = parts.find((part) => part.inlineData?.data || part.inlineData?.imageBytes);
      const imageBytes = imagePart?.inlineData?.data || imagePart?.inlineData?.imageBytes;

      if (!imageBytes) {
        throw new Error('No image bytes were returned by the model.');
      }

      const baseDir = storageTarget === 'public'
        ? path.join(process.cwd(), 'public', 'generated-assets')
        : path.join('/tmp', 'generated-assets');

      await fs.mkdir(baseDir, { recursive: true });

      const fileName = `design_${crypto.randomUUID()}.png`;
      const filePath = path.join(baseDir, fileName);
      await fs.writeFile(filePath, Buffer.from(imageBytes, 'base64'));

      return {
        filePath,
        publicPath: storageTarget === 'public' ? `/generated-assets/${fileName}` : filePath,
        model: scheduledModel,
        response,
      };
    });
  } catch (error) {
    console.error(`[Gemini API Error - Image] Model: ${modelName}`, error);
    throw new Error(`Failed to generate image using ${modelName}: ${error.message}`);
  }
}

function parseRootDomain(value) {
  try {
    const url = String(value || '').trim().toLowerCase();
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    const hostname = new URL(cleanUrl).hostname.replace(/^www\./, '');
    return hostname || 'unknown';
  } catch {
    return 'unknown';
  }
}

function resolvePartSource(part = {}, allowedDomains = [], groundedSources = []) {
  const explicit = parseRootDomain(part.source);
  if (allowedDomains.includes(explicit)) return explicit;

  const groundedAllowed = filterSourcesByDomain(groundedSources, allowedDomains)
    .map((source) => parseRootDomain(source.uri))
    .filter(Boolean);

  if (allowedDomains.length === 1) return allowedDomains[0];
  if (groundedAllowed.length === 1) return groundedAllowed[0];
  if (allowedDomains.includes(explicit)) return explicit;

  return explicit;
}

export async function fetchPartsList(modelNumber, providerPlan = {}) {
  if (process.env.ENABLE_GEMINI_SEARCH_FALLBACK !== 'true') {
    return {
      summary: '',
      parts: [],
      sources: [],
      source: providerPlan.distributorFallbacks?.[0] || providerPlan.manufacturerDomains?.[0] || 'unknown',
      truthSource: providerPlan.truthSource || 'AI search fallback disabled',
      sourceStrategy: `${providerPlan.strategy || 'parts-list'}:ai-search-disabled`,
    };
  }
  const responseSchema = {
    type: 'object',
    properties: {
      summary: { type: 'string', description: 'Full specs of the machine.' },
      parts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Part Name' },
            partNumber: { type: 'string', description: 'Official OEM Part Number' },
            category: { type: 'string', description: 'Part Category' },
            section: { type: 'string', description: 'The provider section name' },
            substitute: { type: 'string', description: 'Substitute part number if any' },
            serialNote: { type: 'string', description: 'Applicability or serial notes' },
            quantity: { type: 'string', description: 'Quantity used per machine' },
            diagramRef: { type: 'string', description: 'Reference ID or item number on diagram' },
            providerItemId: { type: 'string', description: 'Provider internal ID' },
            source: { type: 'string', description: 'The exact source domain used for this row, preferably the manufacturer domain if available.' },
          },
          required: ['name', 'partNumber', 'category', 'section', 'source'],
        },
      },
      sources: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            uri: { type: 'string' },
          },
        },
      },
    },
    required: ['summary', 'parts'],
  };

  const manufacturerDomains = providerPlan.manufacturerDomains || [];
  const distributorFallbacks = providerPlan.distributorFallbacks || ['searspartsdirect.com'];
  const allowedDomains = providerPlan.allowedDomains || [...manufacturerDomains, ...distributorFallbacks];
  const truthOrder = providerPlan.truthOrder || allowedDomains;
  const truthLabel = providerPlan.truthSource || 'Manufacturer-first when available';
  const singleDomainMode = allowedDomains.length === 1;
  const domainInstruction = singleDomainMode
    ? `Use ONLY ${allowedDomains[0]} for this pass. Do not use any other domain, even as a cross-check.`
    : `Use ONLY these domains for this pass: ${allowedDomains.join(', ')}.`;

  const prompt = `
    You are an expert appliance BOM analyst. Your job is to return the most complete provider-backed OEM BOM possible for the following appliance model:
    MODEL: ${modelNumber}
    BRAND: ${providerPlan.brand || 'Try to identify from model'}

    SOURCE STRATEGY (Prioritization):
    - Authoritative manufacturer domains are the PRIMARY truth.
    - Authorized distributor domains are SECONDARY gap-fill.
    - Every part row MUST have an accurate 'source' domain.
    - ${domainInstruction}

    TRUTH ORDER (Prioritize these):
    ${truthOrder.map((domain, index) => `${index + 1}. ${domain}`).join('\n')}

    PRIMARY SEARCH DOMAINS:
    ${manufacturerDomains.length > 0 ? manufacturerDomains.join(', ') : 'None for this pass'}

    SECONDARY SEARCH DOMAINS:
    ${distributorFallbacks.join(', ')}

    RULES OF EXHAUSTIVE RECALL:
    - Return EVERY part row verifyable for the exact model from the allowed domain set only.
    - DO NOT OMIT screws, fasteners, clips, brackets, manuals, labels, trim, cosmetic parts, or accessories.
    - DO NOT CAP result count.
    - Preserve provider-native section names.
    - Record substitute part numbers, serial notes, quantities, and diagram references.
    - For each row, set 'source' to the exact root domain used.
    - Return JSON only mirroring the schema provided.

    Also provide a brief summary of the machine (brand, type, core specs) and respect this strategy label: ${truthLabel}.
  `;

  const { data, sources } = await generateStructuredJson({
    model: process.env.PARTS_BOM_SEARCH_MODEL || 'gemini-3.1-flash-lite-preview',
    tool: 'bom',
    bucket: 'bom.lite_grounded',
    contents: prompt,
    tools: [{ googleSearch: {} }],
    schema: responseSchema,
    temperature: 0.1,
    fallback: { summary: '', parts: [] },
  });

  const groundedAllowedSources = filterSourcesByDomain(sources, allowedDomains);

  const normalizedParts = Array.isArray(data.parts)
    ? data.parts
        .map((part) => ({
          ...part,
          source: resolvePartSource(part, allowedDomains, sources),
        }))
        .filter((part) => allowedDomains.length === 0 || allowedDomains.includes(part.source))
    : [];

  const normalizedSources = Array.isArray(data.sources) && data.sources.length > 0
    ? data.sources.filter((source) => {
        return filterSourcesByDomain([source], allowedDomains).length > 0;
      })
    : groundedAllowedSources;

  return {
    summary: data.summary || '',
    parts: normalizedParts,
    sources: normalizedSources,
    source: manufacturerDomains[0] || distributorFallbacks[0] || 'unknown',
    truthSource: providerPlan.truthSource || 'Manufacturer-first',
    sourceStrategy: providerPlan.strategy || 'manufacturer-first',
  };
}


export async function extractIdentityFromManualPdf(pdfData, fileName = 'manual.pdf') {
  const responseSchema = {
    type: 'object',
    properties: {
      documentTitle: { type: 'string', nullable: true },
      brand: { type: 'string', nullable: true },
      productType: { type: 'string', nullable: true },
      modelNumber: { type: 'string', nullable: true },
      modelCandidates: {
        type: 'array',
        items: { type: 'string' },
      },
      confidence: {
        type: 'object',
        properties: {
          brand: { type: 'number' },
          productType: { type: 'number' },
          modelNumber: { type: 'number' },
        },
      },
    },
    required: ['brand', 'productType', 'modelNumber', 'modelCandidates', 'confidence'],
  };

  const prompt = `
    Analyze this appliance Owner's Manual PDF and extract the strongest appliance identity signals.

    PRIORITY:
    1. Exact model number if explicitly stated
    2. Brand
    3. Product type
    4. Additional exact model candidates if the manual covers multiple variants

    RULES:
    - IDENTIFY ONLY. Do not extract parts or pricing.
    - Prefer exact model strings (e.g. WDT730PAHZ0) over family names (e.g. WDT Series).
    - Look at the cover, specifications, and warranty sections.
    - If the manual covers several models, list them all in modelCandidates.
    - Return JSON only mirroring the schema provided.
    - Original FileName: ${fileName}
  `;

  const { data } = await generateStructuredJson({
    model: 'gemini-3-flash-preview',
    tool: 'identity',
    bucket: 'identity.heavy',
    contents: [
      { text: prompt },
      {
        inlineData: {
          data: pdfData,
          mimeType: 'application/pdf',
        },
      },
    ],
    schema: responseSchema,
    temperature: 0.1,
    fallback: {
      documentTitle: null,
      brand: null,
      productType: null,
      modelNumber: null,
      modelCandidates: [],
      confidence: { brand: 0, productType: 0, modelNumber: 0 },
    },
  });

  return data;
}

export async function extractNameplateFromImage(imageData, mimeType) {
  const responseSchema = {
    type: 'object',
    properties: {
      modelNumber: { type: 'string', nullable: true },
      serialNumber: { type: 'string', nullable: true },
      brand: { type: 'string', nullable: true },
      productType: { type: 'string', nullable: true },
      engineeringCode: { type: 'string', nullable: true },
      confidence: {
        type: 'object',
        properties: {
          modelNumber: { type: 'number' },
          serialNumber: { type: 'number' },
          brand: { type: 'number' },
          productType: { type: 'number' },
        },
      },
    },
    required: ['modelNumber', 'serialNumber', 'brand', 'productType', 'confidence'],
  };

  const prompt = `Analyze this image of an appliance nameplate and extract all visible identity fields.
  Look for MODEL NUMBER (MOD), SERIAL NUMBER (SER/SN), BRAND, and PRODUCT TYPE (e.g. Dishwasher, Dryer).
  Return as structured JSON. Use null for missing fields. Do not use "NOT_FOUND" strings.`;

  const { data } = await generateStructuredJson({
    model: 'gemini-3-flash-preview',
    tool: 'identity',
    bucket: 'identity.heavy',
    requestContext: { route: 'parts.extract-model', requestId: crypto.randomUUID() },
    contents: [
      { text: prompt },
      {
        inlineData: {
          data: imageData,
          mimeType,
        },
      },
    ],
    schema: responseSchema,
    temperature: 0.1,
    fallback: { modelNumber: null, serialNumber: null, brand: null, productType: null, confidence: {} },
  });

  return data;
}

export async function extractModelNumberFromImage(imageData, mimeType) {
  const identity = await extractNameplateFromImage(imageData, mimeType);
  return {
    modelNumber: identity?.modelNumber || null,
    serialNumber: identity?.serialNumber || null,
    brand: identity?.brand || null,
    productType: identity?.productType || null,
    confidence: identity?.confidence || {},
  };
}

/**
 * Stage 1 Universal Recovery: AI Schematic Miner
 * Specifically targets Sears/Encompass/PartSelect diagrams via Google Search grounding.
 * Bypasses 403 blocks by leveraging Google's crawler index.
 */
export async function extractSchematicBOM(modelNumber, brand) {
  const responseSchema = {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      parts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            partNumber: { type: 'string' },
            category: { type: 'string' },
            section: { type: 'string' },
            diagramRef: { type: 'string' },
            source: { type: 'string' },
          },
          required: ['name', 'partNumber', 'section', 'source'],
        },
      },
    },
    required: ['parts'],
  };

  const prompt = `
    URGENT RECOVERY: Primary catalog retrieval failed for MODEL: ${modelNumber} (BRAND: ${brand}).
    Your objective is to perform a DEEP SCHEMATIC MINING pass.
    
    INSTRUCTIONS:
    1. Search Google specifically for "Sears PartsDirect ${modelNumber} diagrams", "Encompass ${modelNumber} parts list", or "PartSelect ${modelNumber} diagrams".
    2. Identify the exploded-view diagram sections (e.g., "Tub and Motor", "Control Panel", "Door Parts").
    3. Extract EVERY part row you can find in these diagrams.
    4. You MUST extract the OEM Part Number for each row.
    5. Return a comprehensive BOM as structured JSON.
    
    TARGET DOMAINS (Prioritize these):
    - searspartsdirect.com
    - encompass.com
    - partselect.com
    - appliancepartspros.com
  `;

  const { data, sources } = await generateStructuredJson({
    model: process.env.PARTS_SCHEMATIC_SEARCH_MODEL || 'gemini-3.1-flash-lite-preview',
    tool: 'bom',
    bucket: 'bom.lite_grounded',
    contents: prompt,
    tools: [{ googleSearch: {} }],
    schema: responseSchema,
    temperature: 0.1,
    fallback: { parts: [] },
  });

  return {
    summary: data.summary || `Deep Schematic Retrieval for ${modelNumber}`,
    parts: (data.parts || []).map(p => ({
      ...p,
      source: resolvePartSource(p, ['searspartsdirect.com', 'encompass.com', 'partselect.com'], sources),
    })),
    sources: sources,
    truthSource: 'Deep Schematic Mining (Search Grounded)',
    sourceStrategy: 'ai-schematic-miner',
  };
}

export async function extractPartStickerText(base64Image, mimeType) {
  const prompt = `
Read only the visible text from this appliance part sticker image.

Minimize hallucinations/guessing rules:
1. Do not auto-fill a part number unless OCR returns a real candidate.
2. Do not guess. Do not invent missing digits or letters.
3. If the image is blurry or unreadable, return an empty string for text.
4. Never infer a part number from the appliance model number.
5. Focus on part number labels, replacement numbers, and sticker text.
6. Keep OCR temperature at 0.

Return strict JSON:
{
  "text": "raw OCR text only"
}
`;

  const { data } = await generateStructuredJson({
    model: 'gemini-3-flash-preview',
    tool: 'identity',
    bucket: 'identity.heavy',
    requestContext: { route: 'parts.extract-part', requestId: crypto.randomUUID() },
    contents: [
      { text: prompt },
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ],
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
      },
      required: ['text'],
    },
    temperature: 0,
    config: {
      topP: 0.1,
      topK: 1,
    },
    fallback: { text: '' },
  });

  return data;
}

export { ALL_SOURCES };
