// import 'server-only';


import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Enable connection caching for better performance on Edge/Serverless
if (typeof window === 'undefined') {
    neonConfig.fetchConnectionCache = true;
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Missing DATABASE_URL");

export const sql = neon(url);
export const db = drizzle(sql, { schema });
