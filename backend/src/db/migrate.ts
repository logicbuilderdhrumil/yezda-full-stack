/**
 * Database Migration Runner
 * Executes SQL migration files in order
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, closePool } from './postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQL_DIR = path.join(__dirname, 'sql');

/**
 * Run all migrations in order
 */
export async function runMigrations(): Promise<void> {
  console.log('[Migration] Starting migrations...');

  // Create migrations tracking table if not exists
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Get list of SQL files
  const files = fs.readdirSync(SQL_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  // Get already applied migrations
  const applied = await query<{ filename: string }>(
    'SELECT filename FROM _migrations'
  );
  const appliedSet = new Set(applied.rows.map(r => r.filename));

  // Run pending migrations
  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`[Migration] Skipping ${file} (already applied)`);
      continue;
    }

    console.log(`[Migration] Applying ${file}...`);
    const sql = fs.readFileSync(path.join(SQL_DIR, file), 'utf-8');
    
    try {
      await query(sql);
      await query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      console.log(`[Migration] Applied ${file}`);
    } catch (error) {
      console.error(`[Migration] Failed to apply ${file}:`, error);
      throw error;
    }
  }

  console.log('[Migration] All migrations complete');
}

/**
 * Drop all tables (for testing only)
 */
export async function dropAllTables(): Promise<void> {
  const tables = [
    'organizations',
    'audit_logs',
    'mfa_enrollments',
    'password_reset_tokens',
    'sessions',
    'candidates',
    'users',
    '_migrations',
  ];

  for (const table of tables) {
    await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
  }
}

// Run migrations if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => closePool())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
