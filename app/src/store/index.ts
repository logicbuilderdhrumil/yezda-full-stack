/**
 * Store exports.
 * @deprecated Import from @/features/<feature> instead.
 */

export { useAuthStore, selectIsAuthenticated, selectIsLoading, selectUser, selectError, selectPendingMfa } from '@/features/auth';
export { useProfileStore, selectProfile, selectProfileScreenState, selectProfileError, selectProfileSuccess } from '@/features/profile';
export {
  useConsentStore,
  selectPrompt,
  selectSelectedScopes,
  selectConsents,
  selectPrefillDisclosures,
  selectConsentScreenState,
  selectConsentError,
  selectActiveConsents,
  selectHasConsentForScope,
} from '@/features/consent';
export {
  useApplicationStore,
  selectApplications,
  selectListScreenState,
  selectListError,
  selectCurrentApplication,
  selectDetailScreenState,
  selectDetailError,
  selectFormValues,
  selectFormErrors,
  selectIsDirty,
  selectLastSavedAt,
  selectSuccessMessage,
  selectSubmittedAt,
} from '@/features/applications';
