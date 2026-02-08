/**
 * Screening Pipeline Controller
 * HTTP handlers for screening pipeline endpoints
 */

import type { Response } from 'express';
import { screeningPipelineService } from '../services/screening-pipeline.service.js';
import { getClientIp } from '../utils/ip.util.js';
import type { AuthenticatedRoleRequest } from '../middleware/route-guards.middleware.js';
import type { PipelineContext } from '../models/screening-pipeline.model.js';

/**
 * Extract pipeline context from request
 */
function getPipelineContext(req: AuthenticatedRoleRequest): PipelineContext {
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  const tenantId = req.user?.tenantId || (req.headers['x-tenant-id'] as string) || 'default';
  
  return {
    actorId: req.user?.sub || '',
    actorType: (req.user?.type || 'user') as 'user' | 'candidate',
    actorRoles: (req.user?.roles || []) as string[],
    tenantId,
    ipAddress: ip,
    userAgent,
    channel: 'api' as const,
  };
}

/**
 * GET /api/v1/screening-pipelines
 * List all pipelines for the tenant
 */
export async function listPipelines(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getPipelineContext(req);

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const result = await screeningPipelineService.listPipelines(ctx);

  if (!result.success) {
    const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * POST /api/v1/screening-pipelines
 * Create a new pipeline
 */
export async function createPipeline(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getPipelineContext(req);

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const { name, description, stages, graph } = req.body;

  const result = await screeningPipelineService.createPipeline(
    { name, description, stages, graph },
    ctx
  );

  if (!result.success) {
    const statusCode = 
      result.errorCode === 'FORBIDDEN' ? 403 :
      result.errorCode === 'NAME_EXISTS' ? 409 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(201).json(result.data);
}

/**
 * GET /api/v1/screening-pipelines/:id
 * Get pipeline by ID
 */
export async function getPipeline(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getPipelineContext(req);
  const { id } = req.params;

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const result = await screeningPipelineService.getPipeline(id, ctx);

  if (!result.success) {
    const statusCode = 
      result.errorCode === 'FORBIDDEN' ? 403 :
      result.errorCode === 'NOT_FOUND' ? 404 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * PUT /api/v1/screening-pipelines/:id
 * Update a pipeline
 */
export async function updatePipeline(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getPipelineContext(req);
  const { id } = req.params;

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const { name, description, stages, graph } = req.body;

  const result = await screeningPipelineService.updatePipeline(
    id,
    { name, description, stages, graph },
    ctx
  );

  if (!result.success) {
    const statusCode = 
      result.errorCode === 'FORBIDDEN' ? 403 :
      result.errorCode === 'NOT_FOUND' ? 404 :
      result.errorCode === 'NAME_EXISTS' ? 409 :
      result.errorCode === 'NOT_EDITABLE' ? 422 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * PATCH /api/v1/screening-pipelines/:id/activate
 * Activate a pipeline
 */
export async function activatePipeline(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getPipelineContext(req);
  const { id } = req.params;

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const result = await screeningPipelineService.activatePipeline(id, ctx);

  if (!result.success) {
    const statusCode = 
      result.errorCode === 'FORBIDDEN' ? 403 :
      result.errorCode === 'NOT_FOUND' ? 404 :
      result.errorCode === 'NO_STAGES' || result.errorCode === 'ARCHIVED' ? 422 :
      result.errorCode === 'ALREADY_ACTIVE' ? 409 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * PATCH /api/v1/screening-pipelines/:id/archive
 * Archive a pipeline
 */
export async function archivePipeline(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getPipelineContext(req);
  const { id } = req.params;

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const result = await screeningPipelineService.archivePipeline(id, ctx);

  if (!result.success) {
    const statusCode = 
      result.errorCode === 'FORBIDDEN' ? 403 :
      result.errorCode === 'NOT_FOUND' ? 404 :
      result.errorCode === 'ALREADY_ARCHIVED' ? 409 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * DELETE /api/v1/screening-pipelines/:id
 * Delete a pipeline
 */
export async function deletePipeline(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getPipelineContext(req);
  const { id } = req.params;

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const result = await screeningPipelineService.deletePipeline(id, ctx);

  if (!result.success) {
    const statusCode = 
      result.errorCode === 'FORBIDDEN' ? 403 :
      result.errorCode === 'NOT_FOUND' ? 404 :
      result.errorCode === 'NOT_DELETABLE' || result.errorCode === 'HAS_ASSIGNMENTS' ? 422 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(204).send();
}

/**
 * POST /api/v1/screening-pipelines/:id/assign
 * Assign pipeline to a candidate
 */
export async function assignPipeline(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getPipelineContext(req);
  const { id } = req.params;
  const { candidateId } = req.body;

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const result = await screeningPipelineService.assignPipeline(id, candidateId, ctx);

  if (!result.success) {
    const statusCode = 
      result.errorCode === 'FORBIDDEN' ? 403 :
      result.errorCode === 'NOT_FOUND' ? 404 :
      result.errorCode === 'ALREADY_ASSIGNED' ? 409 :
      result.errorCode === 'NOT_ACTIVE' ? 422 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(201).json(result.data);
}

/**
 * GET /api/v1/screening-pipelines/assignments/:id/progress
 * Get assignment progress details
 */
export async function getAssignmentProgress(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getPipelineContext(req);
  const { id } = req.params;

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const result = await screeningPipelineService.getAssignmentProgress(id, ctx);

  if (!result.success) {
    const statusCode = 
      result.errorCode === 'FORBIDDEN' ? 403 :
      result.errorCode === 'NOT_FOUND' || result.errorCode === 'PIPELINE_NOT_FOUND' ? 404 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/screening-pipelines/candidates/:candidateId/assignments
 * List assignments for a candidate
 */
export async function getCandidateAssignments(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getPipelineContext(req);
  const { candidateId } = req.params;

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const result = await screeningPipelineService.getAssignmentsByCandidate(candidateId, ctx);

  if (!result.success) {
    const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * PATCH /api/v1/screening-pipelines/assignments/:assignmentId/stages/:stageId/complete
 * Complete a stage in an assignment
 */
export async function completeStage(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getPipelineContext(req);
  const { assignmentId, stageId } = req.params;

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const result = await screeningPipelineService.completeStage(assignmentId, stageId, ctx);

  if (!result.success) {
    const statusCode = 
      result.errorCode === 'FORBIDDEN' ? 403 :
      result.errorCode === 'NOT_FOUND' || 
      result.errorCode === 'PIPELINE_NOT_FOUND' || 
      result.errorCode === 'STAGE_NOT_FOUND' ? 404 :
      result.errorCode === 'NOT_IN_PROGRESS' || 
      result.errorCode === 'STAGE_NOT_IN_PROGRESS' ? 422 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}
