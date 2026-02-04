/**
 * Job Controller
 * API endpoint handlers for job status operations.
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { jobService } from '../services/job.service.js';

/**
 * Get tenant ID from request.
 */
function getTenantId(req: AuthenticatedRequest): string | undefined {
  return (req.headers['x-tenant-id'] as string) || (req as any).tenantId;
}

/**
 * GET /api/v1/jobs
 * List jobs for the current user/tenant.
 */
export async function listJobs(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID required', code: 'TENANT_REQUIRED' });
    return;
  }

  const status = req.query.status as string | undefined;
  const type = req.query.type as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
  const offset = parseInt(req.query.offset as string, 10) || 0;

  const result = await jobService.listJobs({
    tenantId,
    userId: req.user.sub,
    status: status as any,
    type,
    limit,
    offset,
  });

  res.status(200).json({
    jobs: result.jobs.map(formatJob),
    meta: {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    },
  });
}

/**
 * GET /api/v1/jobs/:jobId
 * Get job status.
 */
export async function getJobStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID required', code: 'TENANT_REQUIRED' });
    return;
  }

  const { jobId } = req.params;

  const job = await jobService.getJob(jobId, tenantId, req.user.sub);

  if (!job) {
    res.status(404).json({ error: 'Job not found', code: 'JOB_NOT_FOUND' });
    return;
  }

  res.status(200).json(formatJob(job));
}

/**
 * POST /api/v1/jobs/:jobId/cancel
 * Cancel a running job.
 */
export async function cancelJob(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID required', code: 'TENANT_REQUIRED' });
    return;
  }

  const { jobId } = req.params;

  const result = await jobService.cancelJob(jobId, tenantId, req.user.sub);

  if (!result.success) {
    const statusCode = result.errorCode === 'JOB_NOT_FOUND' ? 404
      : result.errorCode === 'JOB_NOT_CANCELLABLE' ? 400
      : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json({ message: 'Job cancelled successfully' });
}

/**
 * Format job for API response.
 */
function formatJob(job: any): Record<string, unknown> {
  return {
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt?.toISOString(),
    startedAt: job.startedAt?.toISOString(),
    completedAt: job.completedAt?.toISOString(),
    estimatedCompletionAt: job.estimatedCompletionAt?.toISOString(),
  };
}
