import { defineConfig, devices } from '@playwright/test';

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '');
const baseURL = externalBaseUrl || 'http://127.0.0.1:3000';
const localInventoryPassword =
  process.env.E2E_INVENTORY_PASSWORD || 'playwright-local-inventory-password';
const localSessionSecret =
  process.env.E2E_INVENTORY_SESSION_SECRET ||
  'playwright-local-session-secret-change-before-production-2026';
const localApiSecret =
  process.env.E2E_AUTH_SECRET || 'playwright-local-api-secret-change-before-production-2026';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : 'list',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: {
          ...process.env,
          INVENTORY_ADMIN_PASSWORD: localInventoryPassword,
          INVENTORY_SESSION_SECRET: localSessionSecret,
          AUTH_SECRET: localApiSecret,
        },
      },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'tablet-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 1366 },
      },
    },
  ],
});
