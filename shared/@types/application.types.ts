/**
 * Shared application types for screening application forms.
 * Aligned between app and backend.
 */

import type { ValidationErrorDetail, ApiErrorResponse } from './consent.types.js';

/** Application status values */
export type ApplicationStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected';

/** Submission lifecycle state */
export type SubmissionLifecycleState =
  | 'draft'
  | 'validating'
  | 'submitting'
  | 'submitted'
  | 'processing'
  | 'completed'
  | 'failed';

/** Application summary for list view */
export interface ApplicationSummaryDTO {
  id: string;
  title: string;
  status: ApplicationStatus;
  lifecycleState: SubmissionLifecycleState;
  dueDate: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

/** Full application with form sections */
export interface ApplicationDTO {
  id: string;
  title: string;
  description?: string;
  status: ApplicationStatus;
  lifecycleState: SubmissionLifecycleState;
  dueDate: string | null;
  progress: number;
  sections: FormSectionDTO[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

/** Form section containing fields */
export interface FormSectionDTO {
  id: string;
  title: string;
  description?: string;
  order: number;
  fields: FormFieldDTO[];
}

/** Supported form field types */
export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'radio';

/** Field option for select/radio/checkbox */
export interface FieldOption {
  value: string;
  label: string;
}

/** Unified form field definition */
export interface FormFieldDTO {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  order: number;
  placeholder?: string;
  helpText?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  rows?: number;
  minDate?: string;
  maxDate?: string;
  options?: FieldOption[];
  multiple?: boolean;
}

/** Form field values map */
export type FormValues = Record<string, string | string[] | boolean>;

/** Form field errors map */
export type FormErrors = Record<string, string | undefined>;

/** Draft data for saving progress */
export interface ApplicationDraftDTO {
  applicationId: string;
  values: FormValues;
  savedAt: number;
}

/** API response types */
export interface ApplicationListResponseDTO {
  applications: ApplicationSummaryDTO[];
}

export interface ApplicationDetailResponseDTO {
  application: ApplicationDTO;
}

export interface ApplicationDraftResponseDTO {
  draft: ApplicationDraftDTO | null;
}

export interface SaveDraftRequestDTO {
  values: FormValues;
}

export interface SaveDraftResponseDTO {
  success: boolean;
  savedAt: number;
  lifecycleState: SubmissionLifecycleState;
}

export interface SubmitApplicationRequestDTO {
  values: FormValues;
}

export interface SubmitApplicationResponseDTO {
  success: boolean;
  submittedAt: string;
  message: string;
  lifecycleState: SubmissionLifecycleState;
}

/** Standardized validation error response for submissions */
export interface SubmissionValidationErrorDTO extends ApiErrorResponse {
  code: 'VALIDATION_ERROR';
  details: ValidationErrorDetail[];
}

/** Application error codes */
export const ApplicationErrorCodes = {
  APPLICATION_NOT_FOUND: 'APPLICATION_NOT_FOUND',
  APPLICATION_ALREADY_SUBMITTED: 'APPLICATION_ALREADY_SUBMITTED',
  APPLICATION_EXPIRED: 'APPLICATION_EXPIRED',
  DRAFT_NOT_FOUND: 'DRAFT_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
} as const;

export type ApplicationErrorCode = (typeof ApplicationErrorCodes)[keyof typeof ApplicationErrorCodes];

/** Re-export shared types */
export type { ValidationErrorDetail, ApiErrorResponse };
