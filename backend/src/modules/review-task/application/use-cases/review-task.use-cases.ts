/**
 * Review Task use cases.
 */
import { v4 as uuid } from 'uuid';
import type { IReviewTaskRepository, ReviewTaskFilter, ReviewTask } from '../../domain/index.js';

export interface CreateReviewTaskDto {
  pipelineId: string;
  assignmentId: string;
  stageId: string;
  candidateId: string;
  assigneeId?: string | null;
  assigneeRole: string;
  reviewFormId?: string | null;
  decisionOptions: string[];
  timeoutHours?: number;
  escalationPolicy: { action: string; targetRole?: string };
}

export interface ReviewDecisionDto {
  decision: 'approved' | 'rejected' | 'more_info_needed' | 'escalated';
  decisionNotes?: string;
  reviewFormData?: Record<string, unknown>;
}

export class ListReviewTasks {
  constructor(private repo: IReviewTaskRepository) {}

  async execute(tenantId: string, filter: ReviewTaskFilter): Promise<ReviewTask[]> {
    return this.repo.findAll(tenantId, filter);
  }
}

export class GetMyQueue {
  constructor(private repo: IReviewTaskRepository) {}

  async execute(tenantId: string, assigneeId: string): Promise<ReviewTask[]> {
    return this.repo.findByAssignee(tenantId, assigneeId);
  }
}

export class GetReviewTask {
  constructor(private repo: IReviewTaskRepository) {}

  async execute(tenantId: string, id: string): Promise<ReviewTask | null> {
    return this.repo.findById(tenantId, id);
  }
}

export class CreateReviewTask {
  constructor(private repo: IReviewTaskRepository) {}

  async execute(tenantId: string, dto: CreateReviewTaskDto): Promise<ReviewTask> {
    const now = new Date();
    const task: ReviewTask = {
      id: uuid(),
      tenantId,
      pipelineId: dto.pipelineId,
      assignmentId: dto.assignmentId,
      stageId: dto.stageId,
      candidateId: dto.candidateId,
      assigneeId: dto.assigneeId ?? null,
      assigneeRole: dto.assigneeRole,
      status: dto.assigneeId ? 'assigned' : 'pending',
      decision: null,
      decisionNotes: null,
      reviewFormId: dto.reviewFormId ?? null,
      reviewFormData: null,
      decisionOptions: dto.decisionOptions,
      timeoutHours: dto.timeoutHours ?? 24,
      escalationPolicy: dto.escalationPolicy,
      dueAt: new Date(now.getTime() + (dto.timeoutHours ?? 24) * 3600000),
      decidedAt: null,
      decidedBy: null,
      createdAt: now,
      updatedAt: now,
    };
    return this.repo.create(task);
  }
}

export class AssignReviewTask {
  constructor(private repo: IReviewTaskRepository) {}

  async execute(tenantId: string, taskId: string, assigneeId: string): Promise<ReviewTask | null> {
    const task = await this.repo.findById(tenantId, taskId);
    if (!task) return null;
    return this.repo.update(taskId, {
      assigneeId,
      status: 'assigned',
      updatedAt: new Date(),
    });
  }
}

export class SubmitDecision {
  constructor(private repo: IReviewTaskRepository) {}

  async execute(
    tenantId: string,
    taskId: string,
    userId: string,
    dto: ReviewDecisionDto,
  ): Promise<ReviewTask | null> {
    const task = await this.repo.findById(tenantId, taskId);
    if (!task) return null;
    const now = new Date();
    return this.repo.update(taskId, {
      decision: dto.decision,
      decisionNotes: dto.decisionNotes ?? null,
      reviewFormData: dto.reviewFormData ?? null,
      status: 'decided',
      decidedAt: now,
      decidedBy: userId,
      updatedAt: now,
    });
  }
}
