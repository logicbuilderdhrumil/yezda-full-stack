/**
 * In-memory job repository.
 */
import type { Job } from '../../domain/entities/job.entity.js';
import type { IJobRepository, JobListOptions, JobListResult } from '../../domain/ports/IJobRepository.js';

export class InMemoryJobRepository implements IJobRepository {
  private jobs: Job[] = [];

  async findAll(opts: JobListOptions): Promise<JobListResult> {
    let result = this.jobs.filter((j) => j.tenantId === opts.tenantId);
    if (opts.userId) result = result.filter((j) => j.userId === opts.userId);
    if (opts.status) result = result.filter((j) => j.status === opts.status);
    if (opts.type) result = result.filter((j) => j.type === opts.type);
    const total = result.length;
    const limit = opts.limit ?? 20;
    const offset = opts.offset ?? 0;
    return { jobs: result.slice(offset, offset + limit), total, limit, offset };
  }

  async findById(tenantId: string, jobId: string): Promise<Job | null> {
    return this.jobs.find((j) => j.id === jobId && j.tenantId === tenantId) ?? null;
  }

  async cancel(tenantId: string, jobId: string): Promise<Job | null> {
    const idx = this.jobs.findIndex((j) => j.id === jobId && j.tenantId === tenantId);
    if (idx === -1) return null;
    this.jobs[idx] = { ...this.jobs[idx], status: 'cancelled', completedAt: new Date() };
    return this.jobs[idx];
  }
}
