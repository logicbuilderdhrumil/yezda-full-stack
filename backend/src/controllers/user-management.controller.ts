/**
 * User Management Controller
 * Task 1.2, 1.3: HTTP handlers for user management endpoints
 */

import type { Response } from 'express';
import { userManagementService } from '../services/user-management.service.js';
import { getClientIp } from '../utils/ip.util.js';
import type { AuthenticatedRoleRequest } from '../middleware/route-guards.middleware.js';
import type { UserSearchParams, UserStatus } from '../models/user-management.model.js';
import type { UserRole } from '../middleware/route-guards.middleware.js';

/**
 * Extract management context from request
 * TenantId is derived from authenticated user context, not client input
 */
function getManagementContext(req: AuthenticatedRoleRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  // Get tenantId from authenticated user context (validated by auth middleware)
  const tenantId = req.user?.tenantId || '';
  
  return {
    actorId: req.user?.sub || '',
    actorType: (req.user?.type || 'user') as 'user' | 'candidate',
    actorRoles: req.user?.roles || [],
    tenantId,
    ipAddress: ip,
    userAgent,
    channel: 'api' as const,
  };
}

/**
 * GET /api/v1/users
 * List users with search, filter, and pagination
 */
export async function listUsers(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getManagementContext(req);

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const params: Omit<UserSearchParams, 'tenantId'> = {
    query: req.query.q as string | undefined,
    status: req.query.status as UserStatus | undefined,
    role: req.query.role as UserRole | undefined,
    page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    sortBy: req.query.sortBy as UserSearchParams['sortBy'],
    sortOrder: req.query.sortOrder as UserSearchParams['sortOrder'],
  };

  const result = await userManagementService.listUsers(params, ctx);

  if (!result.success) {
    const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/users/:id
 * Get user details by ID
 */
export async function getUserById(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getManagementContext(req);
  const { id } = req.params;

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const result = await userManagementService.getUserById(id, ctx);

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
 * POST /api/v1/users
 * Create a new user
 */
export async function createUser(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getManagementContext(req);

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const { email, displayName, firstName, lastName, status, roles, password, userSpace } = req.body;

  const result = await userManagementService.createUser(
    { email, displayName, firstName, lastName, status, roles, password, userSpace: userSpace ?? 'platform' },
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
 * PATCH /api/v1/users/:id
 * Update user details
 */
export async function updateUser(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getManagementContext(req);
  const { id } = req.params;

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const { displayName, firstName, lastName, status, roles } = req.body;

  const result = await userManagementService.updateUser(
    id,
    { displayName, firstName, lastName, status, roles },
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
 * PATCH /api/v1/users/:id/status
 * Update user status
 */
export async function updateUserStatus(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getManagementContext(req);
  const { id } = req.params;
  const { status } = req.body;

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const result = await userManagementService.updateUserStatus(id, status, ctx);

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
 * PATCH /api/v1/users/:id/roles
 * Update user roles
 */
export async function updateUserRoles(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getManagementContext(req);
  const { id } = req.params;
  const { roles } = req.body;

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const result = await userManagementService.updateUserRoles(id, roles, ctx);

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
 * DELETE /api/v1/users/:id
 * Delete (deactivate) a user
 */
export async function deleteUser(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const ctx = getManagementContext(req);
  const { id } = req.params;

  if (!ctx.tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
    return;
  }

  const result = await userManagementService.deleteUser(id, ctx);

  if (!result.success) {
    const statusCode = 
      result.errorCode === 'FORBIDDEN' ? 403 :
      result.errorCode === 'SELF_DELETE_FORBIDDEN' ? 400 :
      result.errorCode === 'NOT_FOUND' ? 404 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(204).send();
}
