/**
 * Error Handling Middleware (Shared Infrastructure)
 *
 * Re-exports from the canonical source for use by clean-architecture modules.
 * The canonical implementation lives in `src/middleware/error.middleware.ts`.
 */

export {
  errorHandler,
  notFoundHandler,
  correlationIdMiddleware,
  asyncHandler,
  createError,
  createValidationError,
  createAccessDeniedError,
  createUnauthorizedError,
  shutdownAccessErrorLimiter,
  type ApiError,
  type ErrorCode,
  type ValidationErrorDetail,
  type ApiErrorEnvelope,
  isApiErrorEnvelope,
} from '../../../middleware/error.middleware.js';
