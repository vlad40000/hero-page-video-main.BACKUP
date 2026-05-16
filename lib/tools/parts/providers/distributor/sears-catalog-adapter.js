import 'server-only';

import { cleanText, normalizeModelToken, normalizePartNumber, uniqueBy } from '@/lib/tools/parts/http';

function refKey(ref) {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  return ref.__ref || ref.id || null;
}

function resolveRef(payload, ref) {
  const key = refKey(ref);
  return key ? payload?.[key] || null : null;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function firstPropertyValueByPrefix(obj, prefix) {
  if (!obj || typeof obj !== 'object') return null;
  const key = Object.keys(obj).find((candidate) => candidate.startsWith(prefix));
  return key ? obj[key] : null;
}

function hasModelPartsOrSchematics(model) {
  if (!model || model.__typename !== 'Model') return false;
  return Boolean(
    model.hasParts === true &&
    (firstPropertyValueByPrefix(model, 'parts(') || firstPropertyValueByPrefix(model, 'schematics('))
  );
}

function findPrimaryModelDetail(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload.ROOT_QUERY || {};

  for (const [key, value] of Object.entries(root)) {
    if (!key.startsWith('model(')) continue;
    const model = resolveRef(payload, value);
    if (hasModelPartsOrSchematics(model)) return model;
  }

  return Object.values(payload).find((value) => hasModelPartsOrSchematics(value)) || null;
}

function findBrand(payload, model) {
  return resolveRef(payload, model?.brand) || resolveRef(payload, model?.brand?.__ref) || null;
}

function findCategory(payload, model) {
  const categoryRefs = [model?.category, model?.taxonomy, model?.applianceCategory].filter(Boolean);
  for (const ref of categoryRefs) {
    const resolved = resolveRef(payload, ref);
    if (resolved) return resolved;
  }
  return null;
}

function getDynamicCount(obj, prefix) {
  const value = firstPropertyValueByPrefix(obj, prefix);
  if (typeof value === 'number') return value;
  if (typeof value?.totalCount === 'number') return value.totalCount;
  return null;
}

export function classifySearsPayload(payload) {
  if (!payload || typeof payload !== 'object') return 'unknown';

  const root = payload.ROOT_QUERY || {};
  const rootKeys = Object.keys(root);
  const values = Object.values(payload);

  const hasModelSearch = rootKeys.some((key) => key.startsWith('models('));
  const hasModelDetailRootRef = Object.entries(root).some(([key, value]) => {
    if (!key.startsWith('model(')) return false;
    return hasModelPartsOrSchematics(resolveRef(payload, value));
  });
  const hasConcreteModelDetail = values.some(hasModelPartsOrSchematics);
  const hasCmsContent = values.some((value) => {
    const type = value?.__typename;
    return type === 'Article' || type === 'RepairGuides' || type === 'NavigationLinks' || type === 'Coupon' || type === 'ContentfulPage' || type === 'Banner';
  });

  if (hasConcreteModelDetail || hasModelDetailRootRef) return 'model_detail';
  if (hasModelSearch) return 'model_resolver';
  if (hasCmsContent) return 'cms_content';
  return 'unknown';
}

function extractBalancedObjectLiteral(text, startIndex) {
  const firstBrace = text.indexOf('{', startIndex);
  if (firstBrace < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = firstBrace; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = inString;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(firstBrace, index + 1);
    }
  }

  return null;
}

export function extractSearsCatalogPayload(html) {
  const text = String(html || '');
  const marker = 'CATALOG_API_RESPONSE';
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) return null;

  const literal = extractBalancedObjectLiteral(text, markerIndex);
  if (!literal) return null;

  try {
    return JSON.parse(literal);
  } catch (error) {
    return null;
  }
}

