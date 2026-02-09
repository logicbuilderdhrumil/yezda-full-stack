/**
 * Profile feature module - View, edit profile, change password.
 */

// Screens
export { ProfileOverviewScreen } from './screens/ProfileOverviewScreen';
export { ProfileEditScreen } from './screens/ProfileEditScreen';
export { PasswordChangeScreen } from './screens/PasswordChangeScreen';

// Services
export {
  getProfile,
  updateProfile,
  ProfileApiError,
} from './services/profileService';

// Store
export {
  useProfileStore,
  selectProfile,
  selectProfileScreenState,
  selectProfileError,
  selectProfileSuccess,
} from './store/profileStore';

// Types
export * from './types/profile.types';

// Utils
export {
  validateProfileField,
  validateProfileForm,
  hasProfileFormErrors,
  profileToFormValues,
  formValuesToProfileUpdate,
} from './utils/profileValidation';
