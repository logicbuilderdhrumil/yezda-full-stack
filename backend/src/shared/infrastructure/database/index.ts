/**
 * Database barrel export
 *
 * Named re-exports to avoid conflicts between postgres and redis
 * (both export `healthCheck` and `default`).
 */
export {
  getPool,
  query,
  getClient,
  closePool,
  healthCheck as postgresHealthCheck,
} from './postgres.js';

export {
  getRedis,
  closeRedis,
  healthCheck as redisHealthCheck,
  checkRateLimit,
  clearRateLimit,
  cacheGet,
  cacheSet,
  cacheDel,
  storeMfaSession,
  consumeMfaSession,
  type MfaSession,
} from './redis.js';
