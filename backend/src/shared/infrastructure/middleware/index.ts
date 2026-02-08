/**
 * Middleware barrel export (Shared Infrastructure)
 */
export * from './auth.middleware.js';
export * from './rate-limit.middleware.js';
export * from './validation.middleware.js';
export * from './error.middleware.js';
export * from './mock-mode.middleware.js';

// Re-export route-guards explicitly to avoid AuthenticatedRequest conflict
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
} from './route-guards.middleware.js';
