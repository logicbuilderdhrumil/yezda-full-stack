/**
 * Job Status Model
 * Shared types for async job tracking across all product features.
 */

import { z } from 'zod';

/**
 * Job status enum.
 */
export const JOB_STATUSES = ['pending', 'running', 'completed', 'failed', 'cancelled'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/**
 * Job progress information.
 */
export interface JobProgress {
  current: number;
  total: number;
  percentage: number;
  message?: string;
}

/**
 * Job entity.
 */
export interface Job {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  status: JobStatus;
  progress?: JobProgress;
  result?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletionAt?: Date;
}

/**
 * Job list query options.
 */
export interface JobListOptions {
  tenantId: string;
  userId?: string;
  status?: JobStatus;
  type?: string;
  limit?: number;
  offset?: number;
}

/**
 * Job list result.
 */
export interface JobListResult {
  jobs: Job[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Job validation schemas.
 */
export const jobStatusQuerySchema = z.object({
  status: z.enum(JOB_STATUSES).optional(),
  type: z.string().optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional(),
});

/**
 * Job event types for audit.
 */
export type JobAuditEventType =
  | 'JOB_CREATED'
  | 'JOB_STARTED'
  | 'JOB_PROGRESS'
  | 'JOB_COMPLETED'
  | 'JOB_FAILED'
  | 'JOB_CANCELLED';

/**
 * Job SLO targets.
 */
export const JOB_SLOS = {
  startLatencyP95Ms: 5000,
  progressUpdateIntervalMs: 10000,
  completionTimeoutMs: 300000,
} as const;

/**
 * Job metrics names.
 */
export const JOB_METRICS = {
  created: 'job_created_total',
  started: 'job_started_total',
  completed: 'job_completed_total',
  failed: 'job_failed_total',
  cancelled: 'job_cancelled_total',
  duration: 'job_duration_ms',
  queueTime: 'job_queue_time_ms',
} as const;
