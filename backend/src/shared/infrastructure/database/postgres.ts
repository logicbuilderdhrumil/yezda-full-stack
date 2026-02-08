/**
 * PostgreSQL Database Connection (Shared Infrastructure)
 *
 * Re-exports from the canonical source for use by clean-architecture modules.
 * The canonical implementation lives in `src/db/postgres.ts`.
 */

export { getPool, query, getClient, closePool, healthCheck } from '../../../db/postgres.js';
export { default } from '../../../db/postgres.js';
