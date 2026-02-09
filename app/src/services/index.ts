/**
 * Service exports.
 * @deprecated Import from @/features/<feature> instead.
 */

export { signIn, verifyMfa, refreshTokens, signOut, AuthApiError, getAuthHeaders } from '@/features/auth';
export { getProfile, updateProfile, ProfileApiError } from '@/features/profile';
export {
  getConsentPrompt,
  submitConsent,
  getConsentStatus,
  getConsentById,
  updateConsent,
  withdrawConsent,
  ConsentApiError,
} from '@/features/consent';
export {
  getApplications,
  getApplication,
  getApplicationDraft,
  saveApplicationDraft,
  submitApplication,
  ApplicationApiError,
} from '@/features/applications';
export {
  registerDeviceToken,
  unregisterDeviceToken,
  unregisterAllDeviceTokens,
  getActiveDeviceTokens,
  NotificationApiError,
  notificationErrorMessages,
} from '@/features/notifications';
