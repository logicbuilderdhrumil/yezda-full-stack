/**
 * Review Task Controller
 * HTTP handlers for human review task endpoints.
 */

import type { Response } from 'express';
import { reviewTaskService } from '../services/review-task.service.js';
import { getClientIp } from '../utils/ip.util.js';
import type { AuthenticatedRoleRequest } from '../middleware/route-guards.middleware.js';
import type { PipelineContext } from '../models/screening-pipeline.model.js';

// ---------------------------------------------------------------------------
// Context helper
// ---------------------------------------------------------------------------

function getContext(req: AuthenticatedRoleRequest): PipelineContext {
  return {
    actorId: req.user?.sub || '',
    actorType: (req.user?.type || 'user') as 'user' | 'candidate',
    actorRoles: (req.user?.roles || []) as string[],
    tenantId:
      req.user?.tenantId || (req.headers['x-tenant-id'] as string) || 'default',
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
    channel: 'api' as const,
  };
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/reviews
 * List review tasks with optional query-param filters.
 */
export async function listReviewTasks(
  req: AuthenticatedRoleRequest,
  res: Response,
): Promise<void> {
  const ctx = getContext(req);

  const filters: {
    status?: 'pending' | 'assigned' | 'in_review' | 'decided' | 'escalated' | 'expired';
    assigneeRole?: string;
    assigneeId?: string;
  } = {
    status: req.query.status as
      | 'pending'
      | 'assigned'
      | 'in_review'
      | 'decided'
      | 'escalated'
      | 'expired'
      | undefined,
    assigneeRole: req.query.assigneeRole as string | undefined,
    assigneeId: req.query.assigneeId as string | undefined,
  };

  const result = await reviewTaskService.listReviewTasks(filters, ctx);

  if (!result.success) {
    const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/reviews/my-queue
 * Get the tasks assigned to or available for the current user.
 */
export async function getMyQueue(
  req: AuthenticatedRoleRequest,
  res: Response,
): Promise<void> {
  const ctx = getContext(req);

  const result = await reviewTaskService.getMyReviewQueue(ctx);

  if (!result.success) {
    const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/reviews/:id
 * Get a single review task.
 */
export async function getReviewTask(
  req: AuthenticatedRoleRequest,
  res: Response,
): Promise<void> {
  const ctx = getContext(req);
  const { id } = req.params;

  const result = await reviewTaskService.getReviewTask(id, ctx);

  if (!result.success) {
    const statusCode =
      result.errorCode === 'FORBIDDEN'
        ? 403
        : result.errorCode === 'NOT_FOUND'
          ? 404
          : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * POST /api/v1/reviews
 * Create a new review task.
 */
export async function createReviewTask(
  req: AuthenticatedRoleRequest,
  res: Response,
): Promise<void> {
  const ctx = getContext(req);

  const result = await reviewTaskService.createReviewTask(req.body, ctx);

  if (!result.success) {
    const statusCode =
      result.errorCode === 'FORBIDDEN'
        ? 403
        : result.errorCode === 'VALIDATION_ERROR'
          ? 400
          : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(201).json(result.data);
}

/**
 * PATCH /api/v1/reviews/:id/assign
 * Assign or reassign a review task to a user.
 */
export async function assignReviewTask(
  req: AuthenticatedRoleRequest,
  res: Response,
): Promise<void> {
  const ctx = getContext(req);
  const { id } = req.params;

  const result = await reviewTaskService.assignReviewTask(id, req.body, ctx);

  if (!result.success) {
    const statusCode =
      result.errorCode === 'FORBIDDEN'
        ? 403
        : result.errorCode === 'NOT_FOUND'
          ? 404
          : result.errorCode === 'INVALID_STATE'
            ? 409
            : result.errorCode === 'VALIDATION_ERROR'
              ? 400
              : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * POST /api/v1/reviews/:id/decide
 * Submit a review decision.
 */
export async function submitDecision(
  req: AuthenticatedRoleRequest,
  res: Response,
): Promise<void> {
  const ctx = getContext(req);
  const { id } = req.params;

  const result = await reviewTaskService.submitDecision(id, req.body, ctx);

  if (!result.success) {
    const statusCode =
      result.errorCode === 'FORBIDDEN'
        ? 403
        : result.errorCode === 'NOT_FOUND'
          ? 404
          : result.errorCode === 'INVALID_STATE'
            ? 409
            : result.errorCode === 'INVALID_DECISION'
              ? 422
              : result.errorCode === 'VALIDATION_ERROR'
                ? 400
                : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}
