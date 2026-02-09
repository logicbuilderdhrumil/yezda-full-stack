/**
 * Validation Middleware (Shared Infrastructure)
 *
 * Re-exports from the canonical source for use by clean-architecture modules.
 * The canonical implementation lives in `src/middleware/validation.middleware.ts`.
 */

export {
  validateBody,
  validateQuery,
  validateParams,
  signUpSchema,
  signInSchema,
  mfaVerifySchema,
  refreshTokenSchema,
  passwordResetRequestSchema,
  passwordResetCompleteSchema,
  mfaEnrollmentVerifySchema,
  deviceTokenRegistrationSchema,
  deviceTokenUnregistrationSchema,
  notificationDispatchSchema,
  appSignInSchema,
  appMfaVerifySchema,
  appRefreshTokenSchema,
} from '../../../middleware/validation.middleware.js';
