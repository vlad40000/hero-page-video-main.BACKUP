import 'server-only';

import { generateStructuredJson } from '@/lib/tools/parts/gemini';
import { normalizeModelNumber } from '@/lib/tools/parts/normalize';

const DIAGNOSIS_EVIDENCE_MODEL = process.env.DIAGNOSIS_EVIDENCE_MODEL || process.env.DIAG_LITE_MODEL || 'gemini-3.1-flash-lite-preview';

const DIAGNOSIS_EVIDENCE_SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          issue: { type: 'string' },
          partName: { type: 'string' },
          partNumber: { type: 'string' },
          laborHours: { type: 'number' },
          probability: { type: 'string' },
          description: { type: 'string' },
          failedSubsystem: { type: 'string' },
          evidenceSource: { type: 'string' },
        },
        required: ['issue', 'partName', 'partNumber', 'laborHours', 'probability', 'description'],
      },
    },
  },
  required: ['results'],
};

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sourceRows(sources = []) {
  return (Array.isArray(sources) ? sources : [])
    .map((source) => ({
      source: cleanText(source.title || source.uri),
      uri: cleanText(source.uri),
      note: 'Grounded diagnosis repair-help evidence.',
    }))
    .filter((source) => source.uri);
}

export async function resolveDiagnosisEvidence({
  modelNumber,
  serialNumber = '',
  symptom,
  brand = null,
  productType = null,
  requestContext = null,
}) {
  const normalizedModel = normalizeModelNumber(modelNumber);
  const prompt = `
You are producing diagnosis evidence for an appliance repair estimate.

Inputs:
- Model: ${normalizedModel || cleanText(modelNumber)}
- Serial: ${cleanText(serialNumber) || 'not provided'}
- Brand: ${cleanText(brand) || 'unknown'}
- Appliance/System: ${cleanText(productType) || 'unknown'}
- Symptom: ${cleanText(symptom)}

Use repair-help evidence from these source families when available:
- repairclinic.com/RepairHelp
- searspartsdirect.com/diy/repair-help
- ifixit.com/Device/Appliance
- appliancepartspros.com/repair-help

Rules:
- Return up to 3 likely failed component classes for this symptom.
- Prefer component-class names like "Drain Pump", "Fill Hose", "Tub Seal and Bearing Kit", "Door Boot Gasket", "Water Inlet Valve".
- Leave partNumber empty unless the repair-help evidence explicitly names an OEM number for this exact model.
- Do not return prices.
- Do not invent part numbers.
- Estimate laborHours only.
- Assign probability as High, Medium, or Low.

Return JSON only.
`;

  const { data, sources } = await generateStructuredJson({
    model: DIAGNOSIS_EVIDENCE_MODEL,
    tool: 'diagnosis',
    bucket: 'diag.lite_grounded',
    requestContext,
    contents: prompt,
    tools: [{ googleSearch: {} }],
    schema: DIAGNOSIS_EVIDENCE_SCHEMA,
    temperature: 0,
    fallback: { results: [] },
  });

  const rows = Array.isArray(data?.results) ? data.results : [];
  return {
    results: rows.slice(0, 3).map((row) => ({
      issue: cleanText(row.issue || row.failedSubsystem || 'Likely appliance issue'),
      partName: cleanText(row.partName || row.failedSubsystem || row.issue),
      partNumber: cleanText(row.partNumber),
      laborHours: Number(row.laborHours) || 1.5,
      probability: cleanText(row.probability) || 'Medium',
      description: cleanText(row.description),
    })),
    provenance: sourceRows(sources),
    model: DIAGNOSIS_EVIDENCE_MODEL,
  };
}
