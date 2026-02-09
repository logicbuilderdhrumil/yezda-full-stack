/**
 * Authentication Middleware (Shared Infrastructure)
 *
 * Re-exports from the canonical source for use by clean-architecture modules.
 * The canonical implementation lives in `src/middleware/auth.middleware.ts`.
 */

export {
  requireAuth,
  optionalAuth,
  requireUserType,
  type AuthenticatedRequest,
} from '../../../middleware/auth.middleware.js';
