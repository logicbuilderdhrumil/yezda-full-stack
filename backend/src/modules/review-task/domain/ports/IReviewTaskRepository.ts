/**
 * Review Task repository port.
 */
import type { ReviewTask, ReviewTaskStatus } from '../entities/review-task.entity.js';

export interface ReviewTaskFilter {
  status?: ReviewTaskStatus;
  assigneeRole?: string;
  assigneeId?: string;
}

export interface IReviewTaskRepository {
  findAll(tenantId: string, filter: ReviewTaskFilter): Promise<ReviewTask[]>;
  findByAssignee(tenantId: string, assigneeId: string): Promise<ReviewTask[]>;
  findById(tenantId: string, id: string): Promise<ReviewTask | null>;
  create(task: ReviewTask): Promise<ReviewTask>;
  update(id: string, data: Partial<ReviewTask>): Promise<ReviewTask | null>;
}
