/**
 * Localization Controller
 * Task 1.2, 1.3: Locale preference and translation endpoint handlers
 */

import type { Request, Response } from 'express';
import { localizationService } from '../services/localization.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import type { SupportedLocale, TranslationNamespace } from '../models/localization.model.js';

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
 * Extract tenant ID from authenticated user
 * In production, this would come from the user's token or a header
 */
function getTenantId(req: AuthenticatedRequest): string {
  // Try header first (for multi-tenant scenarios)
  const headerTenantId = req.get('x-tenant-id');
  if (headerTenantId) {
    return headerTenantId;
  }
  
  // Default tenant for single-tenant or testing
  return 'default';
}

/**
 * GET /api/v1/localization/preferences
 * Get current user's locale preference
 */
export async function getLocalePreference(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { ipAddress } = getClientInfo(req);
  const tenantId = getTenantId(req);

  const result = await localizationService.getLocalePreference(
    req.user.sub,
    req.user.type,
    tenantId,
    ipAddress
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * PUT /api/v1/localization/preferences
 * Update current user's locale preference
 */
export async function updateLocalePreference(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { ipAddress, userAgent } = getClientInfo(req);
  const tenantId = getTenantId(req);

  const result = await localizationService.updateLocalePreference(
    req.user.sub,
    req.user.type,
    tenantId,
    req.body,
    req.user.sub,
    req.user.type,
    ipAddress,
    userAgent
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'ACCESS_DENIED' ? 403 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/localization/translations
 * Get translation resources for a locale
 */
export async function getTranslations(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { ipAddress } = getClientInfo(req);
  const locale = req.query.locale as SupportedLocale;
  const namespacesParam = req.query.namespaces as string | undefined;
  const namespaces = namespacesParam?.split(',') as TranslationNamespace[] | undefined;

  // Optional auth - translations can be fetched without auth
  const userId = req.user?.sub;
  const userType = req.user?.type;
  const tenantId = req.user ? getTenantId(req) : undefined;

  const result = await localizationService.getTranslations(
    locale,
    namespaces,
    userId,
    userType,
    tenantId,
    ipAddress
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  // Set cache headers for translation responses
  res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
  res.status(200).json(result.data);
}

/**
 * GET /api/v1/localization/locales
 * Get list of supported locales
 */
export async function getSupportedLocales(_req: Request, res: Response): Promise<void> {
  const locales = localizationService.getSupportedLocales();
  res.status(200).json({ locales });
}

/**
 * GET /api/v1/localization/health
 * Health check and SLO status for localization endpoints
 */
export async function getLocalizationHealth(_req: Request, res: Response): Promise<void> {
  const sloStatus = localizationService.checkSLOs();
  
  res.status(sloStatus.met ? 200 : 503).json({
    status: sloStatus.met ? 'healthy' : 'degraded',
    slosViolated: sloStatus.violations,
    timestamp: new Date().toISOString(),
  });
}
