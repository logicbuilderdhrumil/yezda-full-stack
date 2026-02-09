/**
 * Consent feature module - Consent prompts, review, status.
 */

// Screens
export { ConsentPromptScreen } from './screens/ConsentPromptScreen';
export { ConsentReviewScreen } from './screens/ConsentReviewScreen';

// Services
export {
  getConsentPrompt,
  submitConsent,
  getConsentStatus,
  getConsentById,
  updateConsent,
  withdrawConsent,
  ConsentApiError,
} from './services/consentService';

// Store
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
} from './store/consentStore';

// Components
export { ConsentStatusBadge, ConsentStatusInline } from './components/ConsentStatusBadge';
export { PrefillDisclosureBadge, PrefillFieldWrapper } from './components/PrefillDisclosureBadge';

// Types
export * from './types/consent.types';
