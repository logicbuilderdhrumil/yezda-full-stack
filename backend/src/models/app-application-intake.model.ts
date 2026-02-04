/**
 * App Application Intake Models
 * Task 1.1: Define app application intake endpoints and contracts
 */

import { z } from 'zod';

/**
 * Application status for screening applications
 */
export type ApplicationStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'expired';

/**
 * Form field types supported in application forms
 */
export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'textarea'
  | 'file'
  | 'signature';

/**
 * Form field definition
 */
export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  order: number;
}

/**
 * Form section containing grouped fields
 */
export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  order: number;
}

/**
 * Form definition for an application
 */
export interface FormDefinition {
  id: string;
  title: string;
  description?: string;
  sections: FormSection[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Application assigned to a candidate
 */
export interface Application {
  id: string;
  candidateId: string;
  tenantId: string;
  formDefinitionId: string;
  title: string;
  description?: string;
  status: ApplicationStatus;
  dueDate?: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Application with additional candidate context
 */
export interface AssignedApplication extends Application {
  formTitle: string;
  completionPercentage: number;
  lastSavedAt?: Date;
}

/**
 * Individual field response value
 */
export interface FieldResponse {
  fieldId: string;
  value: unknown;
  updatedAt: Date;
}

/**
 * Draft or submitted responses for an application
 */
export interface ApplicationResponse {
  id: string;
  applicationId: string;
  candidateId: string;
  responses: FieldResponse[];
  isDraft: boolean;
  savedAt: Date;
  submittedAt?: Date;
}

/**
 * Application form with responses for app retrieval
 */
export interface ApplicationFormWithResponses {
  application: Application;
  formDefinition: FormDefinition;
  savedResponses: FieldResponse[];
  lastSavedAt?: Date;
}

/**
 * Validation error for a specific field
 */
export interface FieldValidationError {
  fieldId: string;
  fieldName: string;
  message: string;
}

/**
 * Result of submission validation
 */
export interface SubmissionValidationResult {
  valid: boolean;
  errors: FieldValidationError[];
}

/**
 * Draft save request payload
 */
export interface SaveDraftRequest {
  applicationId: string;
  responses: { fieldId: string; value: unknown }[];
}

/**
 * Draft save response
 */
export interface SaveDraftResponse {
  success: boolean;
  savedAt: Date;
  completionPercentage: number;
}

/**
 * Final submission request payload
 */
export interface SubmitApplicationRequest {
  applicationId: string;
  responses: { fieldId: string; value: unknown }[];
}

/**
 * Final submission response
 */
export interface SubmitApplicationResponse {
  success: boolean;
  submittedAt: Date;
  applicationId: string;
  confirmationNumber: string;
}

// Zod schemas for request validation

export const saveResponseSchema = z.object({
  fieldId: z.string().min(1, 'Field ID is required'),
  value: z.unknown(),
});

export const saveDraftRequestSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID'),
  responses: z.array(saveResponseSchema).min(1, 'At least one response is required'),
});

export const submitApplicationRequestSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID'),
  responses: z.array(saveResponseSchema),
});

/**
 * Audit event types for app application intake
 */
export type AppApplicationAuditEventType =
  | 'APP_APPLICATION_LIST_VIEWED'
  | 'APP_APPLICATION_FORM_LOADED'
  | 'APP_APPLICATION_DRAFT_SAVED'
  | 'APP_APPLICATION_SUBMITTED'
  | 'APP_APPLICATION_SUBMISSION_FAILED';
