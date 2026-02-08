/**
 * Applications feature module - Application list, details, draft, submit.
 */

// Screens
export { ApplicationListScreen } from './screens/ApplicationListScreen';
export { ApplicationDetailScreen } from './screens/ApplicationDetailScreen';

// Services
export {
  getApplications,
  getApplication,
  getApplicationDraft,
  saveApplicationDraft,
  submitApplication,
  ApplicationApiError,
} from './services/applicationService';

// Store
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
} from './store/applicationStore';

// Types
export * from './types/application.types';

// Utils
export {
  validateField,
  validateSection,
  validateForm,
  hasErrors,
  getErrorSummary,
  getMissingRequiredFields,
} from './utils/applicationValidation';