function slugifyForSears(value) {
  return cleanText(value).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function buildSearsModelUrl(candidate) {
  const slug = slugifyForSears([candidate.brandName, candidate.modelNumber, candidate.title, 'parts'].filter(Boolean).join(' '));
  return `https://www.searspartsdirect.com/model/${candidate.internalModelId}${slug ? `/${slug}` : ''}`;
}

export function parseSearsModelSearchPayload(payload, requestedModel = '') {
  const candidates = [];
  const requestedNorm = normalizeModelToken(requestedModel);

  for (const value of Object.values(payload || {})) {
    if (!value || value.__typename !== 'Model') continue;

    const modelNumber = cleanText(value.number || value.modelNumber || value.model || '');
    if (!modelNumber) continue;

    const brand = findBrand(payload, value);
    const category = findCategory(payload, value);
    const partCountPreview = getDynamicCount(value, 'partCount(') ?? (typeof value.partCount === 'number' ? value.partCount : null);
    const candidate = {
      supplier: 'sears',
      internalModelId: String(value.id || ''),
      modelNumber,
      title: cleanText(value.title || value.description || '') || null,
      brandId: brand?.id || null,
      brandName: brand?.name || brand?.label || null,
      categoryId: category?.id || null,
      categoryName: category?.name || category?.label || null,
      partCountPreview,
      confidence: 'low',
      url: null,
    };

    const candidateNorm = normalizeModelToken(modelNumber);
    if (requestedNorm && candidateNorm === requestedNorm) candidate.confidence = 'exact';
    else if (requestedNorm && (candidateNorm.includes(requestedNorm) || requestedNorm.includes(candidateNorm))) candidate.confidence = 'partial';

    if (candidate.internalModelId) candidate.url = buildSearsModelUrl(candidate);
    candidates.push(candidate);
  }

  return uniqueBy(candidates, (candidate) => `${candidate.internalModelId}|${candidate.modelNumber}`);
}

function parseSchematicRows(payload, model) {
  const block = firstPropertyValueByPrefix(model, 'schematics(');
  return asArray(block?.schematics)
    .map((ref) => resolveRef(payload, ref))
    .filter(Boolean)
    .map((schematic) => ({
      id: String(schematic.id || schematic.pageId || schematic.pageName || ''),
      pageId: schematic.pageId || null,
      pageName: cleanText(schematic.pageName || schematic.title || schematic.name || 'Diagram'),
      imageUrl: schematic.image || schematic.imageUrl || null,
    }));
}

function firstImageUrl(part) {
  const imageBlock = part?.media?.image || part?.image || null;
  if (typeof imageBlock === 'string') return imageBlock;
  if (!imageBlock || typeof imageBlock !== 'object') return null;
  for (const value of Object.values(imageBlock)) {
    if (Array.isArray(value) && value[0]) return String(value[0]);
    if (typeof value === 'string') return value;
  }
  return null;
}

function parseSubstitutions(payload, part) {
  const block = firstPropertyValueByPrefix(part, 'substitutedByList(') || part.substitutedByList;
  return asArray(block?.parts)
    .map((ref) => resolveRef(payload, ref))
    .filter(Boolean)
    .map((sub) => normalizePartNumber(sub.number || sub.partNumber || ''))
    .filter(Boolean);
}

function parsePart(payload, part) {
  if (!part || part.__typename !== 'Part') return null;
  const partNumber = normalizePartNumber(part.number || part.partNumber || '');
  if (!partNumber) return null;

  const schematicRef = asArray(part.schematicContext)[0];
  const schematic = resolveRef(payload, schematicRef);
  const substitutions = parseSubstitutions(payload, part);
  const replacement = substitutions[0] || partNumber;

  return {
    supplier: 'sears',
    sourcePartId: String(part.id || partNumber),
    sourceId: part.sourceId || null,
    partNumber,
    title: cleanText(part.title || part.description || part.name || 'Appliance Part'),
    assemblyTitle: cleanText(part.contextSchematicTitle || schematic?.pageName || 'All Model Parts'),
    assemblyKeyId: part.contextSchematicKeyId || part.keyNumber || part.diagramNumber || null,
    schematicId: schematic?.id || refKey(schematicRef),
    imageUrl: firstImageUrl(part),
    sellPrice: typeof part.pricing?.sell === 'number' ? part.pricing.sell : null,
    listPrice: typeof part.pricing?.list === 'number' ? part.pricing.list : null,
    availabilityStatus: part.pricing?.availabilityInfo?.status || part.availability || null,
    inventory: typeof part.pricing?.availabilityInfo?.inventory === 'number' ? part.pricing.availabilityInfo.inventory : null,
    substitutedByPartNumbers: substitutions,
    currentServicePartNumber: replacement,
  };
}

export function parseSearsModelDetailPayload(payload) {
  const model = findPrimaryModelDetail(payload);
  if (!model) {
    return {
      model: null,
      schematics: [],
      parts: [],
      expectedPartCount: null,
      loadedPartCount: 0,
      state: 'no_result',
    };
  }

  const brand = findBrand(payload, model);
  const category = findCategory(payload, model);
  const partsBlock = firstPropertyValueByPrefix(model, 'parts(');
  const expectedPartCount = typeof partsBlock?.totalCount === 'number' ? partsBlock.totalCount : getDynamicCount(model, 'partCount(');
  const partObjects = asArray(partsBlock?.parts).map((ref) => resolveRef(payload, ref)).filter(Boolean);
  const fallbackParts = Object.values(payload).filter((value) => value?.__typename === 'Part');
  const parts = uniqueBy(
    (partObjects.length ? partObjects : fallbackParts).map((part) => parsePart(payload, part)).filter(Boolean),
    (part) => `${part.partNumber}|${part.assemblyKeyId || ''}|${part.assemblyTitle || ''}`
  );
  const uniquePartCount = new Set(parts.map((part) => part.partNumber)).size;

  return {
    model: {
      internalModelId: String(model.id || ''),
      modelNumber: cleanText(model.number || model.modelNumber || ''),
      title: cleanText(model.title || model.description || '') || null,
      brandId: brand?.id || null,
      brandName: brand?.name || brand?.label || null,
      categoryId: category?.id || null,
      categoryName: category?.name || category?.label || null,
      hasParts: model.hasParts === true,
      partCount: expectedPartCount,
    },
    schematics: parseSchematicRows(payload, model),
    parts,
    expectedPartCount,
    loadedPartCount: uniquePartCount,
    state: expectedPartCount && uniquePartCount >= expectedPartCount ? 'parts_complete_for_sears' : 'parts_partial',
  };
}

export function searsPartToRawRow(part, sourceUrl = null) {
  return {
    source: 'searspartsdirect.com',
    sectionName: part.assemblyTitle || 'All Model Parts',
    sectionUrl: sourceUrl,
    diagramRef: part.assemblyKeyId || part.sourceId || null,
    providerItemId: part.sourcePartId || null,
    rawPartNumber: part.currentServicePartNumber || part.partNumber,
    rawPartName: part.title || 'Appliance Part',
    rawCategory: part.assemblyTitle || 'General',
    quantity: null,
    substitutePartNumber: part.substitutedByPartNumbers?.[0] || null,
    serialNote: null,
    evidenceUrl: sourceUrl,
    rawPayload: {
      ...part,
      price: part.sellPrice,
      listPrice: part.listPrice,
      availabilityStatus: part.availabilityStatus,
      inventory: part.inventory,
    },
  };
}
