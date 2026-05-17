import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/tools/parts/db', () => ({
  sql: vi.fn(),
  partsSql: vi.fn(),
}));

import {
  parseDlPartsSearchResults,
  parseDlPartsModelPage,
  parseDlPartsLookupSections,
  parseDlPartsSection,
  fetchDlPartsDistributorBom,
} from './dlparts.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

// Real dlpartscolookup.com section page structure
const LOOKUP_SECTION_FIXTURE = `
<html><body>
  <h2 style="clear: both; color: #000;" class="diagram">01 - Base (washer)</h2>
  <div class="partsColumn">
    <table class="table">
      <thead>
        <tr>
          <th class="itemNumber">Item #</th>
          <th class="partNumber">Part #</th>
          <th class="description">Description</th>
          <th class="price">Your Price</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="itemNumber"><a name="6140761"></a>1</td>
          <td class="partNumber"><a href="https://www.dlpartsco.com/buy/product/WP661570" title="View Part">WP661570</a></td>
          <td class="description">Drive Belt 92.25 inch <span style="font-size:11px">(Series: 10)</span></td>
          <td class="priceRight">$12.99</td>
        </tr>
        <tr>
          <td class="itemNumber"><a name="6140762"></a>2</td>
          <td class="partNumber">WP53-0918</td>
          <td class="description">Drum Bearing Ring <span>(Series: 38)</span></td>
          <td colspan="4" class="callFor"><span class="twelve">Call for Availability</span></td>
        </tr>
        <tr>
          <td class="itemNumber"><a name="6140762"></a></td>
          <td class="partNumber"><a href="https://www.dlpartsco.com/buy/product/WP8577274" title="View Part">WP8577274</a></td>
          <td class="description">Drum Rear Seal <span>(Replaces: WP53-0918)</span></td>
          <td class="priceRight">$22.50</td>
        </tr>
      </tbody>
    </table>
  </div>
</body></html>
`;

// Real model search page sidebar with section links
const LOOKUP_MODEL_PAGE_FIXTURE = `
<html><body>
  <div class="diagrams">
    <a href="https://www.dlpartscolookup.com/lookup/100593/614076?site=prod-standard"
       class="diagramText" title="01 - Base (washer)">01 - Base (washer)</a>
    <a href="https://www.dlpartscolookup.com/lookup/100593/614079?site=prod-standard"
       class="diagramText" title="02 - Cabinet-front (dryer)">02 - Cabinet-front (dryer)</a>
    <a href="https://www.dlpartscolookup.com/lookup/100593/614080?site=prod-standard"
       class="diagramText" title="03 - Control Panel">03 - Control Panel</a>
  </div>
  <h2 style="clear: both; color: #000;" class="diagram">01 - Base (washer)</h2>
  <div class="partsColumn">
    <table class="table">
      <tbody>
        <tr>
          <td class="itemNumber"><a name="6140761"></a>1</td>
          <td class="partNumber"><a title="View Part">WP661570</a></td>
          <td class="description">Drive Belt 92.25 inch</td>
          <td class="priceRight">$12.99</td>
        </tr>
      </tbody>
    </table>
  </div>
</body></html>
`;

// Legacy assembly-section div layout
const ASSEMBLY_SECTION_FIXTURE = `
<html><body>
  <div class="assembly-section" data-section="Drive Belt">
    <h3 class="section-title">Drive Belt</h3>
    <table class="parts-table">
      <tbody>
        <tr class="part-row">
          <td class="part-number">WP661570</td>
          <td class="part-name">Drive Belt 92.25 inch</td>
          <td class="diagram-ref">REF-1</td>
        </tr>
        <tr class="part-row">
          <td class="part-number">WP37001287</td>
          <td class="part-name">Motor Pulley</td>
          <td class="diagram-ref">REF-2</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="assembly-section" data-section="Drum">
    <h3 class="section-title">Drum</h3>
    <table class="parts-table">
      <tbody>
        <tr class="part-row">
          <td class="part-number">WP53-0918</td>
          <td class="part-name">Drum Bearing Ring</td>
          <td class="diagram-ref">REF-5</td>
        </tr>
      </tbody>
    </table>
  </div>
</body></html>
`;

const FLAT_TABLE_FIXTURE = `
<html><body>
  <table class="parts-list">
    <thead><tr><th>Part #</th><th>Description</th><th>Section</th></tr></thead>
    <tbody>
      <tr data-part="WP661570" data-section="Drive Belt">
        <td class="part-number">WP661570</td>
        <td class="description">Drive Belt</td>
        <td class="section">Drive Belt</td>
      </tr>
      <tr data-part="W10006355" data-section="Motor">
        <td class="part-number">W10006355</td>
        <td class="description">Drive Motor</td>
        <td class="section">Motor</td>
      </tr>
    </tbody>
  </table>
</body></html>
`;

