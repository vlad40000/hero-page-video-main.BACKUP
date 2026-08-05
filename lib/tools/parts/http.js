import 'server-only';
import { load } from 'cheerio';

export function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function normalizePartNumber(value) {
  return cleanText(value).toUpperCase().replace(/[\s-]+/g, '');
}

export function normalizeModelToken(value) {
  return cleanText(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export async function fetchHtml(url, options = {}) {
  const timeoutMs = Number(options.timeoutMs || process.env.PARTS_HTTP_TIMEOUT_MS || 12000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': options.userAgent || process.env.PARTS_HTTP_USER_AGENT || 'Mozilla/5.0 (compatible; appliance-parts-bot/1.0)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        ...(options.headers || {}),
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const error = new Error(`Fetch failed ${res.status} for ${url}`);
      error.status = res.status;
      error.url = url;
      throw error;
    }

    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export function htmlToText(html) {
  const $ = load(String(html || ''));
  $('script, style, noscript, svg').remove();
  return cleanText($('body').text());
}

export function uniqueBy(items = [], keyFn = (item) => item) {
  const out = [];
  const seen = new Set();
  for (const item of items || []) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
