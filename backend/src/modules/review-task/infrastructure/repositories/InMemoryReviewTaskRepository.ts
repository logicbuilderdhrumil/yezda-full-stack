/**
 * In-memory review task repository.
 */
import type { ReviewTask } from '../../domain/entities/review-task.entity.js';
import type { IReviewTaskRepository, ReviewTaskFilter } from '../../domain/ports/IReviewTaskRepository.js';

export class InMemoryReviewTaskRepository implements IReviewTaskRepository {
  private tasks: ReviewTask[] = [];

  async findAll(tenantId: string, filter: ReviewTaskFilter): Promise<ReviewTask[]> {
    return this.tasks.filter((t) => {
      if (t.tenantId !== tenantId) return false;
      if (filter.status && t.status !== filter.status) return false;
      if (filter.assigneeRole && t.assigneeRole !== filter.assigneeRole) return false;
      if (filter.assigneeId && t.assigneeId !== filter.assigneeId) return false;
      return true;
    });
  }

  async findByAssignee(tenantId: string, assigneeId: string): Promise<ReviewTask[]> {
    return this.tasks.filter(
      (t) =>
        t.tenantId === tenantId &&
        t.assigneeId === assigneeId &&
        !['decided', 'expired'].includes(t.status),
    );
  }

  async findById(tenantId: string, id: string): Promise<ReviewTask | null> {
    return this.tasks.find((t) => t.id === id && t.tenantId === tenantId) ?? null;
  }

  async create(task: ReviewTask): Promise<ReviewTask> {
    this.tasks.push(task);
    return task;
  }

  async update(id: string, data: Partial<ReviewTask>): Promise<ReviewTask | null> {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.tasks[idx] = { ...this.tasks[idx], ...data };
    return this.tasks[idx];
  }
}
