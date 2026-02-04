/**
 * Application types for screening application forms.
 * Task 1.1: Define application fields, statuses, and form field types.
 */

/** Application status values */
export type ApplicationStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected';

/** Submission lifecycle state (aligned with backend) */
export type SubmissionLifecycleState =
  | 'draft'
  | 'validating'
  | 'submitting'
  | 'submitted'
  | 'processing'
  | 'completed'
  | 'failed';

/** Application summary for list view */
export interface ApplicationSummary {
  id: string;
  title: string;
  status: ApplicationStatus;
  lifecycleState: SubmissionLifecycleState;
  dueDate: string | null;
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

/** Full application with form sections */
export interface Application {
  id: string;
  title: string;
  description?: string;
  status: ApplicationStatus;
  lifecycleState: SubmissionLifecycleState;
  dueDate: string | null;
  progress: number;
  sections: FormSection[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

/** Form section containing fields */
export interface FormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  fields: FormField[];
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

/** Base form field properties */
interface BaseFormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  order: number;
  placeholder?: string;
  helpText?: string;
}

/** Text input field */
export interface TextField extends BaseFormField {
  type: 'text' | 'email' | 'phone';
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

/** Textarea field */
export interface TextareaField extends BaseFormField {
  type: 'textarea';
  maxLength?: number;
  rows?: number;
}

/** Date field */
export interface DateField extends BaseFormField {
  type: 'date';
  minDate?: string;
  maxDate?: string;
}

/** Select field with options */
export interface SelectField extends BaseFormField {
  type: 'select';
  options: FieldOption[];
  multiple?: boolean;
}

/** Checkbox field */
export interface CheckboxField extends BaseFormField {
  type: 'checkbox';
  options?: FieldOption[];
}

/** Radio field */
export interface RadioField extends BaseFormField {
  type: 'radio';
  options: FieldOption[];
}

/** Field option for select/radio/checkbox */
export interface FieldOption {
  value: string;
  label: string;
}

/** Union type for all form fields */
export type FormField =
  | TextField
  | TextareaField
  | DateField
  | SelectField
  | CheckboxField
  | RadioField;

/** Form field values map */
export type FormValues = Record<string, string | string[] | boolean>;

/** Form field errors map */
export type FormErrors = Record<string, string | undefined>;

/** Draft data for saving progress */
export interface ApplicationDraft {
  applicationId: string;
  values: FormValues;
  savedAt: number;
}

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

/** API response types */
export interface ApplicationListResponse {
  applications: ApplicationSummary[];
}

export interface ApplicationDetailResponse {
  application: Application;
}

export interface ApplicationDraftResponse {
  draft: ApplicationDraft | null;
}

export interface SaveDraftRequest {
  values: FormValues;
}

export interface SaveDraftResponse {
  success: boolean;
  savedAt: number;
  lifecycleState: SubmissionLifecycleState;
}

export interface SubmitApplicationRequest {
  values: FormValues;
}

export interface SubmitApplicationResponse {
  success: boolean;
  submittedAt: string;
  message: string;
  lifecycleState: SubmissionLifecycleState;
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
