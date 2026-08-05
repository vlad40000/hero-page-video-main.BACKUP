# Inventory security and SEO regression testing

## Required deployment environment variables

Set these in the Vercel project for Preview and Production:

- `INVENTORY_ADMIN_PASSWORD`: private employee password, at least 12 characters.
- `INVENTORY_SESSION_SECRET`: random session-signing value, at least 32 characters.
- `AUTH_SECRET`: separate random bearer token for trusted `/api/inventory-sync` clients, at least 32 characters.

If the inventory password or session secret is absent, `/inventory` remains locked. The external inventory-sync API returns `503` when `AUTH_SECRET` is absent or too short.

## Local and Preview verification

```bash
npm ci
npm run build
npm run test:e2e
```

To test a deployed Preview instead of starting the local dev server:

```bash
PLAYWRIGHT_BASE_URL=https://your-preview.example \
E2E_INVENTORY_PASSWORD='the-preview-inventory-password' \
npm run test:e2e
```

The browser suite verifies public metadata, sitemap URLs, robots exclusions, inventory authentication, anonymous API rejection, mobile conversion controls, and responsive overflow.
