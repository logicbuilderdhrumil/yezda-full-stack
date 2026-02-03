/**
 * UI Kit Controller
 * Task 1.2: Configuration retrieval endpoint handlers
 */

import type { Request, Response } from 'express';
import { uiKitService } from '../services/ui-kit.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import type { ComponentCategory, ThemePreset } from '../models/ui-kit.model.js';

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
 * Extract tenant ID from authenticated user or header
 * Task 1.4: Tenant scoping
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
 * GET /api/v1/ui-kit/config
 * Get UI component configuration
 * Task 1.2: Fetch UI configuration
 */
export async function getUIConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { ipAddress } = getClientInfo(req);
  const tenantId = getTenantId(req);
  const category = req.query.category as ComponentCategory | undefined;
  const theme = req.query.theme as ThemePreset | undefined;

  // Optional auth - configuration can be fetched with or without auth
  const userId = req.user?.sub;
  const userType = req.user?.type;

  const result = await uiKitService.getUIConfig(
    tenantId,
    category,
    theme,
    userId,
    userType,
    ipAddress
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  // Set cache headers for configuration responses
  res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
  res.status(200).json(result.data);
}

/**
 * GET /api/v1/ui-kit/themed-variants
 * Get themed variants for UI components
 * Task 1.2: Fetch themed variants
 */
export async function getThemedVariants(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { ipAddress } = getClientInfo(req);
  const tenantId = getTenantId(req);
  const theme = req.query.theme as ThemePreset;
  const category = req.query.category as ComponentCategory | undefined;

  if (!theme) {
    res.status(400).json({ error: 'Theme parameter is required', code: 'MISSING_THEME' });
    return;
  }

  // Optional auth
  const userId = req.user?.sub;
  const userType = req.user?.type;

  const result = await uiKitService.getThemedVariants(
    tenantId,
    theme,
    category,
    userId,
    userType,
    ipAddress
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  // Set cache headers
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json(result.data);
}

/**
 * GET /api/v1/ui-kit/themes
 * Get list of available themes
 */
export function getAvailableThemes(_req: Request, res: Response): void {
  const themes = uiKitService.getAvailableThemes();
  res.status(200).json({ themes });
}

/**
 * GET /api/v1/ui-kit/categories
 * Get list of available component categories
 */
export function getAvailableCategories(_req: Request, res: Response): void {
  const categories = uiKitService.getAvailableCategories();
  res.status(200).json({ categories });
}

/**
 * GET /api/v1/ui-kit/health
 * Health check and SLO status for UI kit endpoints
 * Task 1.7: SLO monitoring
 */
export function getUIKitHealth(_req: Request, res: Response): void {
  const sloStatus = uiKitService.checkSLOs();

  res.status(sloStatus.met ? 200 : 503).json({
    status: sloStatus.met ? 'healthy' : 'degraded',
    slosViolated: sloStatus.violations,
    timestamp: new Date().toISOString(),
  });
}
