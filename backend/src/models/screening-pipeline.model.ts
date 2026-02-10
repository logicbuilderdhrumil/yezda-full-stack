/**
 * Screening Pipeline Models
 * Defines pipeline templates, stages, and assignments for multi-step candidate screening.
 */

import { z } from 'zod';

// Re-export shared types for convenience
export type { ModuleType, PipelineGraph } from '../shared-types/pipeline-modules.js';

// ---------------------------------------------------------------------------
// Module Type Enum & Per-Module Config Schemas (Zod)
// ---------------------------------------------------------------------------

/** Valid module types */
export const ModuleTypeEnum = z.enum([
  'form',
  'external_service',
  'internal_processing',
  'human_review',
  'notification',
]);

/** Form module config schema */
export const FormModuleConfigSchema = z.object({
  formDefinitionId: z.string().uuid(),
  formVersion: z.number().int().min(1).optional(),
});

/** Field mapping entry schema */
export const FieldMappingEntrySchema = z.object({
  sourceField: z.string().min(1),
  targetField: z.string().min(1),
});

/** External service module config schema */
export const ExternalServiceModuleConfigSchema = z.object({
  provider: z.string().min(1),
  apiKeyRef: z.string().min(1),
  endpoint: z.string().url(),
  fieldMapping: z.array(FieldMappingEntrySchema),
  webhookUrl: z.string().url().optional(),
  timeout: z.number().int().min(1000).max(300_000), // 1s – 5min
});

/** Internal processing module config schema */
export const InternalProcessingModuleConfigSchema = z.object({
  processor: z.string().min(1),
  inputMapping: z.record(z.string(), z.string()),
  outputMapping: z.record(z.string(), z.string()),
  timeout: z.number().int().min(1000).max(600_000), // 1s – 10min
});

/** Escalation policy schema */
export const EscalationPolicySchema = z.object({
  action: z.enum(['reassign', 'notify_manager', 'auto_approve', 'auto_reject']),
  targetRole: z.string().optional(),
});

/** Human review module config schema */
export const HumanReviewModuleConfigSchema = z.object({
  assigneeRole: z.string().min(1),
  reviewFormId: z.string().uuid().optional(),
  decisionOptions: z.array(z.string().min(1)).min(1),
  timeoutHours: z.number().min(0.5).max(720), // 30 min – 30 days
  escalationPolicy: EscalationPolicySchema,
});

/** Notification module config schema */
export const NotificationModuleConfigSchema = z.object({
  channel: z.enum(['email', 'sms', 'in_app']),
  templateId: z.string().min(1),
  recipientType: z.enum(['candidate', 'assignee', 'manager', 'custom']),
  triggerOn: z.enum([
    'stage_started',
    'stage_completed',
    'stage_failed',
    'assignment_completed',
  ]),
});

/**
 * Discriminated union — picks the correct config schema based on `moduleType`.
 */
export const ModuleConfigSchema = z.discriminatedUnion('moduleType', [
  z.object({ moduleType: z.literal('form'), config: FormModuleConfigSchema }),
  z.object({ moduleType: z.literal('external_service'), config: ExternalServiceModuleConfigSchema }),
  z.object({ moduleType: z.literal('internal_processing'), config: InternalProcessingModuleConfigSchema }),
  z.object({ moduleType: z.literal('human_review'), config: HumanReviewModuleConfigSchema }),
  z.object({ moduleType: z.literal('notification'), config: NotificationModuleConfigSchema }),
]);

// ---------------------------------------------------------------------------
// Pipeline Graph Schema (React Flow layout)
// ---------------------------------------------------------------------------

export const PipelineNodeSchema = z.object({
  id: z.string().min(1),
  type: ModuleTypeEnum,
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.object({
    stageId: z.string(),
    label: z.string(),
    moduleConfig: ModuleConfigSchema,
  }),
});

export const PipelineEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});

export const PipelineGraphSchema = z.object({
  nodes: z.array(PipelineNodeSchema),
  edges: z.array(PipelineEdgeSchema),
  viewport: z
    .object({ x: z.number(), y: z.number(), zoom: z.number() })
    .optional(),
});

// ---------------------------------------------------------------------------
// Pipeline Stage
// ---------------------------------------------------------------------------

/**
 * Pipeline stage - one step in a screening pipeline
 * Now includes moduleType and moduleConfig columns.
 */
