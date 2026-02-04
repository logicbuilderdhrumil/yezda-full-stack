/**
 * Form Builder Models
 * Task 1.1: Define form definition schema and validation rules.
 * Task 1.4: Tenant scoping and role-based access control models.
 */

import { z } from 'zod';

/**
 * Supported form field types
 */
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

/**
 * Validation rule types
 */
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

/**
 * Form status values
 */
export const FORM_STATUSES = ['draft', 'published', 'archived'] as const;
export type FormStatus = (typeof FORM_STATUSES)[number];

/**
 * Validation rule configuration
 */
export interface ValidationRule {
  type: ValidationRuleType;
  value?: string | number | boolean;
  message?: string;
}

/**
 * Select option for dropdowns, radios, checkboxes
 */
export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

/**
 * Conditional visibility rule
 */
export interface ConditionalRule {
  fieldId: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'empty' | 'notEmpty';
  value?: string | number | boolean;
}

/**
 * Form field definition
 */
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

/**
 * Form section for grouping fields
 */
export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  order: number;
  conditionalVisibility?: ConditionalRule;
}

/**
 * Form definition
 */
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

/**
 * Form settings
 */
export interface FormSettings {
  allowDraft?: boolean;
  submitButtonText?: string;
  successMessage?: string;
  redirectUrl?: string;
  notifyOnSubmit?: string[];
  expiresAt?: Date;
}

/**
 * Form definition summary (for list endpoints)
 */
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

/**
 * Create form request
 */
export interface CreateFormRequest {
  name: string;
  description?: string;
  sections: FormSection[];
  settings?: FormSettings;
  status?: FormStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Update form request
 */
export interface UpdateFormRequest {
  name?: string;
  description?: string;
  sections?: FormSection[];
  settings?: FormSettings;
  status?: FormStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Form list query parameters
 */
export interface ListFormsQuery {
  status?: FormStatus;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Form list response
 */
export interface ListFormsResponse {
  forms: FormDefinitionSummary[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Form retrieval response
 */
export interface GetFormResponse {
  form: FormDefinition;
  cachedAt?: Date;
}

// Zod validation schemas

export const validationRuleSchema = z.object({
  type: z.enum(VALIDATION_RULE_TYPES),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  message: z.string().max(500).optional(),
});

export const selectOptionSchema = z.object({
  label: z.string().min(1).max(200),
  value: z.string().min(1).max(200),
  disabled: z.boolean().optional(),
});

export const conditionalRuleSchema = z.object({
  fieldId: z.string().min(1).max(100),
  operator: z.enum(['equals', 'notEquals', 'contains', 'notContains', 'empty', 'notEmpty']),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

export const formFieldSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum(FORM_FIELD_TYPES),
  name: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  placeholder: z.string().max(200).optional(),
  helpText: z.string().max(500).optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  options: z.array(selectOptionSchema).optional(),
  validations: z.array(validationRuleSchema).optional(),
  conditionalVisibility: conditionalRuleSchema.optional(),
  order: z.number().int().min(0),
  metadata: z.record(z.unknown()).optional(),
});

export const formSectionSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  fields: z.array(formFieldSchema),
  order: z.number().int().min(0),
  conditionalVisibility: conditionalRuleSchema.optional(),
});

export const formSettingsSchema = z.object({
  allowDraft: z.boolean().optional(),
  submitButtonText: z.string().max(100).optional(),
  successMessage: z.string().max(1000).optional(),
  redirectUrl: z.string().url().optional(),
  notifyOnSubmit: z.array(z.string().email()).optional(),
  expiresAt: z.coerce.date().optional(),
});

export const createFormRequestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  sections: z.array(formSectionSchema).min(1),
  settings: formSettingsSchema.optional(),
  status: z.enum(FORM_STATUSES).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateFormRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  sections: z.array(formSectionSchema).optional(),
  settings: formSettingsSchema.optional(),
  status: z.enum(FORM_STATUSES).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const listFormsQuerySchema = z.object({
  status: z.enum(FORM_STATUSES).optional(),
  search: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const formIdParamSchema = z.object({
  formId: z.string().uuid(),
});

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

  // Collect all field IDs
  for (const section of sections) {
    for (const field of section.fields) {
      fieldIds.add(field.id);
    }
  }

  // Validate conditional references
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

/**
 * Check if form field type is valid
 */
export function isValidFieldType(type: string): type is FormFieldType {
  return FORM_FIELD_TYPES.includes(type as FormFieldType);
}

/**
 * Check if form status is valid
 */
export function isValidFormStatus(status: string): status is FormStatus {
  return FORM_STATUSES.includes(status as FormStatus);
}
