
import { test, expect } from '@playwright/test';

test.describe('Inventory Flow', () => {
    test('should open modal and allow creating a new unit', async ({ page }) => {
        test.setTimeout(60000); // Increase timeout for slow dev server

        // Set authentication cookie to bypass login
        await page.context().addCookies([{
            name: 'rr_employee_session',
            value: 'true',
            url: 'http://localhost:3000'
        }]);

        // Navigate to employee inventory
        await page.goto('/employee/inventory', { waitUntil: 'networkidle' });

        // 1. Trigger Modal
        const newUnitBtn = page.locator('button:has-text("New Unit")');
        await expect(newUnitBtn).toBeVisible({ timeout: 15000 });
        await newUnitBtn.click();

        // 2. Verify Modal Header
        await expect(page.getByRole('heading', { name: /New Unit/i })).toBeVisible({ timeout: 10000 });

        // 3. Fill Required Information
        // Using IDs for maximum reliability
        await page.locator('#title').fill('E2E Test Samsung Washer');
        await page.locator('#brand').fill('Samsung');
        await page.locator('#model').fill('WF45R6100A');
        await page.locator('#serial').fill('1234567890');

        // 4. Fill Price
        await page.locator('input[name="price"]').first().fill('450');

        // 5. Submit
        const saveBtn = page.getByRole('button', { name: /Save Inventory Unit/i });
        await expect(saveBtn).toBeEnabled();
        await saveBtn.click();

        // 6. Assert Result
        await expect(page.getByText(/Unit saved successfully/i)).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('heading', { name: /New Unit/i })).not.toBeVisible();
    });
});
