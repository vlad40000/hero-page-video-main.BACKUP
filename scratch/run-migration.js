const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Missing DATABASE_URL in .env.local');
    process.exit(1);
  }

  const sql = neon(url);
  const migrationPath = path.join(process.cwd(), 'drizzle', '0001_parts_finder_persistence.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Running migration: 0001_parts_finder_persistence.sql...');

  // Split migration into individual statements (basic splitter for simple migrations)
  const statements = migrationSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await sql.query(statement);
      console.log('Successfully executed statement.');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('Table or index already exists, skipping statement.');
      } else {
        console.error('Error executing statement:', err.message);
        console.error('Statement:', statement);
      }
    }
  }

  console.log('Migration completed.');
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
