import { test, expect } from '@playwright/test';

const externalBaseUrl = Boolean(process.env.PLAYWRIGHT_BASE_URL);
const inventoryPassword =
  process.env.E2E_INVENTORY_PASSWORD ||
  process.env.INVENTORY_ADMIN_PASSWORD ||
  (!externalBaseUrl ? 'playwright-local-inventory-password' : '');

test.describe('Inventory access control', () => {
  test('anonymous visitors are redirected to the employee sign-in page', async ({ page }) => {
    const response = await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/employee\/login\?next=%2Finventory/);
    await expect(page.getByRole('heading', { name: 'Inventory sign in' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
    expect(response?.headers()['x-robots-tag']).toContain('noindex');
  });

  test('an invalid password does not create an inventory session', async ({ page }) => {
    await page.goto('/employee/login');
    await page.getByLabel('Inventory password').fill('incorrect-password');
    await page.getByRole('button', { name: 'Open inventory' }).click();

    await expect(page).toHaveURL(/error=invalid/);
    await expect(page.getByRole('alert')).toContainText('not accepted');
  });

  test('an authorized employee can open inventory and sign out', async ({ page }) => {
    test.skip(!inventoryPassword, 'Set E2E_INVENTORY_PASSWORD to test an external deployment.');

    await page.goto('/employee/login');
    await page.getByLabel('Inventory password').fill(inventoryPassword);
    await page.getByRole('button', { name: 'Open inventory' }).click();

    await expect(page).toHaveURL(/\/inventory$/);
    await expect(page.getByRole('button', { name: 'Sign out of inventory' })).toBeVisible();

    await page.getByRole('button', { name: 'Sign out of inventory' }).click();
    await expect(page).toHaveURL(/\/employee\/login$/);
  });
});
