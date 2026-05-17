/**
 * Worker 5: Diagram Indexer
 * Discovers schematic/diagram groups for a given model and source.
 */

import * as cheerio from 'cheerio';
import { buildProviderAttempt } from '@/lib/tools/parts/provider-availability';

/**
 * Fetches the diagram index for a model from Sears PartsDirect.
 */
async function fetchSearsDiagramIndex(modelNumber) {
  const url = `https://www.searspartsdirect.com/model/${modelNumber}/parts`;
  
  try {
    const response = await fetch(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000) 
    });
    
    if (!response.ok) {
      console.warn(`Sears index fetch failed (${response.status}) for ${modelNumber}`);
      return {
        diagrams: [],
        providerAttempts: [
          buildProviderAttempt({
            provider: 'searspartsdirect.com',
            stage: 'diagram_index',
            availability: response.status === 403 ? 'blocked_403' : 'requires_manual_review',
            reason: `HTTP ${response.status}`,
            sourceUrl: url,
          }),
        ],
      };
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const diagrams = [];
    $('.model-section-card, .section-link, .schematic-link, a[href*="/model-section/"]').each((i, el) => {
      const $el = $(el);
      const label = $el.find('.section-name, .model-section-title, .schematic-name').text().trim() || $el.text().trim();
      const id = $el.attr('id') || `section-${i}`;
      const link = $el.attr('href') || $el.find('a').attr('href');
      
      if (label && link && !diagrams.some(d => d.label === label)) {
        diagrams.push({
          id,
          label,
          url: link.startsWith('http') ? link : `https://www.searspartsdirect.com${link}`
        });
      }
    });

    if (diagrams.length === 0) {
      console.log(`[Sears Indexer] No sections found in HTML for ${modelNumber}. Body length: ${html.length}`);
    }
    
    return {
      diagrams,
      providerAttempts: [
        buildProviderAttempt({
          provider: 'searspartsdirect.com',
          stage: 'diagram_index',
          availability: diagrams.length > 0 ? 'accessible' : 'requires_manual_review',
          reason: diagrams.length > 0 ? 'Diagram index returned sections.' : 'No diagram sections found in HTML.',
          partsCount: 0,
          sectionCount: diagrams.length,
          sourceUrl: url,
        }),
      ],
    };
  } catch (err) {
    console.error(`Sears index error for ${modelNumber}`, err);
    return {
      diagrams: [],
      providerAttempts: [
        buildProviderAttempt({
          provider: 'searspartsdirect.com',
          stage: 'diagram_index',
          availability: 'requires_manual_review',
          reason: err?.message || 'Sears diagram index request failed.',
          sourceUrl: url,
        }),
      ],
    };
  }
}

/**
 * Main entry point for Worker 5.
 */
export async function fetchDiagramIndex({ identity, route, variant }) {
  const { resolved_model, resolved_revision } = variant;

  // Use the resolved model (incorporating revision if needed)
  const lookupModel = resolved_revision 
    ? `${resolved_model}-${resolved_revision}` 
    : (resolved_model || identity.model_normalized);

  // We allow Sears lookup for ANY brand if this function is called, 
  // as the orchestrator handles the 'should we fallback' decision.
  const result = await fetchSearsDiagramIndex(lookupModel);
  return { ok: true, diagrams: result.diagrams || [], providerAttempts: result.providerAttempts || [] };
}
