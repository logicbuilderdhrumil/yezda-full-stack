/**
 * PostgreSQL Database Connection
 * Provides connection pool for persistent storage
 */

import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

/**
 * Get PostgreSQL connection pool (singleton)
 */
export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      max: config.database.maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('[DB] Unexpected error on idle client', err);
    });
  }
  return pool;
}

/**
 * Execute a query with automatic connection handling
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await getPool().query<T>(text, params);
    const duration = Date.now() - start;
    if (duration > 100) {
      console.warn(`[DB] Slow query (${duration}ms):`, text.substring(0, 100));
    }
    return result;
  } catch (error) {
    console.error('[DB] Query error:', error);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<pg.PoolClient> {
  return getPool().connect();
}

/**
 * Close all pool connections
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Check database connectivity
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export default { getPool, query, getClient, closePool, healthCheck };
