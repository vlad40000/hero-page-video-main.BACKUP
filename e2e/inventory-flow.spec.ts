import { test, expect } from '@playwright/test';

test.describe('Inventory workspace access', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium');
  });

  test('inventory opens directly without employee authentication', async ({ page }) => {
    const response = await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/inventory$/);
    await expect(page.getByText('FLOOD', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Unit' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    expect(response?.headers()['x-robots-tag']).toContain('noindex');
  });

  test('legacy employee login URL redirects to inventory', async ({ page }) => {
    await page.goto('/employee/login', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/inventory$/);
  });
});
