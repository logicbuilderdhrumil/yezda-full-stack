/**
 * Form Builder Domain Entities
 * Core domain types for form definition management.
 */

// ── Field & Section Types ─────────────────────────────────────────────────────

export const FORM_FIELD_TYPES = [
  'text',
  'email',
  'phone',
  'number',
  'date',
  'datetime',
  'time',
  'select',
  'multiselect',
  'checkbox',
  'radio',
  'textarea',
  'file',
  'signature',
  'section',
  'heading',
] as const;
export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

export const VALIDATION_RULE_TYPES = [
  'required',
  'minLength',
  'maxLength',
  'min',
  'max',
  'pattern',
  'email',
  'phone',
  'url',
  'custom',
] as const;
export type ValidationRuleType = (typeof VALIDATION_RULE_TYPES)[number];

export const FORM_STATUSES = ['draft', 'published', 'archived'] as const;
export type FormStatus = (typeof FORM_STATUSES)[number];

export interface ValidationRule {
  type: ValidationRuleType;
  value?: string | number | boolean;
  message?: string;
}

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface ConditionalRule {
  fieldId: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'empty' | 'notEmpty';
  value?: string | number | boolean;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  name: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string | number | boolean | string[];
  options?: SelectOption[];
  validations?: ValidationRule[];
  conditionalVisibility?: ConditionalRule;
  order: number;
  metadata?: Record<string, unknown>;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  order: number;
  conditionalVisibility?: ConditionalRule;
}

export interface FormSettings {
  allowDraft?: boolean;
  submitButtonText?: string;
  successMessage?: string;
  redirectUrl?: string;
  notifyOnSubmit?: string[];
  expiresAt?: Date;
}

export interface FormDefinition {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  version: number;
  status: FormStatus;
  sections: FormSection[];
  settings: FormSettings;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

export interface FormDefinitionSummary {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  version: number;
  status: FormStatus;
  fieldCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface CreateFormDto {
  name: string;
  description?: string;
  sections: FormSection[];
  settings?: FormSettings;
  status?: FormStatus;
  metadata?: Record<string, unknown>;
}

export interface UpdateFormDto {
  name?: string;
  description?: string;
  sections?: FormSection[];
  settings?: FormSettings;
  status?: FormStatus;
  metadata?: Record<string, unknown>;
}

export interface ListFormsQuery {
  status?: FormStatus;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ListFormsResponse {
  forms: FormDefinitionSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetFormResponse {
  form: FormDefinition;
  cachedAt?: Date;
}

// ── Operation Result ──────────────────────────────────────────────────────────

export interface FormOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

// ── Context ───────────────────────────────────────────────────────────────────

export interface FormContext {
  actorId: string;
  actorType: 'user' | 'candidate';
  actorRoles: string[];
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  channel: 'web' | 'mobile' | 'api';
}

// ── Audit Event Types ─────────────────────────────────────────────────────────

export type FormBuilderAuditEventType =
  | 'FORM_CREATED'
  | 'FORM_UPDATED'
  | 'FORM_PUBLISHED'
  | 'FORM_ARCHIVED'
  | 'FORM_DELETED'
  | 'FORM_ACCESS_DENIED';

// ── Domain helpers ────────────────────────────────────────────────────────────

/**
 * Validate field ID uniqueness within a form
 */
export function validateFieldIdUniqueness(sections: FormSection[]): { valid: boolean; duplicateIds: string[] } {
  const fieldIds = new Set<string>();
  const duplicateIds: string[] = [];

  for (const section of sections) {
    for (const field of section.fields) {
      if (fieldIds.has(field.id)) {
        duplicateIds.push(field.id);
      } else {
        fieldIds.add(field.id);
      }
    }
  }

  return { valid: duplicateIds.length === 0, duplicateIds };
}

/**
 * Validate conditional visibility references
 */
export function validateConditionalReferences(sections: FormSection[]): { valid: boolean; invalidRefs: string[] } {
  const fieldIds = new Set<string>();
  const invalidRefs: string[] = [];

  for (const section of sections) {
    for (const field of section.fields) {
      fieldIds.add(field.id);
    }
  }

  for (const section of sections) {
    if (section.conditionalVisibility && !fieldIds.has(section.conditionalVisibility.fieldId)) {
      invalidRefs.push(section.conditionalVisibility.fieldId);
    }
    for (const field of section.fields) {
      if (field.conditionalVisibility && !fieldIds.has(field.conditionalVisibility.fieldId)) {
        invalidRefs.push(field.conditionalVisibility.fieldId);
      }
    }
  }

  return { valid: invalidRefs.length === 0, invalidRefs };
}

/**
 * Count total fields in a form
 */
export function countFormFields(sections: FormSection[]): number {
  return sections.reduce((total, section) => total + section.fields.length, 0);
}
