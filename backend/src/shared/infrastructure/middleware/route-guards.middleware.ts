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
  requirePlatformGuard,
  requireOrgGuard,
  requireTenantScopeGuard,
  composeGuards,
  GUARD_SLOS,
  GUARD_METRICS,
  PLATFORM_ROLES,
  ORG_ROLES,
  type AuthenticatedRoleRequest,
  type AuthenticatedUserPayload,
  type UserRole,
  type UserSpace,
  type TenantScopedRequest,
} from '../../../middleware/route-guards.middleware.js';
