/**
 * Form Builder Rate-Limit Middleware — re-export
 *
 * Re-exports the legacy rate-limit middleware to keep it co-located
 * with this module's interface layer.
 */
export {
  formBuilderReadRateLimiter,
  formBuilderWriteRateLimiter,
} from '../../../../middleware/form-builder-rate-limit.middleware.js';
