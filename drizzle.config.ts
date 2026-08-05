import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error("Missing DATABASE_URL_UNPOOLED (or DATABASE_URL)");

const config = {
    schema: "./lib/db/schema.ts",
    out: "./drizzle",
    driver: "pg",
    dbCredentials: {
        url: url,
    },
};

export default config;
