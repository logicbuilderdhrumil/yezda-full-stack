/**
 * Job Service
 * Business logic for async job management.
 */

import { randomUUID } from 'crypto';
import type {
  Job,
  JobStatus,
  JobProgress,
  JobListOptions,
  JobListResult,
} from '../models/job.model.js';

/**
 * In-memory job store for development.
 * In production, this would be backed by a database or Redis.
 */
const jobStore = new Map<string, Job>();

/**
 * Cancel result.
 */
interface CancelResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

/**
 * Job service provides methods for job management.
 */
export const jobService = {
  /**
   * Creates a new job.
   */
  createJob(params: {
    tenantId: string;
    userId: string;
    type: string;
    metadata?: Record<string, unknown>;
  }): Job {
    const job: Job = {
      id: randomUUID(),
      tenantId: params.tenantId,
      userId: params.userId,
      type: params.type,
      status: 'pending',
      metadata: params.metadata,
      createdAt: new Date(),
    };

    jobStore.set(job.id, job);
    return job;
  },

  /**
   * Gets a job by ID.
   */
  async getJob(
    jobId: string,
    tenantId: string,
    userId: string
  ): Promise<Job | null> {
    const job = jobStore.get(jobId);
    if (!job) return null;
    if (job.tenantId !== tenantId) return null;
    // Allow access if user owns the job or is an admin
    if (job.userId !== userId) return null;
    return job;
  },

  /**
   * Lists jobs with filtering.
   */
  async listJobs(options: JobListOptions): Promise<JobListResult> {
    const jobs = Array.from(jobStore.values())
      .filter((job) => job.tenantId === options.tenantId)
      .filter((job) => !options.userId || job.userId === options.userId)
      .filter((job) => !options.status || job.status === options.status)
      .filter((job) => !options.type || job.type === options.type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = jobs.length;
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const paged = jobs.slice(offset, offset + limit);

    return { jobs: paged, total, limit, offset };
  },

  /**
   * Updates job status.
   */
  updateJobStatus(
    jobId: string,
    status: JobStatus,
    details?: {
      progress?: JobProgress;
      result?: unknown;
      error?: string;
    }
  ): Job | null {
    const job = jobStore.get(jobId);
    if (!job) return null;

    job.status = status;

    if (details?.progress) {
      job.progress = details.progress;
    }

    if (status === 'running' && !job.startedAt) {
      job.startedAt = new Date();
    }

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      job.completedAt = new Date();
      if (details?.result) job.result = details.result;
      if (details?.error) job.error = details.error;
    }

    jobStore.set(jobId, job);
    return job;
  },

  /**
   * Cancels a running job.
   */
  async cancelJob(
    jobId: string,
    tenantId: string,
    userId: string
  ): Promise<CancelResult> {
    const job = await this.getJob(jobId, tenantId, userId);

    if (!job) {
      return { success: false, error: 'Job not found', errorCode: 'JOB_NOT_FOUND' };
    }

    if (job.status !== 'pending' && job.status !== 'running') {
      return {
        success: false,
        error: 'Job cannot be cancelled in current state',
        errorCode: 'JOB_NOT_CANCELLABLE',
      };
    }

    this.updateJobStatus(jobId, 'cancelled');
    return { success: true };
  },

  /**
   * Cleans up old completed jobs.
   */
  cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAgeMs;
    let cleaned = 0;

    for (const [id, job] of jobStore) {
      if (
        (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
        job.completedAt &&
        job.completedAt.getTime() < cutoff
      ) {
        jobStore.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  },
};
