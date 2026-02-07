/**
 * Custom Components Controller
 * Task 1.2: Organization selection endpoint handlers
 * Task 1.3: Theme preference endpoint handlers
 * Task 1.5: RBAC enforcement in handlers
 */

import type { Request, Response } from 'express';
import { customComponentsService } from '../services/custom-components.service.js';
import type { AuthenticatedRoleRequest } from '../middleware/route-guards.middleware.js';
import type { ThemeMode } from '../services/custom-components.service.js';

/** Valid theme mode values */
const VALID_THEME_MODES: ThemeMode[] = ['light', 'dark', 'system'];

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
 * GET /api/v1/components/organizations
 * List organizations the user belongs to
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

  const result = await customComponentsService.listOrganizations(actor, requestContext);

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * PUT /api/v1/components/organizations/active
 * Set the active organization context
 */
export async function setActiveOrganization(
  req: AuthenticatedRoleRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { organizationId } = req.body;

  if (!organizationId || typeof organizationId !== 'string') {
    res.status(400).json({
      error: 'organizationId is required and must be a string',
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  const actor = getActorContext(req);
  const requestContext = getClientInfo(req);

  const result = await customComponentsService.setActiveOrganization(
    organizationId,
    actor,
    requestContext
  );

  if (!result.success) {
    const status = result.errorCode === 'COMPONENT_ORG_NOT_MEMBER' ? 403 : 500;
    res.status(status).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/components/preferences/theme
 * Get user's theme preference
 */
export async function getThemePreference(
  req: AuthenticatedRoleRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const actor = getActorContext(req);
  const requestContext = getClientInfo(req);

  const result = await customComponentsService.getThemePreference(actor, requestContext);

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * PUT /api/v1/components/preferences/theme
 * Update user's theme preference
 */
export async function updateThemePreference(
  req: AuthenticatedRoleRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { mode } = req.body;

  if (!mode || !VALID_THEME_MODES.includes(mode)) {
    res.status(400).json({
      error: `mode is required and must be one of: ${VALID_THEME_MODES.join(', ')}`,
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  const actor = getActorContext(req);
  const requestContext = getClientInfo(req);

  const result = await customComponentsService.updateThemePreference(mode, actor, requestContext);

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}
