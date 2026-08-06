import { test, expect, type APIRequestContext } from '@playwright/test';

const CORE_PUBLIC_ROUTES = [
  '/',
  '/shop',
  '/service',
  '/washers',
  '/dryers',
  '/refrigerators',
  '/stoves-ranges',
  '/washer-dryer-sets',
] as const;

const INTERNAL_PATHS = [
  '/inventory',
  '/employee',
  '/forms',
  '/leasing',
  '/wholesale',
  '/place-order',
  '/parts/uploads',
] as const;

async function fetchInBatches(request: APIRequestContext, urls: string[]) {
  const failures: Array<{ url: string; status: number }> = [];

  for (let index = 0; index < urls.length; index += 8) {
    const batch = urls.slice(index, index + 8);
    const results = await Promise.all(
      batch.map(async (url) => {
        const response = await request.get(url);
        return { url, status: response.status() };
      }),
    );
    failures.push(...results.filter(({ status }) => status >= 400));
  }

  return failures;
}

test.describe('Search discovery contract', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium');
  });

  test('robots.txt allows public crawling and excludes operational workspaces', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.ok()).toBeTruthy();
    const robots = await response.text();

    expect(robots).toContain('Sitemap: https://roadrunnerappliance.com/sitemap.xml');
    for (const path of INTERNAL_PATHS) {
      expect(robots).toContain(`Disallow: ${path}`);
    }
  });

  test('sitemap contains only public URLs and every listed URL responds', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.ok()).toBeTruthy();
    const sitemap = await response.text();
    const urls = Array.from(sitemap.matchAll(/<loc>(.*?)<\/loc>/g), (match) => match[1]);

    expect(urls.length).toBeGreaterThan(10);
    for (const path of INTERNAL_PATHS) {
      expect(urls.some((url) => new URL(url).pathname.startsWith(path))).toBeFalsy();
    }

    const failures = await fetchInBatches(request, urls);
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
  });

  for (const route of CORE_PUBLIC_ROUTES) {
    test(`${route} has indexable metadata and a canonical URL`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBeLessThan(400);
      await expect(page).toHaveTitle(/Road Runner Appliance/i);
      await expect(page.locator('h1').first()).toBeVisible();

      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      await expect(canonical).toHaveAttribute('href', /^https:\/\/roadrunnerappliance\.com\//);

      const robots = await page.locator('meta[name="robots"]').getAttribute('content');
      expect(robots?.toLowerCase() || '').not.toContain('noindex');
    });
  }

  test('LocalBusiness structured data references a real logo asset', async ({ page, request }) => {
    await page.goto('/');
    const rawSchema = await page.locator('#local-business-schema').textContent();
    expect(rawSchema).toBeTruthy();

    const schema = JSON.parse(rawSchema || '{}') as { image?: string[]; logo?: string };
    expect(schema.logo).toBe('https://roadrunnerappliance.com/road-runner-logo.png');
    expect(schema.image).toContain('https://roadrunnerappliance.com/road-runner-logo.png');

    const logoResponse = await request.get('/road-runner-logo.png');
    expect(logoResponse.ok()).toBeTruthy();
  });
});

test.describe('Operational endpoint contract', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium');
  });

  test('external inventory sync remains protected', async ({ request }) => {
    const response = await request.post('/api/inventory-sync', {
      data: { title: 'Unauthorized test' },
    });

    expect([401, 503]).toContain(response.status());
  });

  test('inventory browser APIs no longer fail only because a session cookie is absent', async ({ request }) => {
    const imageEnhanceResponse = await request.post('/api/image-enhance', {
      data: {},
    });
    expect(imageEnhanceResponse.status()).toBe(400);
  });

  test('the obsolete employee diagnostic endpoint is not exposed', async ({ request }) => {
    const response = await request.get('/api/test-user');
    expect(response.status()).toBe(404);
  });
});

test.describe('Mobile conversion controls', () => {
  test('Shop, Repair, and Call remain visible without covering content', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium');

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const quickActions = page.getByRole('navigation', { name: 'Quick actions' });
    await expect(quickActions).toBeVisible();
    await expect(quickActions.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/shop');
    await expect(quickActions.getByRole('link', { name: 'Repair' })).toHaveAttribute('href', '/service');
    await expect(quickActions.getByRole('link', { name: /Call Road Runner Appliance/ })).toHaveAttribute(
      'href',
      'tel:843-536-6005',
    );

    const box = await quickActions.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(Math.round((box?.y || 0) + (box?.height || 0))).toBeLessThanOrEqual(viewport?.height || 0);
  });

  test('the conversion bar stays out of the inventory workspace', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium');
    await page.goto('/inventory');
    await expect(page.getByRole('navigation', { name: 'Quick actions' })).toHaveCount(0);
  });
});
