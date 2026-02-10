/**
 * Shared consent types for data reuse across screening applications.
 * Aligned between app and backend.
 *
 * NOTE: This is a local copy of shared/@types/consent.types.ts
 * kept inside backend/src to satisfy rootDir constraints.
 */

/** Scope of data that can be reused */
export type ConsentScope =
  | 'personal_info'
  | 'employment_history'
  | 'education_history'
  | 'addresses'
  | 'references'
  | 'documents';

/** Consent decision status */
export type ConsentStatus = 'pending' | 'granted' | 'denied' | 'withdrawn';

/** Workflow state for consent processing */
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
  grantedAt?: number;
  withdrawnAt?: number;
  expiresAt?: number;
  createdAt: number;
  updatedAt: number;
}

/** Consent prompt request/response */
export interface ConsentPromptDTO {
  applicationId: string;
  sourceApplicationId: string;
  availableScopes: ConsentScope[];
  sourceOrganization: string;
  targetOrganization: string;
  sourceDate: string;
  workflowState: ConsentWorkflowState;
}

/** Consent submission payload */
export interface ConsentSubmitDTO {
  applicationId: string;
  sourceApplicationId: string;
  acceptedScopes: ConsentScope[];
  accepted: boolean;
}

/** Consent submission response */
export interface ConsentSubmitResponseDTO {
  consent: ConsentDecision;
  workflowState: ConsentWorkflowState;
}

/** Consent update request */
export interface ConsentUpdateDTO {
  scopes?: ConsentScope[];
  withdraw?: boolean;
}

/** Consent status response */
export interface ConsentStatusResponseDTO {
  consents: ConsentDecision[];
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

/** Consent error codes */
export const ConsentErrorCodes = {
  CONSENT_NOT_FOUND: 'CONSENT_NOT_FOUND',
  CONSENT_EXPIRED: 'CONSENT_EXPIRED',
  CONSENT_ALREADY_PROCESSED: 'CONSENT_ALREADY_PROCESSED',
  INVALID_CONSENT_SCOPE: 'INVALID_CONSENT_SCOPE',
  SOURCE_APPLICATION_NOT_FOUND: 'SOURCE_APPLICATION_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type ConsentErrorCode = (typeof ConsentErrorCodes)[keyof typeof ConsentErrorCodes];
