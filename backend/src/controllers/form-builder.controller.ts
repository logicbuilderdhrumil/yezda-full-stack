/**
 * Form Builder Controller
 * Task 1.2: Form list, create, edit, and retrieve endpoint handlers.
 * Task 1.4: Tenant scoping and RBAC.
 */

import type { Request, Response } from 'express';
import { formBuilderService } from '../services/form-builder.service.js';
import type { AuthenticatedRoleRequest } from '../middleware/route-guards.middleware.js';
import type { CreateFormRequest, UpdateFormRequest, ListFormsQuery } from '../models/form-builder.model.js';

/**
 * Extract client info from request
 */
function getClientInfo(req: Request) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api',
  };
}

/**
 * Extract tenant ID from authenticated user context only
 * Task 1.4: Tenant scoping
 * Security: tenant ID must come from authenticated JWT only, never headers
 */
function getTenantId(req: AuthenticatedRoleRequest): string {
  if (!req.user?.tenantId) {
    throw new Error('Tenant context required');
  }
  return req.user.tenantId;
}

/**
 * GET /api/v1/forms
 * List form definitions
 * Task 1.2: List forms
 */
export async function listForms(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const { ipAddress } = getClientInfo(req);
  
  let tenantId: string;
  try {
    tenantId = getTenantId(req);
  } catch {
    res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
    return;
  }

  const query = req.query as unknown as ListFormsQuery;

  const userId = req.user?.sub;
  const userType = req.user?.type;

  const result = await formBuilderService.listForms(tenantId, query, userId, userType, ipAddress);

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * POST /api/v1/forms
 * Create a new form definition
 * Task 1.2: Create form
 */
export async function createForm(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const { ipAddress } = getClientInfo(req);

  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  let tenantId: string;
  try {
    tenantId = getTenantId(req);
  } catch {
    res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
    return;
  }

  const userId = req.user.sub;
  const userType = req.user.type;
  const body = req.body as CreateFormRequest;

  const result = await formBuilderService.createForm(tenantId, userId, userType, body, ipAddress);

  if (!result.success) {
    const status = result.errorCode === 'DUPLICATE_FIELD_IDS' || 
                   result.errorCode === 'INVALID_CONDITIONAL_REFS' ? 400 : 500;
    res.status(status).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(201).json(result.data);
}

/**
 * GET /api/v1/forms/:formId
 * Get a form definition by ID
 * Task 1.2: Retrieve form
 */
export async function getForm(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const { ipAddress } = getClientInfo(req);
  
  let tenantId: string;
  try {
    tenantId = getTenantId(req);
  } catch {
    res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
    return;
  }

  const { formId } = req.params;

  const userId = req.user?.sub;
  const userType = req.user?.type;

  const result = await formBuilderService.getForm(tenantId, formId, userId, userType, ipAddress);

  if (!result.success) {
    const status = result.errorCode === 'FORM_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ error: result.error, code: result.errorCode });
    return;
  }

  // Set cache headers for form responses
  res.setHeader('Cache-Control', 'private, max-age=300'); // 5 minutes
  res.status(200).json(result.data);
}

/**
 * PUT /api/v1/forms/:formId
 * Update a form definition
 * Task 1.2: Edit form
 */
export async function updateForm(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const { ipAddress } = getClientInfo(req);
  const { formId } = req.params;

  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  let tenantId: string;
  try {
    tenantId = getTenantId(req);
  } catch {
    res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
    return;
  }

  const userId = req.user.sub;
  const userType = req.user.type;
  const body = req.body as UpdateFormRequest;

  const result = await formBuilderService.updateForm(tenantId, formId, userId, userType, body, ipAddress);

  if (!result.success) {
    let status = 500;
    if (result.errorCode === 'FORM_NOT_FOUND') {
      status = 404;
    } else if (result.errorCode === 'DUPLICATE_FIELD_IDS' || result.errorCode === 'INVALID_CONDITIONAL_REFS') {
      status = 400;
    }
    res.status(status).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * DELETE /api/v1/forms/:formId
 * Delete (archive) a form definition
 * Task 1.2: Delete form
 */
export async function deleteForm(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const { ipAddress } = getClientInfo(req);
  const { formId } = req.params;

  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  let tenantId: string;
  try {
    tenantId = getTenantId(req);
  } catch {
    res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
    return;
  }

  const userId = req.user.sub;
  const userType = req.user.type;

  const result = await formBuilderService.deleteForm(tenantId, formId, userId, userType, ipAddress);

  if (!result.success) {
    const status = result.errorCode === 'FORM_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(204).send();
}

/**
 * GET /api/v1/forms/health
 * Health check and SLO status for form builder endpoints
 * Task 1.7: SLO monitoring
 */
export function getFormBuilderHealth(_req: Request, res: Response): void {
  const sloStatus = formBuilderService.checkSLOs();

  res.status(sloStatus.met ? 200 : 503).json({
    status: sloStatus.met ? 'healthy' : 'degraded',
    slosViolated: sloStatus.violations,
    timestamp: new Date().toISOString(),
  });
}
