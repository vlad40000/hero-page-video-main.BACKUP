import { sql } from '@/lib/tools/parts/db';
import { isManufacturerDomain } from '@/lib/tools/parts/provider-registry';
import { upsertPartNumbersForModel } from '@/lib/tools/parts/part-number-store';

function normPartNumber(pn) {
  return String(pn || '').trim().toUpperCase().replace(/[\s-]+/g, '');
}

const CATEGORY_MAP = {
  heating: 'Heating',
  heat: 'Heating',
  controls: 'Controls',
  control: 'Controls',
  electrical: 'Controls',
  drive: 'Drive',
  motor: 'Drive',
  drum: 'Drive',
  door: 'Door & Panels',
  panel: 'Door & Panels',
  panels: 'Door & Panels',
  cabinet: 'Cabinet & Frame',
  frame: 'Cabinet & Frame',
  top: 'Cabinet & Frame',
  bulkhead: 'Cabinet & Frame',
  exhaust: 'Exhaust & Ventilation',
  vent: 'Exhaust & Ventilation',
  ventilation: 'Exhaust & Ventilation',
  gas: 'Gas System',
  burner: 'Gas System',
  water: 'Water System',
  pump: 'Water System',
  valve: 'Water System',
  dispenser: 'Dispenser',
  ice: 'Ice System',
  icemaker: 'Ice System',
  compressor: 'Refrigeration',
  refrigeration: 'Refrigeration',
  sealed: 'Sealed System',
  evaporator: 'Refrigeration',
  condenser: 'Refrigeration',
  wash: 'Wash System',
  spray: 'Wash System',
  tub: 'Tub & Basket',
  basket: 'Tub & Basket',
  agitator: 'Tub & Basket',
  transmission: 'Transmission',
  gearcase: 'Transmission',
  suspension: 'Suspension',
  spring: 'Suspension',
  leveling: 'Suspension',
  shelf: 'Shelving',
  shelves: 'Shelving',
  rack: 'Shelving',
  drawer: 'Drawers',
  liner: 'Liner',
  seal: 'Seals & Gaskets',
  gasket: 'Seals & Gaskets',
  hose: 'Hoses & Connectors',
  connector: 'Hoses & Connectors',
  harness: 'Wiring',
  wiring: 'Wiring',
  wire: 'Wiring',
  sensor: 'Sensors',
  thermistor: 'Sensors',
  thermostat: 'Controls',
  timer: 'Controls',
  board: 'Controls',
  pcb: 'Controls',
  interface: 'Controls',
  latch: 'Door & Panels',
  hinge: 'Door & Panels',
  handle: 'Door & Panels',
  belt: 'Drive',
  pulley: 'Drive',
  idler: 'Drive',
  roller: 'Drive',
  bearing: 'Drive',
  element: 'Heating',
  igniter: 'Heating',
  fuse: 'Controls',
  switch: 'Controls',
  filter: 'Filtration',
  light: 'Lighting',
  bulb: 'Lighting',
  led: 'Lighting',
  knob: 'Knobs & Buttons',
  button: 'Knobs & Buttons',
};

function normalizeCategory(raw) {
  if (!raw) return 'Uncategorized';
  const lower = String(raw).trim().toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return val;
  }
  return raw.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

function cleanSection(raw) {
  const value = String(raw || '').trim();
  if (!value) return 'General Assembly';
  return value.replace(/\s+/g, ' ');
}

function sourceRank(source) {
  const s = String(source || '').toLowerCase();
  if (isManufacturerDomain(s)) return 10;
  if (s.includes('encompass.com')) return 9;
  if (s.includes('partselect.com')) return 8;
  if (s.includes('repairclinic.com')) return 7;
  if (s.includes('reliableparts.com')) return 6;
  if (s.includes('dlpartsco.com')) return 5;
  if (s.includes('searspartsdirect.com')) return 4;
  if (s !== 'unknown') return 2;
  return 1;
}

function pickPreferredRow(rows = []) {
  return [...rows].sort((a, b) => sourceRank(b.source) - sourceRank(a.source))[0] || rows[0] || {};
}

