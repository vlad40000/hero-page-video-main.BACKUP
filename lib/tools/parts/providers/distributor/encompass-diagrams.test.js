import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  parseEncompassModelPage,
  parseEncompassSearchResults,
} from './encompass-diagrams.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const SECTION_DIV_FIXTURE = `
<html><body>
  <div class="parts-sections">
    <div class="parts-section" data-section-id="DRUM" data-section-name="Drum">
      <h2 class="section-header">Drum</h2>
      <table class="parts-section-table">
        <tbody>
          <tr class="part-row">
            <td class="part-number">WP53-0918</td>
            <td class="part-description">Drum Bearing Ring</td>
            <td class="diagram-ref">A</td>
            <td class="list-price">$18.75</td>
          </tr>
          <tr class="part-row">
            <td class="part-number">WP8577274</td>
            <td class="part-description">Drum Rear Seal</td>
            <td class="diagram-ref">B</td>
            <td class="list-price">$22.50</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="parts-section" data-section-id="DRIVE" data-section-name="Drive Belt">
      <h2 class="section-header">Drive Belt</h2>
      <table class="parts-section-table">
        <tbody>
          <tr class="part-row">
            <td class="part-number">WP661570</td>
            <td class="part-description">Drive Belt 92.25 inch</td>
            <td class="diagram-ref">C</td>
            <td class="list-price">$12.99</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</body></html>
`;

const FLAT_TABLE_FIXTURE = `
<html><body>
  <table class="parts-list">
    <thead><tr><th>Part #</th><th>Description</th><th>Section</th><th>Ref</th></tr></thead>
    <tbody>
      <tr data-part-id="WP661570" data-section="Drive Belt">
        <td class="part-number">WP661570</td>
        <td class="description">Drive Belt</td>
        <td class="section-name">Drive Belt</td>
        <td class="ref">C</td>
      </tr>
      <tr data-part-id="WP8577274" data-section="Drum">
        <td class="part-number">WP8577274</td>
        <td class="description">Drum Rear Seal</td>
        <td class="section-name">Drum</td>
        <td class="ref">B</td>
      </tr>
    </tbody>
  </table>
</body></html>
`;

const SEARCH_FIXTURE = `
<html><body>
  <ul class="search-results">
    <li><a href="/service/Parts/Maytag/MLE2000AYW/">MLE2000AYW Dryer Parts</a></li>
    <li><a href="/service/Parts/Maytag/MLE2000BYW/">MLE2000BYW Dryer Parts</a></li>
    <li><a href="/service/Parts/Whirlpool/WTW4950XW3/">WTW4950XW3 Washer Parts</a></li>
  </ul>