export const PipelineStageSchema = z.object({
  id: z.string().uuid(),
  pipelineId: z.string().uuid(),
  formDefinitionId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  order: z.number().int().min(0),
  isRequired: z.boolean().default(true),
  estimatedDurationMinutes: z.number().int().min(0).optional(),
  moduleType: ModuleTypeEnum.default('form'),
  moduleConfig: z.record(z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PipelineStage = z.infer<typeof PipelineStageSchema>;

/**
 * Pipeline status for lifecycle management
 */
export type PipelineStatus = 'draft' | 'active' | 'archived';

/**
 * Screening pipeline - the overall workflow template
 * Now includes an optional `graph` column for the React Flow layout.
 */
export const ScreeningPipelineSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  stages: z.array(PipelineStageSchema),
  graph: PipelineGraphSchema.optional().nullable(),
  status: z.enum(['draft', 'active', 'archived']),
  version: z.number().int().min(1).default(1),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ScreeningPipeline = z.infer<typeof ScreeningPipelineSchema>;

/**
 * Assignment status for tracking pipeline progress
 */
export type AssignmentStatus = 'in_progress' | 'completed' | 'cancelled' | 'on_hold';

/**
 * Stage status for tracking individual stage progress
 */
export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

/**
 * Pipeline assignment - assigning a pipeline to a candidate
 */
export const PipelineAssignmentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  pipelineId: z.string().uuid(),
  candidateId: z.string().uuid(),
  currentStageOrder: z.number().int().min(0).default(0),
  status: z.enum(['in_progress', 'completed', 'cancelled', 'on_hold']),
  stageStatuses: z.record(z.string(), z.enum(['pending', 'in_progress', 'completed', 'skipped'])),
  progressPercentage: z.number().min(0).max(100).default(0),
  assignedBy: z.string().uuid(),
  assignedAt: z.date(),
  completedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PipelineAssignment = z.infer<typeof PipelineAssignmentSchema>;

/**
 * Stage input for creating/updating pipeline stages.
 * Now supports moduleType + moduleConfig alongside legacy formDefinitionId.
 */
export const StageInputSchema = z.object({
  formDefinitionId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  order: z.number().int().min(0),
  isRequired: z.boolean().default(true),
  estimatedDurationMinutes: z.number().int().min(0).optional(),
  moduleType: ModuleTypeEnum.default('form'),
  moduleConfig: z.record(z.unknown()).optional(),
});

export type StageInput = z.infer<typeof StageInputSchema>;

/**
 * Create pipeline DTO — now includes optional graph
 */
export const CreatePipelineDtoSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  stages: z.array(StageInputSchema).min(1, 'At least one stage is required'),
  graph: PipelineGraphSchema.optional().nullable(),
});

export type CreatePipelineDto = z.infer<typeof CreatePipelineDtoSchema>;

/**
 * Update pipeline DTO — now includes optional graph
 */
export const UpdatePipelineDtoSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  stages: z.array(StageInputSchema).min(1).optional(),
  graph: PipelineGraphSchema.optional().nullable(),
}).refine(
  (data) =>
    data.name !== undefined ||
    data.description !== undefined ||
    data.stages !== undefined ||
    data.graph !== undefined,
  { message: 'At least one field must be provided for update' }
);

export type UpdatePipelineDto = z.infer<typeof UpdatePipelineDtoSchema>;

/**
 * Assign pipeline DTO
 */
export const AssignPipelineDtoSchema = z.object({
  candidateId: z.string().uuid(),
});

export type AssignPipelineDto = z.infer<typeof AssignPipelineDtoSchema>;

/**
 * Pipeline operation result
 */
export interface PipelineOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

/**
 * Pipeline context for operations
 */
export interface PipelineContext {
  actorId: string;
  actorType: 'user' | 'candidate' | 'system';
  actorRoles: string[];
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  channel: 'web' | 'mobile' | 'api';
}

/**
 * Assignment progress details
 */
export interface AssignmentProgress {
  assignment: PipelineAssignment;
  pipeline: ScreeningPipeline;
  currentStage: PipelineStage | null;
  completedStages: number;
  totalStages: number;
  progressPercentage: number;
}

/**
 * Audit event types for screening pipelines
 */
export type ScreeningPipelineAuditEventType =
  | 'PIPELINE_CREATED'
  | 'PIPELINE_UPDATED'
  | 'PIPELINE_ACTIVATED'
  | 'PIPELINE_ARCHIVED'
  | 'PIPELINE_DELETED'
  | 'PIPELINE_ASSIGNED'
  | 'PIPELINE_STAGE_COMPLETED'
  | 'PIPELINE_ASSIGNMENT_COMPLETED'
  | 'PIPELINE_ACCESS_DENIED';
