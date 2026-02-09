/**
 * Rate Limiting Middleware (Shared Infrastructure)
 *
 * Re-exports from the canonical source for use by clean-architecture modules.
 * The canonical implementation lives in `src/middleware/rate-limit.middleware.ts`.
 */

export {
  standardRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  shellConfigRateLimiter,
  firebaseTokenRateLimiter,
  firebaseDispatchRateLimiter,
} from '../../../middleware/rate-limit.middleware.js';
