/**
 * Screening Pipeline Domain Entities
 * Core domain types for screening pipeline management.
 */

import type { ModuleType, PipelineGraph } from '../../../../../../shared/@types/pipeline-modules.js';

// Re-export for convenience within the module
export type { ModuleType, PipelineGraph };

export type PipelineStatus = 'draft' | 'active' | 'archived';
export type AssignmentStatus = 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface PipelineStage {
  id: string;
  pipelineId: string;
  formDefinitionId: string;
  name: string;
  description?: string;
  order: number;
  isRequired: boolean;
  estimatedDurationMinutes?: number;
  moduleType: ModuleType;
  moduleConfig: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScreeningPipeline {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  stages: PipelineStage[];
  graph?: PipelineGraph | null;
  status: PipelineStatus;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineAssignment {
  id: string;
  tenantId: string;
  pipelineId: string;
  candidateId: string;
  currentStageOrder: number;
  status: AssignmentStatus;
  stageStatuses: Record<string, StageStatus>;
  progressPercentage: number;
  assignedBy: string;
  assignedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StageInput {
  formDefinitionId: string;
  name: string;
  description?: string;
  order: number;
  isRequired?: boolean;
  estimatedDurationMinutes?: number;
  moduleType?: ModuleType;
  moduleConfig?: Record<string, unknown>;
}

export interface CreatePipelineDto {
  name: string;
  description?: string;
  stages: StageInput[];
  graph?: PipelineGraph | null;
}

export interface UpdatePipelineDto {
  name?: string;
  description?: string;
  stages?: StageInput[];
  graph?: PipelineGraph | null;
}

export interface AssignPipelineDto {
  candidateId: string;
}

export interface PipelineOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export interface PipelineContext {
  actorId: string;
  actorType: 'user' | 'candidate' | 'system';
  actorRoles: string[];
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  channel: 'web' | 'mobile' | 'api';
}

export interface AssignmentProgress {
  assignment: PipelineAssignment;
  pipeline: ScreeningPipeline;
  currentStage: PipelineStage | null;
  completedStages: number;
  totalStages: number;
  progressPercentage: number;
}

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
