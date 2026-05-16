
import { test, expect } from '@playwright/test';

test('Responsive Design Visual Check', async ({ page }) => {
    // 1. Home Page
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000); // Wait for animations/loading

    // Desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.screenshot({ path: 'visual_check_home_desktop.png' });

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'visual_check_home_tablet.png' });

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: 'visual_check_home_mobile.png' });

    // 2. Login Page
    await page.goto('http://localhost:3000/employee/login');
    await page.waitForTimeout(1000);

    // Desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.screenshot({ path: 'visual_check_login_desktop.png' });

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: 'visual_check_login_mobile.png' });

    // 3. Shop Page
    await page.goto('http://localhost:3000/shop');
    await page.waitForTimeout(2000);

    // Desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.screenshot({ path: 'visual_check_shop_desktop.png' });

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: 'visual_check_shop_mobile.png' });

    // 4. Product Detail (Click first item)
    // Assuming there's at least one item and it fits a generic selector like 'a[href^="/products/"]' or a product card query
    const firstProduct = page.locator('a[href^="/products/"]').first();
    if (await firstProduct.count() > 0) {
        await firstProduct.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Desktop
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.screenshot({ path: 'visual_check_product_desktop.png' });

        // Mobile
        await page.setViewportSize({ width: 375, height: 812 });
        await page.screenshot({ path: 'visual_check_product_mobile.png' });
    } else {
        console.log('No products found on shop page to click.');
    }
});
