/**
 * Redis Connection (Shared Infrastructure)
 *
 * Re-exports from the canonical source for use by clean-architecture modules.
 * The canonical implementation lives in `src/db/redis.ts`.
 */

export {
  getRedis,
  closeRedis,
  healthCheck,
  checkRateLimit,
  clearRateLimit,
  cacheGet,
  cacheSet,
  cacheDel,
  storeMfaSession,
  consumeMfaSession,
  type MfaSession,
} from '../../../db/redis.js';

export { default } from '../../../db/redis.js';
