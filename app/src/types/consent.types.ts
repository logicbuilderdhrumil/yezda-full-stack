/**
 * Consent types for data reuse across screening applications.
 * Task 1.1: Define consent copy, scope descriptors, and disclosure text.
 */

/** Scope of data that can be reused */
export type ConsentScope =
  | 'personal_info'
  | 'employment_history'
  | 'education_history'
  | 'addresses'
  | 'references'
  | 'documents';

/** Human-readable labels for consent scopes */
export const consentScopeLabels: Record<ConsentScope, string> = {
  personal_info: 'Personal Information',
  employment_history: 'Employment History',
  education_history: 'Education History',
  addresses: 'Address History',
  references: 'Professional References',
  documents: 'Uploaded Documents',
};

/** Descriptions for each consent scope */
export const consentScopeDescriptions: Record<ConsentScope, string> = {
  personal_info: 'Name, date of birth, contact information, and identifiers',
  employment_history: 'Previous employers, job titles, dates of employment',
  education_history: 'Schools, degrees, certifications, and graduation dates',
  addresses: 'Current and previous residential addresses',
  references: 'Names and contact details of professional references',
  documents: 'ID documents, certifications, and other uploaded files',
};

/** Consent decision status */
export type ConsentStatus = 'pending' | 'granted' | 'denied' | 'withdrawn';

/** Workflow state for consent processing (aligned with backend) */
export type ConsentWorkflowState =
  | 'awaiting_response'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'revoked';

/** A single consent decision record */
export interface ConsentDecision {
  id: string;
  candidateId: string;
  applicationId: string;
  sourceApplicationId: string;
  scopes: ConsentScope[];
  status: ConsentStatus;
  workflowState: ConsentWorkflowState;
  grantedAt?: number; // Unix timestamp in milliseconds
  withdrawnAt?: number; // Unix timestamp in milliseconds
  expiresAt?: number; // Unix timestamp in milliseconds
  createdAt: number;
  updatedAt: number;
}

/** Consent prompt request from backend */
export interface ConsentPromptRequest {
  applicationId: string;
  sourceApplicationId: string;
  availableScopes: ConsentScope[];
  sourceOrganization: string;
  targetOrganization: string;
  sourceDate: string; // ISO date string
  workflowState: ConsentWorkflowState;
}

/** Consent submission payload */
export interface ConsentSubmitRequest {
  applicationId: string;
  sourceApplicationId: string;
  acceptedScopes: ConsentScope[];
  accepted: boolean;
}

/** Consent submission response */
export interface ConsentSubmitResponse {
  consent: ConsentDecision;
  workflowState: ConsentWorkflowState;
}

/** Validation error detail for field-level errors */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

/** Standardized API error response */
export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: ValidationErrorDetail[];
}

/** Consent update request (for modifying or withdrawing) */
export interface ConsentUpdateRequest {
  consentId: string;
  scopes?: ConsentScope[];
  withdraw?: boolean;
}

/** Consent status response */
export interface ConsentStatusResponse {
  consents: ConsentDecision[];
}

/** Prefilled field disclosure info */
export interface PrefillDisclosure {
  fieldName: string;
  sourceApplicationId: string;
  sourceOrganization: string;
  sourceDate: string;
  value: string;
}

/** UI states for consent screens */
export type ConsentScreenState = 'idle' | 'loading' | 'error' | 'success';

/** Consent copy and disclosure text */
export const consentCopy = {
  /** Main prompt title */
  promptTitle: 'Reuse Previous Application Data',

  /** Main prompt description */
  promptDescription:
    'We found data from a previous screening application that can be used to speed up your current application. Select which information you would like to reuse.',

  /** Source data explanation */
  sourceExplanation: (org: string, date: string) =>
    `This data was collected during your application with ${org} on ${date}.`,

  /** Privacy notice */
  privacyNotice:
    'Your data will only be shared with the new organization for the purpose of this screening. You can withdraw consent at any time.',

  /** Accept button text */
  acceptButton: 'Accept & Reuse Data',

  /** Decline button text */
  declineButton: 'No Thanks, Start Fresh',

  /** Confirm title for withdrawal */
  withdrawTitle: 'Withdraw Consent',

  /** Confirm message for withdrawal */
  withdrawMessage:
    'If you withdraw consent, the reused data will be removed from your current application. You may need to re-enter this information manually.',

  /** Withdraw button text */
  withdrawButton: 'Withdraw Consent',

  /** Cancel button text */
  cancelButton: 'Cancel',

  /** Success message after granting consent */
  grantedSuccess: 'Your data has been successfully reused.',

  /** Success message after withdrawing consent */
  withdrawnSuccess: 'Your consent has been withdrawn. Reused data has been removed.',

  /** Prefill disclosure label */
  prefillLabel: 'Prefilled from prior application',

  /** Prefill disclosure source */
  prefillSource: (org: string, date: string) => `Source: ${org} (${date})`,
} as const;

/** Error messages for consent flows */
export const consentErrorMessages = {
  loadFailed: 'Failed to load consent options. Please try again.',
  submitFailed: 'Failed to save your consent decision. Please try again.',
  withdrawFailed: 'Failed to withdraw consent. Please try again.',
  networkError: 'Connection failed. Check your network and try again.',
  unknownError: 'An unexpected error occurred. Please try again later.',
} as const;
