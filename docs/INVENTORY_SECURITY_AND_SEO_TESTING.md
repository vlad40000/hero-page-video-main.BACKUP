# Inventory access and SEO regression testing

## Current temporary access mode

The `/inventory` workspace is intentionally open without a password for the current operating phase.
Operational routes remain excluded from search indexing through `robots.txt` and `X-Robots-Tag` headers.

`AUTH_SECRET` is still required only for trusted external `POST /api/inventory-sync` clients. It does not control browser access to `/inventory`.

## Local and Preview verification

```bash
npm ci
npm run build
npm run test:e2e
```

To test a deployed Preview instead of starting the local dev server:

```bash
PLAYWRIGHT_BASE_URL=https://your-preview.example npm run test:e2e
```

The browser suite verifies public metadata, sitemap URLs, robots exclusions, direct inventory access, mobile conversion controls, and responsive overflow.
