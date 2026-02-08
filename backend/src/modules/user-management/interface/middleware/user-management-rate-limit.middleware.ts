/**
 * User Management Rate-Limit Middleware — re-export
 *
 * Re-exports the legacy rate-limit middleware to keep it co-located
 * with this module's interface layer.
 */
export {
  userManagementListRateLimiter,
  userManagementCreateRateLimiter,
  userManagementUpdateRateLimiter,
  userManagementDeleteRateLimiter,
} from '../../../../middleware/user-management-rate-limit.middleware.js';
