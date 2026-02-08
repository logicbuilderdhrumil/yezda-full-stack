/**
 * Form Builder Domain — barrel export
 */

// Entities & types
export type {
  FormFieldType,
  ValidationRuleType,
  FormStatus,
  ValidationRule,
  SelectOption,
  ConditionalRule,
  FormField,
  FormSection,
  FormSettings,
  FormDefinition,
  FormDefinitionSummary,
  CreateFormDto,
  UpdateFormDto,
  ListFormsQuery,
  ListFormsResponse,
  GetFormResponse,
  FormOperationResult,
  FormContext,
  FormBuilderAuditEventType,
} from './entities/form-builder.entity.js';

export {
  FORM_FIELD_TYPES,
  VALIDATION_RULE_TYPES,
  FORM_STATUSES,
  validateFieldIdUniqueness,
  validateConditionalReferences,
  countFormFields,
} from './entities/form-builder.entity.js';

// Ports
export type { IFormBuilderRepository } from './ports/form-builder-repository.port.js';
export type { IAuditService } from './ports/audit-service.port.js';
export type { IMetricsService } from './ports/metrics-service.port.js';
export type { ICacheService } from './ports/cache-service.port.js';