</body></html>
`;

// ─── Test 1: fixture HTML parses assembly sections ────────────────────────────

describe('parseEncompassModelPage — section parsing', () => {
  it('parses data-section-name from parts-section divs', () => {
    const { parts, sectionsDiscovered } = parseEncompassModelPage(
      SECTION_DIV_FIXTURE,
      'MLE2000AYW',
      'https://encompass.com/service/Parts/Maytag/MLE2000AYW/'
    );

    expect(sectionsDiscovered).toBeGreaterThanOrEqual(2);
    const names = [...new Set(parts.map((p) => p.sectionName))];
    expect(names).toContain('Drum');
    expect(names).toContain('Drive Belt');
  });
});

// ─── Test 2: fixture HTML parses part rows ────────────────────────────────────

describe('parseEncompassModelPage — part row extraction', () => {
  it('extracts part number, name, section, and diagramRef from section-div layout', () => {
    const { parts } = parseEncompassModelPage(
      SECTION_DIV_FIXTURE,
      'MLE2000AYW',
      'https://encompass.com/service/Parts/Maytag/MLE2000AYW/'
    );

    expect(parts.length).toBe(3);

    const belt = parts.find((p) => p.rawPartNumber === 'WP661570');
    expect(belt).toBeDefined();
    expect(belt.rawPartName).toBe('Drive Belt 92.25 inch');
    expect(belt.sectionName).toBe('Drive Belt');
    expect(belt.diagramRef).toBe('C');
    expect(belt.source).toBe('encompass.com');
  });

  it('extracts parts from flat parts-list table layout', () => {
    const { parts } = parseEncompassModelPage(
      FLAT_TABLE_FIXTURE,
      'MLE2000AYW',
      'https://encompass.com/service/Parts/Maytag/MLE2000AYW/'
    );

    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts.find((p) => p.rawPartNumber === 'WP661570')).toBeDefined();
    expect(parts.find((p) => p.rawPartNumber === 'WP8577274')).toBeDefined();
  });

  it('deduplicates rows with the same part number and section', () => {
    const doubled = SECTION_DIV_FIXTURE + SECTION_DIV_FIXTURE;
    const { parts } = parseEncompassModelPage(doubled, 'MLE2000AYW', null);
    const keys = parts.map((p) => `${p.rawPartNumber}|${p.sectionName}`);
    expect(keys.length).toBe(new Set(keys).size);
  });

  it('returns empty parts without throwing on empty HTML', () => {
    expect(() => parseEncompassModelPage('', 'MLE2000AYW', null)).not.toThrow();
    expect(parseEncompassModelPage('', 'MLE2000AYW', null).parts).toHaveLength(0);
  });
});

// ─── Test 3: Encompass evidence is third_party ────────────────────────────────

describe('Encompass evidence classification', () => {
  it('sets source to encompass.com (third_party distributor, not manufacturer)', () => {
    const { parts } = parseEncompassModelPage(
      SECTION_DIV_FIXTURE,
      'MLE2000AYW',
      'https://encompass.com/service/Parts/Maytag/MLE2000AYW/'
    );
    parts.forEach((p) => {
      expect(p.source).toBe('encompass.com');
      expect(p.source).not.toMatch(/whirlpool|maytag|manufacturer/i);
    });
  });
});

// ─── Test 4: blocked_403 does not stop fallback ───────────────────────────────

describe('blocked_403 handling', () => {
  it('availabilityFromError maps HTTP 403 to blocked_403', async () => {
    const { availabilityFromError } = await import('@/lib/tools/parts/provider-availability');
    const err = new Error('Fetch failed 403');
    err.status = 403;
    const { availability } = availabilityFromError(err);
    expect(availability).toBe('blocked_403');
  });
});

// ─── Test 5: provider_exhausted remains non-cacheable ────────────────────────

describe('provider_exhausted cache contract', () => {
  it('provider_exhausted maps to durableStatus no_result with cacheEligible false', async () => {
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

// ─── Test 6: MLE2000AYW regression ───────────────────────────────────────────

describe('MLE2000AYW regression — audit and cache safety', () => {
  it('parseEncompassSearchResults resolves the exact model URL', () => {
    const url = parseEncompassSearchResults(SEARCH_FIXTURE, 'MLE2000AYW');
    expect(url).toMatch(/MLE2000AYW/);
    expect(url).toMatch(/encompass\.com/);
  });

  it('search results does not resolve a different model', () => {
    const url = parseEncompassSearchResults(SEARCH_FIXTURE, 'MLE2000AYW');
    expect(url).not.toMatch(/MLE2000BYW/);
    expect(url).not.toMatch(/WTW4950/);
  });

  it('no_result from Encompass does not get cache-eligible status', async () => {
    const { normalizeCacheStatus } = await import('@/lib/appliance-intelligence/verification/cache-status');
    const result = normalizeCacheStatus({
      status: 'no_result',
      parts: [],
      completeness: { sectionCount: 0 },
      providerEvidences: [
        { provider: 'encompass.com', evidenceType: 'third_party', partsCount: 0, verified: false },
      ],
    });
    expect(result.cacheEligibleStatus).toBe(false);
  });
});
