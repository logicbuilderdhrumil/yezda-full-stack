/**
 * State Store Controller
 * Task 1.2: HTTP endpoint handlers for state store operations
 */

import type { Response } from 'express';
import { z } from 'zod';
import { stateStoreService } from '../services/state-store.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import type { PreferenceKey, UserPreferences, SessionState } from '../models/state-store.model.js';

/** Maximum size for state values (64KB) */
const MAX_VALUE_SIZE_BYTES = 64 * 1024;

/**
 * Zod schemas for input validation
 */
const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  locale: z.string().min(2).max(10).optional(),
  presence: z.enum(['online', 'away', 'busy', 'offline']).optional(),
}).refine(
  (data) => JSON.stringify(data).length <= MAX_VALUE_SIZE_BYTES,
  { message: 'Preferences value exceeds maximum size (64KB)' }
);

const sessionStateSchema = z.object({
  currentView: z.string().max(512).optional(),
  unsavedChanges: z.boolean().optional(),
  customData: z.record(z.unknown()).optional(),
  lastActivity: z.coerce.date().optional(),
}).refine(
  (data) => JSON.stringify(data).length <= MAX_VALUE_SIZE_BYTES,
  { message: 'Session state value exceeds maximum size (64KB)' }
);

const preferenceValueSchema = z.object({
  value: z.string().min(1).max(255),
});

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
 * Tenant ID is required for all state store operations to ensure proper data isolation.
 * Returns null if not provided - callers must handle missing tenant context.
 */
function getTenantId(req: AuthenticatedRequest): string | null {
  const tenantId = req.get('x-tenant-id');
  if (!tenantId || tenantId.trim() === '') {
    return null;
  }
  return tenantId.trim();
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
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant context required', code: 'MISSING_TENANT' });
    return;
  }

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
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant context required', code: 'MISSING_TENANT' });
    return;
  }

  const context = getClientContext(req);

  // Validate request body with Zod schema
  const parseResult = preferencesSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMessage = parseResult.error.errors[0]?.message || 'Invalid preferences object';
    res.status(400).json({ error: errorMessage, code: 'INVALID_INPUT' });
    return;
  }
  const preferences: Partial<UserPreferences> = parseResult.data;

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
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant context required', code: 'MISSING_TENANT' });
    return;
  }

  const context = getClientContext(req);
  const key = req.params.key as PreferenceKey;

  // Validate key
  if (!['theme', 'locale', 'presence'].includes(key)) {
    res.status(400).json({ error: 'Invalid preference key', code: 'INVALID_KEY' });
    return;
  }

  // Validate value with Zod
  const parseResult = preferenceValueSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Value must be a non-empty string (max 255 chars)', code: 'INVALID_VALUE' });
    return;
  }
  const { value } = parseResult.data;

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
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant context required', code: 'MISSING_TENANT' });
    return;
  }

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
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant context required', code: 'MISSING_TENANT' });
    return;
  }

  const context = getClientContext(req);

  // Validate request body with Zod schema
  const parseResult = sessionStateSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMessage = parseResult.error.errors[0]?.message || 'Invalid session state object';
    res.status(400).json({ error: errorMessage, code: 'INVALID_INPUT' });
    return;
  }
  const sessionState: Partial<SessionState> = parseResult.data;

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
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant context required', code: 'MISSING_TENANT' });
    return;
  }

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
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant context required', code: 'MISSING_TENANT' });
    return;
  }

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