export async function reconcileParts(canonicalModel, rawParts, options = {}) {
  const model = String(canonicalModel).trim().toUpperCase();

  if (!Array.isArray(rawParts) || rawParts.length === 0) {
    return { masterParts: [], completenessScore: 0, sectionCount: 0 };
  }

  const partMap = new Map();

  for (const raw of rawParts) {
    const normPN = normPartNumber(raw.raw_part_number);
    if (!normPN) continue;

    if (!partMap.has(normPN)) {
      partMap.set(normPN, {
        canonicalPartNumber: normPN,
        canonicalPartName: raw.raw_part_name || '',
        sources: new Set(),
        sections: new Set(),
        categories: new Set(),
        substitutes: new Set(),
        serialNotes: [],
        rawRows: [],
        conflictFlags: [],
      });
    }

    const entry = partMap.get(normPN);
    if (raw.source) entry.sources.add(raw.source);
    if (raw.section_name) entry.sections.add(raw.section_name);
    if (raw.raw_category) entry.categories.add(raw.raw_category);
    if (raw.substitute_part_number) entry.substitutes.add(normPartNumber(raw.substitute_part_number));
    if (raw.serial_note) entry.serialNotes.push(raw.serial_note);
    entry.rawRows.push(raw);

    if (
      entry.canonicalPartName &&
      raw.raw_part_name &&
      entry.canonicalPartName.toLowerCase() !== raw.raw_part_name.toLowerCase()
    ) {
      entry.conflictFlags.push({
        type: 'name_mismatch',
        existing: entry.canonicalPartName,
        incoming: raw.raw_part_name,
        source: raw.source,
      });
      if (sourceRank(raw.source) > sourceRank(pickPreferredRow(entry.rawRows).source) || raw.raw_part_name.length > entry.canonicalPartName.length) {
        entry.canonicalPartName = raw.raw_part_name;
      }
    }
  }

  const masterParts = [];
  for (const [normPN, entry] of partMap) {
    const preferredRow = pickPreferredRow(entry.rawRows);
    const preferredSection = cleanSection(preferredRow.section_name || [...entry.sections][0] || 'General Assembly');
    const preferredCategory = normalizeCategory(preferredRow.raw_category || preferredSection);
    const preferredSource = preferredRow.source || [...entry.sources][0] || 'unknown';

    masterParts.push({
      canonicalModel: model,
      canonicalPartNumber: normPN,
      canonicalPartName: entry.canonicalPartName,
      normalizedSection: preferredSection,
      normalizedCategory: preferredCategory,
      preferredSource,
      substituteChain: [...entry.substitutes].filter(Boolean),
      serialApplicability: entry.serialNotes,
      providerRows: entry.rawRows,
      sourceConfidence: Object.fromEntries(
        [...entry.sources].map((s) => [s, { observed: true, rank: sourceRank(s) }])
      ),
      conflictFlags: entry.conflictFlags,
    });
  }

  const uniqueSections = new Set(masterParts.map((p) => p.normalizedSection)).size;
  const uniqueParts = masterParts.length;
  const completenessScore = Math.min(100, Math.round(
    (uniqueParts / 60) * 65 + (uniqueSections / 8) * 35
  ));

  if (options.persist !== false) {
    await persistMasterParts(masterParts);
  }

  await upsertPartNumbersForModel(model, masterParts, 'reconciled-bom');

  return { masterParts, completenessScore, sectionCount: uniqueSections };
}

export async function persistMasterParts(masterParts = []) {
  try {
    const CHUNK_SIZE = 15;
    const masterEntries = [...masterParts];

    for (let i = 0; i < masterEntries.length; i += CHUNK_SIZE) {
      const chunk = masterEntries.slice(i, i + CHUNK_SIZE);
      const upsertPromises = chunk.map((mp) =>
        sql`
          INSERT INTO model_parts_master (
            canonical_model, canonical_part_number, canonical_part_name,
            normalized_section, normalized_category, preferred_source,
            substitute_chain, serial_applicability, provider_rows,
            source_confidence, conflict_flags, updated_at
          )
          VALUES (
            ${mp.canonicalModel},
            ${mp.canonicalPartNumber},
            ${mp.canonicalPartName},
            ${mp.normalizedSection},
            ${mp.normalizedCategory},
            ${mp.preferredSource},
            ${JSON.stringify(mp.substituteChain)}::jsonb,
            ${JSON.stringify(mp.serialApplicability)}::jsonb,
            ${JSON.stringify(mp.providerRows)}::jsonb,
            ${JSON.stringify(mp.sourceConfidence)}::jsonb,
            ${JSON.stringify(mp.conflictFlags)}::jsonb,
            NOW()
          )
          ON CONFLICT (canonical_model, canonical_part_number) DO UPDATE SET
            canonical_part_name = EXCLUDED.canonical_part_name,
            normalized_section = EXCLUDED.normalized_section,
            normalized_category = EXCLUDED.normalized_category,
            preferred_source = EXCLUDED.preferred_source,
            substitute_chain = EXCLUDED.substitute_chain,
            serial_applicability = EXCLUDED.serial_applicability,
            provider_rows = EXCLUDED.provider_rows,
            source_confidence = EXCLUDED.source_confidence,
            conflict_flags = EXCLUDED.conflict_flags,
            updated_at = NOW();
        `
      );

      await Promise.all(upsertPromises);
    }

    await upsertPartNumbersForModel(null, masterEntries, 'model-parts-master');
  } catch (err) {
    console.error('reconcileParts persist error', err);
  }
}
