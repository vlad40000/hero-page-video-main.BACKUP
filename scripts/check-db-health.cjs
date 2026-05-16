#!/usr/bin/env node

const path = require("node:path");
const dotenv = require("dotenv");
const { neon } = require("@neondatabase/serverless");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), ".env"), quiet: true });

const APP_TABLES = ["inventory", "leads", "employees"];
const PARTS_TABLE_GROUPS = {
    coreRuntime: [
        "appliance_parts_cache",
        "model_parts_master",
        "model_parts_raw",
        "model_resolution",
        "model_search_cache",
        "part_number_registry",
        "search_sessions",
        "nameplate_extractions",
    ],
    modelBomWarehouse: [
        "appliance_boms",
        "appliance_models",
        "bom_assemblies",
        "bom_part",
        "bom_part_mapping",
        "bom_parts",
        "diagram_manifest_row",
        "diagram_section",
        "model_diagram_manifest",
        "model_parts_cache",
        "model_retrieval_summary",
    ],
    providerRouting: [
        "encompass_brand_configs",
        "encompass_brand_routes",
        "encompass_model_urls",
        "model_source_urls",
        "provider_assembly_sections",
        "provider_model_routes",
        "provider_part_seed_rows",
    ],
    pricingMarketInventory: [
        "appliance_inventory_queue",
        "channel_listing",
        "ebay_listing_image_asset",
        "machine_inventory",
        "part_inventory",
        "part_market_signal",
        "part_price_snapshot",
        "part_pricing",
    ],
    captureWorkflow: [
        "agent_preset",
        "bom_capture_session",
        "bom_captured_part",
        "bom_job_groups",
        "bom_jobs",
        "bom_retrieval_jobs",
        "bom_telemetry",
        "capture_artifacts",
        "part_reviews",
        "retrieval_jobs",
    ],
};
const PARTS_TABLES = [...new Set(Object.values(PARTS_TABLE_GROUPS).flat())];

function cleanEnvValue(value) {
    return value?.trim().replace(/^["']|["']$/g, "");
}

function sanitizeError(error) {
    const raw = error instanceof Error ? error.message : String(error);

    return raw
        .replace(/postgres(?:ql)?:\/\/[^\s'"<>]+/gi, "postgres://[redacted]")
        .replace(/password=[^&\s]+/gi, "password=[redacted]")
        .replace(/:[^:@/\s]+@/g, ":[redacted]@");
}

async function checkDatabase(key, envName, requiredTables) {
    const url = cleanEnvValue(process.env[envName]);

    if (!url) {
        return {
            key,
            envName,
            configured: false,
            ok: false,
            select1: {
                ok: false,
                error: `${envName} is not set`,
            },
            tables: requiredTables.map((name) => ({
                name,
                ok: false,
                exists: false,
                error: "skipped because the database URL is missing",
            })),
        };
    }

    const sql = neon(url);
    const startedAt = Date.now();

    try {
        await sql`select 1 as ok`;
    } catch (error) {
        return {
            key,
            envName,
            configured: true,
            ok: false,
            select1: {
                ok: false,
                latencyMs: Date.now() - startedAt,
                error: sanitizeError(error),
            },
            tables: requiredTables.map((name) => ({
                name,
                ok: false,
                exists: false,
                error: "skipped because select 1 failed",
            })),
        };
    }

    const tables = await Promise.all(
        requiredTables.map(async (name) => {
            try {
                const rows = await sql`
                    select to_regclass(${`public.${name}`})::text as regclass
                `;
                const exists = Boolean(rows[0]?.regclass);

                return {
                    name,
                    ok: exists,
                    exists,
                    ...(exists ? {} : { error: "table is missing" }),
                };
            } catch (error) {
                return {
                    name,
                    ok: false,
                    exists: false,
                    error: sanitizeError(error),
                };
            }
        })
    );

    return {
        key,
        envName,
        configured: true,
        ok: tables.every((table) => table.ok),
        select1: {
            ok: true,
            latencyMs: Date.now() - startedAt,
        },
        tables,
    };
}

function summarizeTableGroups(tables, groups) {
    const byName = new Map(tables.map((table) => [table.name, table]));

    return Object.entries(groups).map(([name, groupTables]) => {
        const checks = groupTables.map((tableName) => byName.get(tableName) ?? {
            name: tableName,
            ok: false,
            exists: false,
            error: "table was not checked",
        });
        const missing = checks.filter((table) => !table.ok).map((table) => table.name);

        return {
            name,
            ok: missing.length === 0,
            checked: checks.length,
            missing,
        };
    });
}

async function buildReport() {
    const appUrl = cleanEnvValue(process.env.DATABASE_URL);
    const partsUrl = cleanEnvValue(process.env.PARTS_DATABASE_URL);
    const [app, parts] = await Promise.all([
        checkDatabase("app", "DATABASE_URL", APP_TABLES),
        checkDatabase("parts", "PARTS_DATABASE_URL", PARTS_TABLES),
    ]);

    const warnings = [];
    if (!partsUrl) {
        warnings.push("PARTS_DATABASE_URL is missing; parts runtime code may fall back to DATABASE_URL.");
    }
    if (appUrl && partsUrl && appUrl === partsUrl) {
        warnings.push("DATABASE_URL and PARTS_DATABASE_URL are identical; this is not a two-database split.");
    }

    const partsWithGroups = {
        ...parts,
        tableGroups: summarizeTableGroups(parts.tables, PARTS_TABLE_GROUPS),
    };

    return {
        ok: app.ok && partsWithGroups.ok,
        generatedAt: new Date().toISOString(),
        environment: {
            nodeEnv: process.env.NODE_ENV ?? null,
            vercelEnv: process.env.VERCEL_ENV ?? null,
        },
        split: {
            appEnvName: "DATABASE_URL",
            partsEnvName: "PARTS_DATABASE_URL",
            bothConfigured: Boolean(appUrl && partsUrl),
            separateConnectionStrings: Boolean(appUrl && partsUrl && appUrl !== partsUrl),
        },
        databases: {
            app,
            parts: partsWithGroups,
        },
        migrations: {
            app: {
                config: "drizzle.config.ts",
                env: "DATABASE_URL_UNPOOLED || DATABASE_URL",
                command: "npm run db:migrate:app",
            },
            parts: {
                config: "drizzle.parts.config.ts",
                env: "PARTS_DATABASE_URL",
                command: "npm run db:migrate:parts",
            },
        },
        warnings,
    };
}

buildReport()
    .then((report) => {
        console.log(JSON.stringify(report, null, 2));
        process.exitCode = report.ok ? 0 : 1;
    })
    .catch((error) => {
        console.error(
            JSON.stringify(
                {
                    ok: false,
                    error: sanitizeError(error),
                },
                null,
                2
            )
        );
        process.exitCode = 1;
    });
