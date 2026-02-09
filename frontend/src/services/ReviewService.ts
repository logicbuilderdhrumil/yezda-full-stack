/**
 * ReviewService — API client for human review task endpoints.
 */
import { ApiService } from './ApiService';

export interface ReviewTask {
  id: string;
  tenantId: string;
  pipelineId: string;
  assignmentId: string;
  stageId: string;
  candidateId: string;
  assigneeId: string | null;
  assigneeRole: string;
  status: 'pending' | 'assigned' | 'in_review' | 'decided' | 'escalated' | 'expired';
  decision: string | null;
  decisionNotes: string | null;
  reviewFormId: string | null;
  reviewFormData: Record<string, unknown> | null;
  decisionOptions: string[];
  timeoutHours: number;
  escalationPolicy: { action: string; targetRole?: string };
  dueAt: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDecisionDto {
  decision: string;
  decisionNotes?: string;
  reviewFormData?: Record<string, unknown>;
}

export const ReviewService = {
  /**
   * List all review tasks (with optional status filter)
   */
  async list(status?: string): Promise<ReviewTask[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    const response = await ApiService.get<ReviewTask[]>('reviews.list', { params });
    return response.data ?? [];
  },

  /**
   * Get my review queue (tasks assigned to my role)
   */
  async getMyQueue(): Promise<ReviewTask[]> {
    const response = await ApiService.get<ReviewTask[]>('reviews.myQueue');
    return response.data ?? [];
  },

  /**
   * Get a single review task by ID
   */
  async getById(id: string): Promise<ReviewTask> {
    const response = await ApiService.get<ReviewTask>('reviews.detail', {
      pathParams: { id },
    });
    return response.data;
  },

  /**
   * Submit a decision for a review task
   */
  async submitDecision(id: string, dto: ReviewDecisionDto): Promise<ReviewTask> {
    const response = await ApiService.post<ReviewTask, ReviewDecisionDto>(
      'reviews.decide',
      dto,
      { pathParams: { id } }
    );
    return response.data;
  },

  /**
   * Assign a review task to a user
   */
  async assign(id: string, assigneeId: string): Promise<ReviewTask> {
    const response = await ApiService.patch<ReviewTask>(
      'reviews.assign',
      { assigneeId },
      { pathParams: { id } }
    );
    return response.data;
  },
};
