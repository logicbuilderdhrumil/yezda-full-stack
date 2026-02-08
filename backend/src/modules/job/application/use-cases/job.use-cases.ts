/**
 * Job use cases.
 */
import type { IJobRepository, Job, JobListOptions, JobListResult } from '../../domain/index.js';

export class ListJobs {
  constructor(private repo: IJobRepository) {}
  async execute(opts: JobListOptions): Promise<JobListResult> {
    return this.repo.findAll(opts);
  }
}

export class GetJobStatus {
  constructor(private repo: IJobRepository) {}
  async execute(tenantId: string, jobId: string): Promise<Job | null> {
    return this.repo.findById(tenantId, jobId);
  }
}

export class CancelJob {
  constructor(private repo: IJobRepository) {}
  async execute(tenantId: string, jobId: string): Promise<Job | null> {
    return this.repo.cancel(tenantId, jobId);
  }
}
