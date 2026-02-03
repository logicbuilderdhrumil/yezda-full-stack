/**
 * OAuth Controller
 * Task 1.2, 1.3: OAuth authorization and callback endpoints
 */

import type { Request, Response } from 'express';
import { oauthService } from '../services/oauth.service.js';
import { oauthRepository } from '../repositories/oauth.repository.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import type { OAuthProvider } from '../models/oauth.model.js';

/**
 * Supported OAuth providers (validated at runtime)
 */
const VALID_PROVIDERS: OAuthProvider[] = ['google', 'microsoft', 'slack', 'github'];

function isValidProvider(provider: string): provider is OAuthProvider {
  return VALID_PROVIDERS.includes(provider as OAuthProvider);
}

/**
 * Get client info from request
 */
function getClientInfo(req: Request) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
  };
}

/**
 * GET /api/v1/oauth/providers
 * Get list of configured OAuth providers
 */
export async function getProviders(_req: Request, res: Response): Promise<void> {
  const providers = oauthService.getConfiguredProviders();
  res.status(200).json({ providers });
}

/**
 * POST /api/v1/oauth/authorize/:provider
 * Initiate OAuth authorization flow
 */
export async function authorize(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { provider } = req.params;
  const { tenantId, redirectUrl } = req.body;

  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  if (!provider || !isValidProvider(provider)) {
    res.status(400).json({ error: 'Invalid OAuth provider', code: 'INVALID_PROVIDER' });
    return;
  }

  if (!oauthService.isProviderConfigured(provider)) {
    res.status(400).json({ error: 'Provider not configured', code: 'PROVIDER_NOT_CONFIGURED' });
    return;
  }

  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' });
    return;
  }

  try {
    const result = await oauthService.startAuthorization({
      provider,
      tenantId,
      userId: req.user.sub,
      userType: req.user.type,
      redirectUrl,
    });

    res.status(200).json({
      authorizationUrl: result.authorizationUrl,
      state: result.state,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start authorization';
    res.status(500).json({ error: message, code: 'AUTHORIZATION_FAILED' });
  }
}

/**
 * GET /api/v1/oauth/callback/:provider
 * Handle OAuth provider callback
 */
export async function callback(req: Request, res: Response): Promise<void> {
  const { provider } = req.params;
  const { code, state, error: oauthError, error_description } = req.query;
  const { ipAddress, userAgent } = getClientInfo(req);

  if (!provider || !isValidProvider(provider)) {
    res.status(400).json({ error: 'Invalid OAuth provider', code: 'INVALID_PROVIDER' });
    return;
  }

  // Handle OAuth provider errors
  if (oauthError) {
    res.status(400).json({
      error: error_description || oauthError,
      code: 'OAUTH_PROVIDER_ERROR',
    });
    return;
  }

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Missing authorization code', code: 'MISSING_CODE' });
    return;
  }

  if (!state || typeof state !== 'string') {
    res.status(400).json({ error: 'Missing state parameter', code: 'MISSING_STATE' });
    return;
  }

  const result = await oauthService.handleCallback(
    provider,
    code,
    state,
    ipAddress,
    userAgent
  );

  if (!result.success) {
    res.status(400).json({ error: result.error, code: result.errorCode });
    return;
  }

  // If there's a redirect URL, redirect there
  if (result.redirectUrl) {
    res.redirect(result.redirectUrl);
    return;
  }

  res.status(200).json({
    success: true,
    provider: result.provider,
    message: 'Integration connected successfully',
  });
}

/**
 * GET /api/v1/oauth/status/:provider
 * Get integration status for a specific provider
 */
export async function getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { provider } = req.params;
  const { tenantId } = req.query;

  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  if (!provider || !isValidProvider(provider)) {
    res.status(400).json({ error: 'Invalid OAuth provider', code: 'INVALID_PROVIDER' });
    return;
  }

  if (!tenantId || typeof tenantId !== 'string') {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' });
    return;
  }

  const status = await oauthService.getIntegrationStatus(
    tenantId,
    req.user.sub,
    req.user.type,
    provider
  );

  res.status(200).json(status);
}

/**
 * GET /api/v1/oauth/status
 * Get all integration statuses for current user
 */
export async function getAllStatuses(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { tenantId } = req.query;

  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  if (!tenantId || typeof tenantId !== 'string') {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' });
    return;
  }

  const statuses = await oauthService.getAllIntegrationStatuses(
    tenantId,
    req.user.sub,
    req.user.type
  );

  res.status(200).json({ integrations: statuses });
}

/**
 * DELETE /api/v1/oauth/integration/:provider
 * Disconnect an integration
 */
export async function disconnect(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { provider } = req.params;
  const { tenantId } = req.body;
  const { ipAddress } = getClientInfo(req);

  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  if (!provider || !isValidProvider(provider)) {
    res.status(400).json({ error: 'Invalid OAuth provider', code: 'INVALID_PROVIDER' });
    return;
  }

  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' });
    return;
  }

  await oauthService.disconnectIntegration(
    tenantId,
    req.user.sub,
    req.user.type,
    provider,
    ipAddress
  );

  res.status(200).json({ message: 'Integration disconnected successfully' });
}

/**
 * POST /api/v1/oauth/refresh/:provider
 * Manually refresh an integration token
 */
export async function refreshIntegrationToken(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { provider } = req.params;
  const { tenantId } = req.body;

  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  if (!provider || !isValidProvider(provider)) {
    res.status(400).json({ error: 'Invalid OAuth provider', code: 'INVALID_PROVIDER' });
    return;
  }

  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT_ID' });
    return;
  }

  // Get current token
  const token = await oauthRepository.findToken(tenantId, req.user.sub, req.user.type, provider);

  if (!token) {
    res.status(404).json({ error: 'Integration not found', code: 'NOT_CONNECTED' });
    return;
  }

  const result = await oauthService.refreshToken(token.id);

  if (!result.success) {
    res.status(400).json({ error: result.error, code: 'REFRESH_FAILED' });
    return;
  }

  res.status(200).json({ message: 'Token refreshed successfully' });
}
