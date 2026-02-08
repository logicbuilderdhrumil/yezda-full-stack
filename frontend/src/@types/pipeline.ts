/**
 * Pipeline-related types for screening pipeline management.
 */

// Re-export shared module types used by the pipeline builder
export type {
  ModuleType,
  ModuleConfig,
  ModuleConfigFor,
  FormModuleConfig,
  ExternalServiceModuleConfig,
  InternalProcessingModuleConfig,
  HumanReviewModuleConfig,
  NotificationModuleConfig,
  PipelineGraph,
  PipelineNode,
  PipelineEdge,
  PipelineViewport,
  FieldMappingEntry,
  EscalationPolicy,
  NotificationChannel,
  NotificationRecipientType,
  NotificationTriggerOn,
} from '../../../shared/@types/pipeline-modules';
export { MODULE_TYPES } from '../../../shared/@types/pipeline-modules';

/** Pipeline stage - one step in a screening pipeline */
export interface PipelineStage {
  id: string;
  pipelineId: string;
  formDefinitionId: string;
  name: string;
  description?: string;
  order: number;
  isRequired: boolean;
  estimatedDurationMinutes?: number;
  moduleType?: import('../../../shared/@types/pipeline-modules').ModuleType;
  moduleConfig?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Pipeline status for lifecycle management */
export type PipelineStatus = 'draft' | 'active' | 'archived';

/** Screening pipeline - the overall workflow template */
export interface ScreeningPipeline {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  stages: PipelineStage[];
  graph?: import('../../../shared/@types/pipeline-modules').PipelineGraph | null;
  status: PipelineStatus;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Assignment status for tracking pipeline progress */
export type AssignmentStatus = 'in_progress' | 'completed' | 'cancelled' | 'on_hold';

/** Stage status for tracking individual stage progress */
export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

/** Pipeline assignment - assigning a pipeline to a candidate */
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
  assignedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Stage input for creating/updating pipeline stages */
export interface CreatePipelineStageDto {
  formDefinitionId: string;
  name: string;
  description?: string;
  order: number;
  isRequired?: boolean;
  estimatedDurationMinutes?: number;
}

/** Create pipeline DTO */
export interface CreatePipelineDto {
  name: string;
  description?: string;
  stages: CreatePipelineStageDto[];
  graph?: import('../../../shared/@types/pipeline-modules').PipelineGraph;
}

/** Update pipeline DTO */
export type UpdatePipelineDto = Partial<CreatePipelineDto>;

/** Assignment progress details */
export interface AssignmentProgress {
  assignment: PipelineAssignment;
  pipeline: ScreeningPipeline;
  currentStage: PipelineStage | null;
  completedStages: number;
  totalStages: number;
  progressPercentage: number;
}

/** Filter parameters for listing pipelines */
export interface PipelineListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PipelineStatus;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/** Paginated list response for pipelines */
export interface PipelineListResponse {
  data: ScreeningPipeline[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

/** Table column definition for pipelines */
export interface PipelineColumn {
  key: keyof ScreeningPipeline | 'stagesCount' | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
}

/** Default columns for the pipelines list */
export const PIPELINE_COLUMNS: PipelineColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'stagesCount', label: 'Stages', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'createdAt', label: 'Created', sortable: true },
  { key: 'actions', label: '', sortable: false, width: '150px' },
];
