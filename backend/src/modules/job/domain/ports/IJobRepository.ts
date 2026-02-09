import type { Job, JobStatus } from '../entities/job.entity.js';

export interface JobListOptions {
  tenantId: string;
  userId?: string;
  status?: JobStatus;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface JobListResult {
  jobs: Job[];
  total: number;
  limit: number;
  offset: number;
}

export interface IJobRepository {
  findAll(opts: JobListOptions): Promise<JobListResult>;
  findById(tenantId: string, jobId: string): Promise<Job | null>;
  cancel(tenantId: string, jobId: string): Promise<Job | null>;
}
