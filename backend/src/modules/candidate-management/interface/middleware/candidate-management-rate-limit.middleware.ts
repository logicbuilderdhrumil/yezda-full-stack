/**
 * Candidate Management Rate Limiting Middleware
 * Re-exports from legacy middleware location.
 */
export {
  candidateManagementListRateLimiter,
  candidateManagementCreateRateLimiter,
  candidateManagementUpdateRateLimiter,
  candidateManagementDeleteRateLimiter,
  candidateManagementBulkRateLimiter,
  candidateSubmissionRateLimiter,
  candidateListCacheMiddleware,
} from '../../../../middleware/candidate-management-rate-limit.middleware.js';
