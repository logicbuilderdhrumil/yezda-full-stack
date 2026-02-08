/**
 * Pipeline-related types for screening pipeline management.
 */

/** Module type for pipeline stages */
export type ModuleType =
  | 'form'
  | 'external_service'
  | 'internal_processing'
  | 'human_review'
  | 'notification';

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
  moduleType?: ModuleType;
  moduleConfig?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Pipeline status for lifecycle management */
export type PipelineStatus = 'draft' | 'active' | 'archived';

/** Serialized pipeline graph (React Flow state) */
export interface PipelineGraphData {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | undefined;
    targetHandle?: string | undefined;
  }>;
  viewport?: { x: number; y: number; zoom: number };
}

/** Screening pipeline - the overall workflow template */
export interface ScreeningPipeline {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  stages: PipelineStage[];
  status: PipelineStatus;
  version: number;
  graph?: PipelineGraphData;
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
  estimatedDurationMinutes?: number | undefined;
  moduleType?: ModuleType;
  moduleConfig?: Record<string, unknown>;
}

/** Create pipeline DTO */
export interface CreatePipelineDto {
  name: string;
  description?: string;
  stages: CreatePipelineStageDto[];
  graph?: PipelineGraphData;
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
