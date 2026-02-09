/**
 * Form Builder Validators
 *
 * Zod schemas for form builder request validation.
 * Extracted from legacy model into interface layer.
 */
import { z } from 'zod';
import { FORM_FIELD_TYPES, VALIDATION_RULE_TYPES, FORM_STATUSES } from '../../domain/index.js';

const validationRuleSchema = z.object({
  type: z.enum(VALIDATION_RULE_TYPES),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  message: z.string().max(500).optional(),
});

const selectOptionSchema = z.object({
  label: z.string().min(1).max(200),
  value: z.string().min(1).max(200),
  disabled: z.boolean().optional(),
});

const conditionalRuleSchema = z.object({
  fieldId: z.string().min(1).max(100),
  operator: z.enum(['equals', 'notEquals', 'contains', 'notContains', 'empty', 'notEmpty']),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

const formFieldSchema = z.object({
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

const formSectionSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  fields: z.array(formFieldSchema),
  order: z.number().int().min(0),
  conditionalVisibility: conditionalRuleSchema.optional(),
});

const formSettingsSchema = z.object({
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
