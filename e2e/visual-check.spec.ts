import { test, expect } from '@playwright/test';

const routes = [
  { name: 'home', path: '/' },
  { name: 'shop', path: '/shop' },
  { name: 'repair', path: '/service' },
] as const;

test.describe('Responsive visual smoke checks', () => {
  for (const route of routes) {
    test(`${route.name} renders without horizontal overflow`, async ({ page }, testInfo) => {
      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBeLessThan(400);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);

      await page.screenshot({
        path: testInfo.outputPath(`${route.name}.png`),
        fullPage: true,
      });
    });
  }
});
