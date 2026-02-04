/**
 * Candidate Management Controller
 * Task 1.2, 1.3: HTTP handlers for candidate management endpoints
 */

import type { Request, Response } from 'express';
import { candidateManagementService } from '../services/candidate-management.service.js';
import { getClientIp } from '../utils/ip.util.js';
import type { AuthenticatedRoleRequest } from '../middleware/route-guards.middleware.js';
import type { CandidateSearchParams, CandidateStatus, CandidateManagementContext } from '../models/candidate-management.model.js';
import type { UserRole } from '../middleware/route-guards.middleware.js';

/**
 * Extract management context from request
 * TenantId is derived from authenticated user context, not client input
 */
function getManagementContext(req: AuthenticatedRoleRequest): CandidateManagementContext {
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  // Get tenantId from authenticated user context (validated by auth middleware)
  const tenantId = req.user?.tenantId || '';
  
  return {
    actorId: req.user?.sub || '',
    actorType: (req.user?.type || 'user') as 'user' | 'candidate',
    actorRoles: (req.user?.roles || []) as UserRole[],
    tenantId,
    ipAddress: ip,
    userAgent,
    channel: 'api' as const,
  };
}

/**
 * GET /api/v1/candidates
 * List candidates with search, filter, and pagination
 */
export async function listCandidates(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getManagementContext(req);

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const params: Omit<CandidateSearchParams, 'tenantId'> = {
    query: req.query.q as string | undefined,
    status: req.query.status as CandidateStatus | undefined,
    certified: req.query.certified !== undefined ? req.query.certified === 'true' : undefined,
    archived: req.query.archived !== undefined ? req.query.archived === 'true' : undefined,
    page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    sortBy: req.query.sortBy as CandidateSearchParams['sortBy'],
    sortOrder: req.query.sortOrder as CandidateSearchParams['sortOrder'],
  };

  const result = await candidateManagementService.listCandidates(params, ctx);

  if (!result.success) {
    const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/candidates/:id
 * Get candidate details by ID
 */
export async function getCandidateById(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getManagementContext(req);
  const { id } = req.params;

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const result = await candidateManagementService.getCandidateById(id, ctx);

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
 * POST /api/v1/candidates
 * Create a new candidate
 */
export async function createCandidate(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getManagementContext(req);

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const { email, firstName, lastName, phone, status, metadata } = req.body;

  const result = await candidateManagementService.createCandidate(
    { email, firstName, lastName, phone, status, metadata },
    ctx
  );

  if (!result.success) {
    const statusCode = 
      result.errorCode === 'FORBIDDEN' ? 403 :
      result.errorCode === 'EMAIL_EXISTS' ? 409 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(201).json(result.data);
}

/**
 * PATCH /api/v1/candidates/:id
 * Update candidate details
 */
export async function updateCandidate(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getManagementContext(req);
  const { id } = req.params;

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const { firstName, lastName, phone, status, metadata } = req.body;

  const result = await candidateManagementService.updateCandidate(
    id,
    { firstName, lastName, phone, status, metadata },
    ctx
  );

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
 * PATCH /api/v1/candidates/:id/status
 * Update candidate status
 */
export async function updateCandidateStatus(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getManagementContext(req);
  const { id } = req.params;
  const { status } = req.body;

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const result = await candidateManagementService.updateCandidateStatus(id, status, ctx);

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
 * POST /api/v1/candidates/bulk
 * Bulk create candidates
 */
export async function bulkCreateCandidates(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getManagementContext(req);

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const { candidates } = req.body;

  const result = await candidateManagementService.bulkCreateCandidates(candidates, ctx);

  if (!result.success) {
    const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(201).json(result.data);
}

/**
 * POST /api/v1/candidates/submit/:tenantId
 * Public submission form endpoint
 */
export async function submitCandidateForm(req: Request, res: Response): Promise<void> {
  const { tenantId } = req.params;
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'];

  const { email, firstName, lastName, phone, consentGiven, metadata } = req.body;

  const result = await candidateManagementService.submitCandidateForm(
    tenantId,
    { email, firstName, lastName, phone, consentGiven, metadata },
    ip,
    userAgent
  );

  if (!result.success) {
    const statusCode = 
      result.errorCode === 'INVALID_TENANT' ? 400 :
      result.errorCode === 'EMAIL_EXISTS' ? 409 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(201).json(result.data);
}

/**
 * DELETE /api/v1/candidates/:id
 * Delete (hard delete) a candidate
 */
export async function deleteCandidate(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getManagementContext(req);
  const { id } = req.params;

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const result = await candidateManagementService.deleteCandidate(id, ctx);

  if (!result.success) {
    const statusCode = 
      result.errorCode === 'FORBIDDEN' ? 403 :
      result.errorCode === 'NOT_FOUND' ? 404 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(204).send();
}
