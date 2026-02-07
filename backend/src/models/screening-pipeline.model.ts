/**
 * Screening Pipeline Models
 * Defines pipeline templates, stages, and assignments for multi-step candidate screening.
 */

import { z } from 'zod';

/**
 * Pipeline stage - one step in a screening pipeline
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
 */
export const ScreeningPipelineSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  stages: z.array(PipelineStageSchema),
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
 * Stage input for creating/updating pipeline stages
 */
export const StageInputSchema = z.object({
  formDefinitionId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  order: z.number().int().min(0),
  isRequired: z.boolean().default(true),
  estimatedDurationMinutes: z.number().int().min(0).optional(),
});

export type StageInput = z.infer<typeof StageInputSchema>;

/**
 * Create pipeline DTO
 */
export const CreatePipelineDtoSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  stages: z.array(StageInputSchema).min(1, 'At least one stage is required'),
});

export type CreatePipelineDto = z.infer<typeof CreatePipelineDtoSchema>;

/**
 * Update pipeline DTO
 */
export const UpdatePipelineDtoSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  stages: z.array(StageInputSchema).min(1).optional(),
}).refine(
  (data) => data.name !== undefined || data.description !== undefined || data.stages !== undefined,
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
