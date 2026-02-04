/**
 * Job Service
 * Integration layer for async job status tracking and management.
 */

import { ApiService } from './ApiService';
import type {
  JobStatusDTO,
  JobListResponseDTO,
  JobStatus,
  ResponseMeta,
} from '@/@types/contracts';

/** Options for job polling. */
export interface PollOptions {
  /** Polling interval in milliseconds (default: 2000). */
  interval?: number;
  /** Maximum polling duration in milliseconds (default: 300000 = 5 minutes). */
  timeout?: number;
  /** Callback for progress updates. */
  onProgress?: (job: JobStatusDTO) => void;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
}

/** Job list options. */
export interface JobListOptions {
  status?: JobStatus;
  limit?: number;
  offset?: number;
}

/**
 * JobService provides methods for tracking async job status.
 */
export const JobService = {
  /**
   * Gets the status of a job.
   */
  async getStatus(jobId: string): Promise<JobStatusDTO> {
    const response = await ApiService.get<JobStatusDTO>('jobs.status', {
      pathParams: { jobId },
    });
    return response.data;
  },

  /**
   * Lists jobs with optional filtering.
   */
  async list(options?: JobListOptions): Promise<{
    jobs: JobStatusDTO[];
    meta: ResponseMeta;
  }> {
    const response = await ApiService.get<JobListResponseDTO>('jobs.list', {
      params: options,
    });
    return response.data;
  },

  /**
   * Cancels a running job.
   */
  async cancel(jobId: string): Promise<void> {
    await ApiService.post<void>('jobs.cancel', undefined, {
      pathParams: { jobId },
    });
  },

  /**
   * Polls for job completion.
   * Returns when job completes, fails, or is cancelled.
   */
  async pollUntilComplete(
    jobId: string,
    options?: PollOptions
  ): Promise<JobStatusDTO> {
    const interval = options?.interval ?? 2000;
    const timeout = options?.timeout ?? 300000;
    const startTime = Date.now();

    const terminalStatuses: JobStatus[] = ['completed', 'failed', 'cancelled'];

    return new Promise((resolve, reject) => {
      const poll = async (): Promise<void> => {
        // Check for abort signal
        if (options?.signal?.aborted) {
          reject(new Error('Polling aborted'));
          return;
        }

        // Check for timeout
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Job polling timed out after ${timeout}ms`));
          return;
        }

        try {
          const job = await this.getStatus(jobId);

          // Notify progress
          options?.onProgress?.(job);

          if (terminalStatuses.includes(job.status)) {
            if (job.status === 'failed') {
              reject(new Error(job.error ?? 'Job failed'));
            } else {
              resolve(job);
            }
            return;
          }

          // Schedule next poll
          setTimeout(poll, interval);
        } catch (error) {
          reject(error);
        }
      };

      // Start polling
      poll();
    });
  },

  /**
   * Creates an observable-like job tracker with event callbacks.
   */
  createTracker(
    jobId: string,
    options?: PollOptions
  ): {
    promise: Promise<JobStatusDTO>;
    cancel: () => void;
  } {
    const abortController = new AbortController();

    const promise = this.pollUntilComplete(jobId, {
      ...options,
      signal: abortController.signal,
    });

    return {
      promise,
      cancel: () => abortController.abort(),
    };
  },
};