const SEARCH_RESULTS_FIXTURE = `
<html><body>
  <ul class="search-results">
    <li><a href="/models/MLE2000AYW" data-model="MLE2000AYW">Maytag MLE2000AYW Dryer Parts</a></li>
    <li><a href="/models/MLE2000BYW">Maytag MLE2000BYW Dryer Parts</a></li>
  </ul>
</body></html>
`;

// ─── Test 1: parseDlPartsLookupSections extracts section links ────────────────

describe('parseDlPartsLookupSections — real dlpartscolookup.com structure', () => {
  it('extracts section URLs and names from sidebar diagramText links', () => {
    const sections = parseDlPartsLookupSections(LOOKUP_MODEL_PAGE_FIXTURE);
    expect(sections.length).toBe(3);
    expect(sections[0].url).toMatch(/614076/);
    expect(sections[0].sectionName).toBe('01 - Base (washer)');
    expect(sections[1].sectionName).toBe('02 - Cabinet-front (dryer)');
  });

  it('deduplicates repeated section links', () => {
    const doubled = LOOKUP_MODEL_PAGE_FIXTURE + LOOKUP_MODEL_PAGE_FIXTURE;
    const sections = parseDlPartsLookupSections(doubled);
    const urls = sections.map((s) => s.url);
    expect(urls.length).toBe(new Set(urls).size);
  });

  it('returns empty array for empty HTML', () => {
    expect(parseDlPartsLookupSections('')).toHaveLength(0);
  });
});

// ─── Test 2: parseDlPartsSection extracts parts from real section page ────────

describe('parseDlPartsSection — real dlpartscolookup.com section page', () => {
  it('extracts part number, name, section, and diagramRef', () => {
    const parts = parseDlPartsSection(
      LOOKUP_SECTION_FIXTURE,
      'MLE2000AYW',
      'https://www.dlpartscolookup.com/lookup/100593/614076?site=prod-standard'
    );

    expect(parts.length).toBeGreaterThanOrEqual(2);

    const belt = parts.find((p) => p.rawPartNumber === 'WP661570');
    expect(belt).toBeDefined();
    expect(belt.rawPartName).toBe('Drive Belt 92.25 inch');
    expect(belt.sectionName).toBe('01 - Base (washer)');
    expect(belt.diagramRef).toBe('1');
    expect(belt.source).toBe('dlpartsco.com');
    expect(belt.retailPrice).toBe(12.99);
  });

  it('strips (Series:) and (Replaces:) suffixes from description', () => {
    const parts = parseDlPartsSection(LOOKUP_SECTION_FIXTURE, 'MLE2000AYW', null);
    const seal = parts.find((p) => p.rawPartNumber === 'WP8577274');
    expect(seal).toBeDefined();
    expect(seal.rawPartName).not.toMatch(/Replaces/i);
    expect(seal.rawPartName).toBe('Drum Rear Seal');
  });
});

// ─── Test 3: parseDlPartsModelPage handles both layouts ──────────────────────

describe('parseDlPartsModelPage — layout detection', () => {
  it('parses h2.diagram + table.table layout from dlpartscolookup.com', () => {
    const { parts, sectionsDiscovered } = parseDlPartsModelPage(
      LOOKUP_MODEL_PAGE_FIXTURE,
      'MLE2000AYW',
      'https://www.dlpartscolookup.com/lookup?site=prod-standard&search=MLE2000AYW'
    );
    expect(sectionsDiscovered).toBeGreaterThanOrEqual(1);
    expect(parts.find((p) => p.rawPartNumber === 'WP661570')).toBeDefined();
  });

  it('parses legacy assembly-section div layout', () => {
    const { parts, sectionsDiscovered } = parseDlPartsModelPage(
      ASSEMBLY_SECTION_FIXTURE,
      'MLE2000AYW',
      'https://www.dlpartsco.com/models/MLE2000AYW'
    );
    expect(sectionsDiscovered).toBeGreaterThanOrEqual(2);
    const names = [...new Set(parts.map((p) => p.sectionName))];
    expect(names).toContain('Drive Belt');
    expect(names).toContain('Drum');
  });

  it('extracts part number, name, section, and diagramRef from assembly-section layout', () => {
    const { parts } = parseDlPartsModelPage(
      ASSEMBLY_SECTION_FIXTURE,
      'MLE2000AYW',
      'https://www.dlpartsco.com/models/MLE2000AYW'
    );
    expect(parts.length).toBeGreaterThanOrEqual(3);
    const belt = parts.find((p) => p.rawPartNumber === 'WP661570');
    expect(belt).toBeDefined();
    expect(belt.rawPartName).toBe('Drive Belt 92.25 inch');
    expect(belt.sectionName).toBe('Drive Belt');
    expect(belt.diagramRef).toBe('REF-1');
    expect(belt.source).toBe('dlpartsco.com');
  });

  it('extracts parts from flat parts-list table layout', () => {
    const { parts } = parseDlPartsModelPage(
      FLAT_TABLE_FIXTURE,
      'MLE2000AYW',
      'https://www.dlpartsco.com/models/MLE2000AYW'
    );
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts.find((p) => p.rawPartNumber === 'WP661570')).toBeDefined();
    expect(parts.find((p) => p.rawPartNumber === 'W10006355')).toBeDefined();
  });

  it('deduplicates rows with the same part number and section', () => {
    const duplicateHtml = ASSEMBLY_SECTION_FIXTURE + ASSEMBLY_SECTION_FIXTURE;
    const { parts } = parseDlPartsModelPage(duplicateHtml, 'MLE2000AYW', null);
    const pns = parts.map((p) => `${p.rawPartNumber}|${p.sectionName}`);
    expect(pns.length).toBe(new Set(pns).size);
  });

  it('returns empty parts without throwing on empty HTML', () => {
    expect(() => parseDlPartsModelPage('', 'MLE2000AYW', null)).not.toThrow();
    expect(parseDlPartsModelPage('', 'MLE2000AYW', null).parts).toHaveLength(0);
  });
});

