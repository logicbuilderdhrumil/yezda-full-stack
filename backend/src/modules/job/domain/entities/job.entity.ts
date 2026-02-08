/**
 * Job domain entity.
 */
export const JOB_STATUSES = ['pending', 'running', 'completed', 'failed', 'cancelled'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export interface JobProgress {
  current: number;
  total: number;
  percentage: number;
  message?: string;
}

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
