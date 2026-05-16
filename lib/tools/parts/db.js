import { neon } from '@neondatabase/serverless';

const url = process.env.PARTS_DATABASE_URL || process.env.DATABASE_URL;
if (!url) throw new Error('Missing PARTS_DATABASE_URL or DATABASE_URL');

export const sql = neon(url);
export const partsSql = sql;
