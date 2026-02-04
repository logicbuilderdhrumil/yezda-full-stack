/**
 * Application types for screening application forms.
 * Task 1.1: Define application fields, statuses, and form field types.
 * 
 * Re-exports shared DTOs and adds app-specific UI extensions.
 */

// Re-export shared types for contract alignment
export type {
  ApplicationStatus,
  SubmissionLifecycleState,
  ApplicationSummaryDTO as ApplicationSummary,
  ApplicationDTO as Application,
  FormSectionDTO as FormSection,
  FormFieldDTO as FormField,
  FieldType,
  FieldOption,
  FormValues,
  FormErrors,
  ApplicationDraftDTO as ApplicationDraft,
  ApplicationListResponseDTO as ApplicationListResponse,
  ApplicationDetailResponseDTO as ApplicationDetailResponse,
  ApplicationDraftResponseDTO as ApplicationDraftResponse,
  SaveDraftRequestDTO as SaveDraftRequest,
  SaveDraftResponseDTO as SaveDraftResponse,
  SubmitApplicationRequestDTO as SubmitApplicationRequest,
  SubmitApplicationResponseDTO as SubmitApplicationResponse,
  ValidationErrorDetail,
  ApiErrorResponse,
} from '@shared/application.types';

// ----- App-specific UI extensions (not part of wire format) -----

/** Application screen states */
export type ApplicationScreenState =
  | 'idle'
  | 'loading'
  | 'saving'
  | 'submitting'
  | 'error'
  | 'success'
  | 'submitted';

/** Error messages for application operations */
export const applicationErrorMessages = {
  loadFailed: 'Unable to load applications. Please try again.',
  loadDetailFailed: 'Unable to load application details. Please try again.',
  saveFailed: 'Unable to save draft. Please try again.',
  submitFailed: 'Unable to submit application. Please try again.',
  validationFailed: 'Please complete all required fields before submitting.',
  networkError: 'Connection failed. Check your network and try again.',
  unknownError: 'An unexpected error occurred. Please try again later.',
} as const;