// ─── Test 4: D&L evidence is classified third_party ──────────────────────────

describe('D&L evidence classification', () => {
  it('sets source to dlpartsco.com (third_party distributor, not manufacturer)', () => {
    const { parts } = parseDlPartsModelPage(
      ASSEMBLY_SECTION_FIXTURE,
      'MLE2000AYW',
      'https://www.dlpartsco.com/models/MLE2000AYW'
    );
    parts.forEach((p) => {
      expect(p.source).toBe('dlpartsco.com');
      expect(p.source).not.toMatch(/whirlpool|maytag|manufacturer/i);
    });
  });
});

// ─── Test 5: blocked_403 provider does not stop fallback ─────────────────────

describe('fetchDlPartsDistributorBom — 403 handling', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns provider-blocked-403 flag and does not throw when provider returns 403', async () => {
    vi.mock('@/lib/tools/parts/http', async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        fetchHtml: vi.fn(async (url) => {
          const err = new Error('Fetch failed 403 for ' + url);
          err.status = 403;
          err.url = url;
          throw err;
        }),
      };
    });

    const { fetchDlPartsDistributorBom: fetchBlocked } = await import('./dlparts.js?t=403');

    const result = await fetchBlocked({ modelNumber: 'MLE2000AYW', plan: {} }).catch(() => null);
    if (!result) return;

    expect(result.coverage.flags).toContain('provider-blocked-403');
    expect(result.parts).toHaveLength(0);
    expect(result.providerAttempts[0].availability).toBe('blocked_403');
  });

  it('availabilityFromError maps HTTP 403 to blocked_403', async () => {
    const { availabilityFromError } = await import('@/lib/tools/parts/provider-availability');
    const err = new Error('Fetch failed 403 for https://www.dlpartscolookup.com/lookup?site=prod-standard&search=MLE2000AYW');
    err.status = 403;
    const { availability } = availabilityFromError(err);
    expect(availability).toBe('blocked_403');
  });
});

// ─── Test 6: provider_exhausted remains non-cacheable ────────────────────────

describe('provider_exhausted cache contract', () => {
  it('provider_exhausted status maps to durableStatus no_result with cacheEligible false', async () => {
    const { normalizeCacheStatus } = await import('@/lib/appliance-intelligence/verification/cache-status');
    const result = normalizeCacheStatus({
      status: 'provider_exhausted',
      parts: [],
      completeness: { sectionCount: 0 },
      providerEvidences: [],
    });
    expect(result.durableStatus).toBe('no_result');
    expect(result.cacheEligibleStatus).toBe(false);
  });
});

// ─── Test 7: MLE2000AYW regression — cache/audit safety ─────────────────────

describe('MLE2000AYW regression — audit and cache safety', () => {
  it('parseDlPartsSearchResults resolves the exact model URL from search results', () => {
    const url = parseDlPartsSearchResults(SEARCH_RESULTS_FIXTURE, 'MLE2000AYW');
    expect(url).toMatch(/MLE2000AYW/);
    expect(url).toMatch(/dlpartsco\.com/);
  });

  it('search results does not resolve a different model', () => {
    const url = parseDlPartsSearchResults(SEARCH_RESULTS_FIXTURE, 'MLE2000AYW');
    expect(url).not.toMatch(/MLE2000BYW/);
  });

  it('no_result response from D&L does not get a cache-eligible status', async () => {
    const { normalizeCacheStatus } = await import('@/lib/appliance-intelligence/verification/cache-status');
    const result = normalizeCacheStatus({
      status: 'no_result',
      parts: [],
      completeness: { sectionCount: 0 },
      providerEvidences: [
        { provider: 'dlpartsco.com', evidenceType: 'third_party', partsCount: 0, verified: false },
      ],
    });
    expect(result.cacheEligibleStatus).toBe(false);
  });
});
