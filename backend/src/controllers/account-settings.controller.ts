/**
 * Account Settings Controller
 * Task 1.2, 1.3: Profile and integration endpoint handlers
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { accountSettingsService } from '../services/account-settings.service.js';
import { accountSettingsMetricsService } from '../services/account-settings-metrics.service.js';
import type { IntegrationProvider } from '../models/account-settings.model.js';

/**
 * Get client info from request
 */
function getClientInfo(req: AuthenticatedRequest) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api',
  };
}

/**
 * Extract tenant ID from request (from header or auth token)
 */
function getTenantId(req: AuthenticatedRequest): string {
  // In a real app, tenant ID would come from JWT claims or a header
  return req.get('x-tenant-id') || 'default';
}

/**
 * GET /api/v1/account/profile
 * Get current user's profile
 */
export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { ipAddress, channel } = getClientInfo(req);
  const tenantId = getTenantId(req);

  const result = await accountSettingsService.getProfile(
    tenantId,
    req.user.sub,
    req.user.type,
    req.user.sub,
    req.user.type,
    channel,
    ipAddress
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.profile);
}

/**
 * PATCH /api/v1/account/profile
 * Update current user's profile
 */
export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { ipAddress, userAgent, channel } = getClientInfo(req);
  const tenantId = getTenantId(req);

  const result = await accountSettingsService.updateProfile(
    tenantId,
    req.user.sub,
    req.user.type,
    req.body,
    req.user.sub,
    req.user.type,
    channel,
    ipAddress,
    userAgent
  );

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

  res.status(200).json(result.profile);
}

/**
 * GET /api/v1/account/integrations
 * Get all integration statuses for current user
 */
export async function getIntegrations(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { ipAddress, channel } = getClientInfo(req);
  const tenantId = getTenantId(req);

  const result = await accountSettingsService.getIntegrationStatuses(
    tenantId,
    req.user.sub,
    req.user.type,
    req.user.sub,
    req.user.type,
    channel,
    ipAddress
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json({ integrations: result.integrations });
}

/**
 * GET /api/v1/account/integrations/:provider
 * Get single integration status
 */
export async function getIntegration(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const provider = req.params.provider as IntegrationProvider;
  const { ipAddress, channel } = getClientInfo(req);
  const tenantId = getTenantId(req);

  const result = await accountSettingsService.getIntegrationStatus(
    tenantId,
    req.user.sub,
    req.user.type,
    provider,
    req.user.sub,
    req.user.type,
    channel,
    ipAddress
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.integration);
}

/**
 * POST /api/v1/account/integrations/:provider/verify
 * Handle integration verification callback
 */
export async function verifyIntegration(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const provider = req.params.provider as IntegrationProvider;
  const { ipAddress, userAgent, channel } = getClientInfo(req);
  const tenantId = getTenantId(req);

  // Simulated verification result from OAuth flow
  // In practice, this would be obtained from the OAuth callback
  const verificationResult = {
    success: req.body.success !== false,
    provider,
    providerAccountId: req.body.providerAccountId,
    providerEmail: req.body.providerEmail,
    scopes: req.body.scopes || [],
    error: req.body.error,
    errorCode: req.body.errorCode,
  };

  const result = await accountSettingsService.handleVerificationCallback(
    tenantId,
    req.user.sub,
    req.user.type,
    provider,
    verificationResult,
    channel,
    ipAddress,
    userAgent
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 400;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json({
    message: 'Integration verified successfully',
    integration: result.integration,
  });
}

/**
 * DELETE /api/v1/account/integrations/:provider
 * Disconnect an integration
 */
export async function disconnectIntegration(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const provider = req.params.provider as IntegrationProvider;
  const { ipAddress, userAgent, channel } = getClientInfo(req);
  const tenantId = getTenantId(req);

  const result = await accountSettingsService.disconnectIntegration(
    tenantId,
    req.user.sub,
    req.user.type,
    provider,
    req.user.sub,
    req.user.type,
    channel,
    ipAddress,
    userAgent
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json({ message: 'Integration disconnected successfully' });
}

/**
 * GET /api/v1/account/health
 * Get account settings health and SLO status
 */
export async function getHealthSummary(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const health = accountSettingsMetricsService.getHealthSummary();
  const sloCheck = accountSettingsMetricsService.checkSLOs();

  res.status(200).json({
    status: sloCheck.met ? 'healthy' : 'degraded',
    ...health,
  });
}
