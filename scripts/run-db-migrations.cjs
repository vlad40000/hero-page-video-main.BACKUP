#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const dotenv = require("dotenv");
const { neon } = require("@neondatabase/serverless");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), ".env"), quiet: true });

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

function readArg(name) {
    const prefix = `--${name}=`;
    const index = process.argv.findIndex((arg) => arg === `--${name}`);
    const inline = process.argv.find((arg) => arg.startsWith(prefix));

    if (inline) return inline.slice(prefix.length);
    if (index >= 0) return process.argv[index + 1];
    return undefined;
}

function splitStatements(sqlText) {
    return sqlText
        .split(/;\s*(?:\r?\n|$)/)
        .map((statement) => statement.trim())
        .filter(Boolean);
}

async function readMigrationFiles() {
    const dir = path.resolve(process.cwd(), "drizzle");
    const entries = await fs.readdir(dir, { withFileTypes: true });

    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
        .map((entry) => path.join(dir, entry.name))
        .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

async function main() {
    const target = readArg("target") ?? process.env.DB_MIGRATION_TARGET ?? "parts";
    const dryRun = process.argv.includes("--dry-run");

    const targets = {
        app: {
            envName: "DATABASE_URL_UNPOOLED || DATABASE_URL",
            url: cleanEnvValue(process.env.DATABASE_URL_UNPOOLED) || cleanEnvValue(process.env.DATABASE_URL),
        },
        parts: {
            envName: "PARTS_DATABASE_URL",
            url: cleanEnvValue(process.env.PARTS_DATABASE_URL),
        },
    };

    if (!Object.hasOwn(targets, target)) {
        throw new Error("Use --target=app or --target=parts");
    }

    const selected = targets[target];
    if (!selected.url) {
        throw new Error(`Missing ${selected.envName}`);
    }

    const files = await readMigrationFiles();
    if (!files.length) {
        throw new Error("No SQL migration files found in drizzle/");
    }

    const plan = [];
    for (const file of files) {
        const sqlText = await fs.readFile(file, "utf8");
        plan.push({
            file,
            statements: splitStatements(sqlText),
        });
    }

    console.log(
        JSON.stringify(
            {
                target,
                env: selected.envName,
                dryRun,
                files: plan.map((item) => ({
                    file: path.relative(process.cwd(), item.file),
                    statements: item.statements.length,
                })),
            },
            null,
            2
        )
    );

    if (dryRun) return;

    const sql = neon(selected.url);
    await sql`select 1 as ok`;

    for (const item of plan) {
        const relative = path.relative(process.cwd(), item.file);

        for (const [index, statement] of item.statements.entries()) {
            try {
                await sql.query(statement);
            } catch (error) {
                throw new Error(
                    `${relative} statement ${index + 1} failed: ${sanitizeError(error)}`
                );
            }
        }

        console.log(`applied ${relative} (${item.statements.length} statements)`);
    }
}

main().catch((error) => {
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
