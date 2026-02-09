/**
 * Pipeline service for API interactions.
 */
import { ApiService } from '@/services/ApiService';
import type {
  ScreeningPipeline,
  PipelineAssignment,
  AssignmentProgress,
  CreatePipelineDto,
  UpdatePipelineDto,
  PipelineListParams,
  PipelineListResponse,
} from '@/@types/pipeline';

/**
 * PipelineService provides methods for screening pipeline CRUD operations.
 */
export const PipelineService = {
  /**
   * Fetches a paginated list of pipelines.
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of pipelines
   */
  async list(params?: PipelineListParams): Promise<PipelineListResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.page !== undefined) queryParams.page = String(params.page);
    if (params?.pageSize !== undefined) queryParams.pageSize = String(params.pageSize);
    if (params?.search) queryParams.search = params.search;
    if (params?.status) queryParams.status = params.status;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;

    const response = await ApiService.get<PipelineListResponse>('screening-pipelines.list', {
      params: queryParams,
    });

    // Normalize backend response to expected frontend shape
    const raw = response.data as unknown as Record<string, unknown>;
    if (raw && Array.isArray(raw.pipelines) && !Array.isArray(raw.data)) {
      return {
        data: raw.pipelines as ScreeningPipeline[],
        meta: {
          page: (raw.page as number) || 1,
          pageSize: (raw.limit as number) || (params?.pageSize ?? 10),
          totalItems: (raw.total as number) || 0,
          totalPages: (raw.totalPages as number) || 1,
        },
      };
    }

    return response.data;
  },

  /**
   * Fetches a single pipeline by ID.
   * @param id - Pipeline ID
   * @returns Pipeline details
   */
  async getById(id: string): Promise<ScreeningPipeline> {
    const response = await ApiService.get<ScreeningPipeline>('screening-pipelines.detail', {
      pathParams: { id },
    });
    return response.data;
  },

  /**
   * Creates a new pipeline.
   * @param payload - Pipeline data
   * @returns Created pipeline
   */
  async create(payload: CreatePipelineDto): Promise<ScreeningPipeline> {
    const response = await ApiService.post<ScreeningPipeline, CreatePipelineDto>(
      'screening-pipelines.list',
      payload
    );
    return response.data;
  },

  /**
   * Updates an existing pipeline.
   * @param id - Pipeline ID
   * @param payload - Updated pipeline data
   * @returns Updated pipeline
   */
  async update(id: string, payload: UpdatePipelineDto): Promise<ScreeningPipeline> {
    const response = await ApiService.put<ScreeningPipeline, UpdatePipelineDto>(
      'screening-pipelines.detail',
      payload,
      { pathParams: { id } }
    );
    return response.data;
  },

  /**
   * Activates a draft pipeline.
   * @param id - Pipeline ID
   * @returns Activated pipeline
   */
  async activate(id: string): Promise<ScreeningPipeline> {
    const response = await ApiService.patch<ScreeningPipeline>(
      'screening-pipelines.activate',
      undefined,
      { pathParams: { id } }
    );
    return response.data;
  },

  /**
   * Archives an active pipeline.
   * @param id - Pipeline ID
   * @returns Archived pipeline
   */
  async archive(id: string): Promise<ScreeningPipeline> {
    const response = await ApiService.patch<ScreeningPipeline>(
      'screening-pipelines.archive',
      undefined,
      { pathParams: { id } }
    );
    return response.data;
  },

  /**
   * Deletes a draft pipeline.
   * @param id - Pipeline ID
   */
  async delete(id: string): Promise<void> {
    await ApiService.delete('screening-pipelines.detail', {
      pathParams: { id },
    });
  },

  /**
   * Assigns a pipeline to a candidate.
   * @param pipelineId - Pipeline ID
   * @param candidateId - Candidate ID
   * @returns Created assignment
   */
  async assign(pipelineId: string, candidateId: string): Promise<PipelineAssignment> {
    const response = await ApiService.post<PipelineAssignment, { candidateId: string }>(
      'screening-pipelines.assign',
      { candidateId },
      { pathParams: { id: pipelineId } }
    );
    return response.data;
  },

  /**
   * Gets assignment progress details.
   * @param assignmentId - Assignment ID
   * @returns Assignment progress
   */
  async getAssignmentProgress(assignmentId: string): Promise<AssignmentProgress> {
    const response = await ApiService.get<AssignmentProgress>(
      'screening-pipelines.assignmentProgress',
      { pathParams: { id: assignmentId } }
    );
    return response.data;
  },

  /**
   * Lists all pipeline assignments for a candidate.
   * @param candidateId - Candidate ID
   * @returns List of assignments
   */
  async getCandidateAssignments(candidateId: string): Promise<PipelineAssignment[]> {
    const response = await ApiService.get<PipelineAssignment[]>(
      'screening-pipelines.candidateAssignments',
      { pathParams: { candidateId } }
    );
    return response.data;
  },

  /**
   * Marks a stage as completed.
   * @param assignmentId - Assignment ID
   * @param stageId - Stage ID
   * @returns Updated assignment
   */
  async completeStage(assignmentId: string, stageId: string): Promise<PipelineAssignment> {
    const response = await ApiService.patch<PipelineAssignment>(
      'screening-pipelines.completeStage',
      undefined,
      { pathParams: { assignmentId, stageId } }
    );
    return response.data;
  },
};
