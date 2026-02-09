/**
 * App Application Intake Domain Entities
 * Candidate application intake domain types
 */

export interface ApplicationResponse {
  fieldId: string;
  value: unknown;
}

export interface AssignedApplication {
  id: string;
  status: string;
  formName?: string;
  assignedAt?: Date;
  dueDate?: Date;
}

export interface ApplicationFormData {
  applicationId: string;
  formId?: string;
  formName?: string;
  fields?: unknown[];
  savedResponses?: ApplicationResponse[];
  status?: string;
}

export interface ApplicationResult {
  success: boolean;
  applications?: AssignedApplication[];
  data?: ApplicationFormData | Record<string, unknown>;
  error?: string;
  errorCode?: string;
  validationErrors?: Array<{ field: string; message: string }>;
}

export type Channel = 'web' | 'mobile' | 'api';
