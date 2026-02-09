/**
 * Route Guards Middleware (Shared Infrastructure)
 *
 * Re-exports from the canonical source for use by clean-architecture modules.
 * The canonical implementation lives in `src/middleware/route-guards.middleware.ts`.
 */

export {
  requireAuthGuard,
  requireUserTypeGuard,
  requireRoleGuard,
  requireRoleOrOwnerGuard,
  requireClientGuard,
  requireClientAdminGuard,
  requireTenantScopeGuard,
  composeGuards,
  GUARD_SLOS,
  GUARD_METRICS,
  type AuthenticatedRoleRequest,
  type AuthenticatedUserPayload,
  type UserRole,
  type TenantScopedRequest,
} from '../../../middleware/route-guards.middleware.js';
