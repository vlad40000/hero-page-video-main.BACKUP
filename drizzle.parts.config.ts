import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

const url = process.env.PARTS_DATABASE_URL;
if (!url) throw new Error("Missing PARTS_DATABASE_URL");

const config = {
    schema: "./lib/db/schema.ts",
    out: "./drizzle",
    driver: "pg",
    dbCredentials: {
        url,
    },
};

export default config;
