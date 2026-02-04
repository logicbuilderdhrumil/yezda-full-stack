/**
 * Organization Management Controller
 * Task 1.2, 1.3: Organization endpoint handlers
 * Task 1.5: RBAC and tenant isolation in handlers
 */

import type { Request, Response } from 'express';
import { organizationService } from '../services/org-management.service.js';
import type { AuthenticatedRoleRequest } from '../middleware/route-guards.middleware.js';
import type {
  OrganizationFilters,
  OrganizationPaginationOptions,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from '../models/org-management.model.js';

/**
 * Get client info from request for audit logging
 */
function getClientInfo(req: Request) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api',
  };
}

/**
 * Extract actor context from authenticated request
 */
function getActorContext(req: AuthenticatedRoleRequest) {
  return {
    userId: req.user?.sub ?? 'unknown',
    userType: (req.user?.type ?? 'user') as 'user' | 'candidate',
  };
}

/**
 * GET /api/v1/organizations
 * List organizations with optional filters and pagination
 */
export async function listOrganizations(
  req: AuthenticatedRoleRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const actor = getActorContext(req);
  const requestContext = getClientInfo(req);

  // Parse query parameters for filters
  const filters: OrganizationFilters = {};
  if (req.query.status) {
    filters.status = req.query.status as OrganizationFilters['status'];
  }
  if (req.query.plan) {
    filters.plan = req.query.plan as OrganizationFilters['plan'];
  }
  if (req.query.search) {
    filters.search = req.query.search as string;
  }
  if (req.query.createdAfter) {
    filters.createdAfter = new Date(req.query.createdAfter as string);
  }
  if (req.query.createdBefore) {
    filters.createdBefore = new Date(req.query.createdBefore as string);
  }

  // Parse pagination options
  const pagination: OrganizationPaginationOptions = {};
  if (req.query.limit) {
    pagination.limit = parseInt(req.query.limit as string, 10);
  }
  if (req.query.offset) {
    pagination.offset = parseInt(req.query.offset as string, 10);
  }
  if (req.query.cursor) {
    pagination.cursor = req.query.cursor as string;
  }
  if (req.query.sortBy) {
    pagination.sortBy = req.query.sortBy as OrganizationPaginationOptions['sortBy'];
  }
  if (req.query.sortOrder) {
    pagination.sortOrder = req.query.sortOrder as OrganizationPaginationOptions['sortOrder'];
  }

  const result = await organizationService.list(filters, pagination, actor, requestContext);

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/organizations/:id
 * Get organization details by ID
 */
export async function getOrganization(
  req: AuthenticatedRoleRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const actor = getActorContext(req);
  const requestContext = getClientInfo(req);
  const { id } = req.params;

  const result = await organizationService.getById(id, actor, requestContext);

  if (!result.success) {
    const status = result.errorCode === 'ORG_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * POST /api/v1/organizations
 * Create a new organization
 */
export async function createOrganization(
  req: AuthenticatedRoleRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const actor = getActorContext(req);
  const requestContext = getClientInfo(req);

  const input: CreateOrganizationInput = {
    ...req.body,
    createdBy: req.user.sub,
  };

  const result = await organizationService.create(input, actor, requestContext);

  if (!result.success) {
    const status = result.errorCode === 'ORG_SLUG_EXISTS' ? 409 : 500;
    res.status(status).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(201).json(result.data);
}

/**
 * PATCH /api/v1/organizations/:id
 * Update an existing organization
 */
export async function updateOrganization(
  req: AuthenticatedRoleRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const actor = getActorContext(req);
  const requestContext = getClientInfo(req);
  const { id } = req.params;

  const input: UpdateOrganizationInput = {
    ...req.body,
    updatedBy: req.user.sub,
  };

  const result = await organizationService.update(id, input, actor, requestContext);

  if (!result.success) {
    const status = result.errorCode === 'ORG_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}
