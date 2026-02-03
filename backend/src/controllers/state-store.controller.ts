/**
 * State Store Controller
 * Task 1.2: HTTP endpoint handlers for state store operations
 */

import type { Response } from 'express';
import { stateStoreService } from '../services/state-store.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import type { PreferenceKey, UserPreferences, SessionState } from '../models/state-store.model.js';

/**
 * Get client context from request
 */
function getClientContext(req: AuthenticatedRequest) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api',
  };
}

/**
 * Get tenant ID from request
 * In a full implementation, this would come from the authenticated user's organization
 * For now, we use a header or default
 */
function getTenantId(req: AuthenticatedRequest): string {
  return req.get('x-tenant-id') || 'default-tenant';
}

/**
 * GET /api/v1/state/preferences
 * Get user preferences
 */
export async function getPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const context = getClientContext(req);

  const result = await stateStoreService.getPreferences(
    tenantId,
    req.user.sub,
    req.user.type,
    context
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * PUT /api/v1/state/preferences
 * Update user preferences
 */
export async function updatePreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const context = getClientContext(req);
  const preferences: Partial<UserPreferences> = req.body;

  // Validate request body
  if (!preferences || typeof preferences !== 'object') {
    res.status(400).json({ error: 'Invalid preferences object', code: 'INVALID_INPUT' });
    return;
  }

  const result = await stateStoreService.updatePreferences(
    tenantId,
    req.user.sub,
    req.user.type,
    preferences,
    context
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'INVALID_PREFERENCE' ? 400 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * PATCH /api/v1/state/preferences/:key
 * Update a single preference
 */
export async function updatePreference(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const context = getClientContext(req);
  const key = req.params.key as PreferenceKey;
  const { value } = req.body;

  // Validate key
  if (!['theme', 'locale', 'presence'].includes(key)) {
    res.status(400).json({ error: 'Invalid preference key', code: 'INVALID_KEY' });
    return;
  }

  // Validate value
  if (typeof value !== 'string') {
    res.status(400).json({ error: 'Value must be a string', code: 'INVALID_VALUE' });
    return;
  }

  const result = await stateStoreService.updatePreference(
    tenantId,
    req.user.sub,
    req.user.type,
    key,
    value,
    context
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'INVALID_PREFERENCE' ? 400 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/state/session
 * Get session state
 */
export async function getSessionState(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const context = getClientContext(req);

  const result = await stateStoreService.getSessionState(
    tenantId,
    req.user.sub,
    req.user.type,
    context
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * PUT /api/v1/state/session
 * Update session state
 */
export async function updateSessionState(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const context = getClientContext(req);
  const sessionState: Partial<SessionState> = req.body;

  // Validate request body
  if (!sessionState || typeof sessionState !== 'object') {
    res.status(400).json({ error: 'Invalid session state object', code: 'INVALID_INPUT' });
    return;
  }

  const result = await stateStoreService.updateSessionState(
    tenantId,
    req.user.sub,
    req.user.type,
    sessionState,
    context
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/state
 * Get all user state (preferences + session)
 */
export async function getUserState(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const context = getClientContext(req);

  const result = await stateStoreService.getUserState(
    tenantId,
    req.user.sub,
    req.user.type,
    context
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * DELETE /api/v1/state
 * Clear all user state
 */
export async function clearUserState(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const context = getClientContext(req);

  const result = await stateStoreService.clearUserState(
    tenantId,
    req.user.sub,
    req.user.type,
    context
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json({ message: 'State cleared successfully', ...(result.data as object) });
}
