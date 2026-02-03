/**
 * Shell Controller
 * Task 1.2, 1.3: Shell configuration and preference endpoint handlers
 */

import type { Request, Response } from 'express';
import { shellService } from '../services/shell.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import type { PreferenceUpdateRequest } from '../models/shell.model.js';

/**
 * Extract tenant ID from request headers
 */
function getTenantId(req: Request): string | undefined {
  return req.get('x-tenant-id');
}

/**
 * Extract user authorities from request
 * In production, these would come from the JWT claims or a permission service
 */
function getUserAuthorities(req: AuthenticatedRequest): string[] {
  // For demo purposes, assign authorities based on user type
  // In production, this would be fetched from the user's roles/permissions
  if (!req.user) return [];
  
  const baseAuthorities: string[] = [];
  
  if (req.user.type === 'user') {
    // Regular users get basic read permissions
    baseAuthorities.push('candidate:read', 'screening:read', 'report:read', 'settings:read');
  } else if (req.user.type === 'candidate') {
    // Candidates get limited access
    baseAuthorities.push('candidate:self');
  }
  
  return baseAuthorities;
}

/**
 * GET /api/v1/shell/config
 * Get shell layout configuration and metadata
 */
export async function getShellConfig(req: Request, res: Response): Promise<void> {
  const tenantId = getTenantId(req);
  
  const config = await shellService.getShellConfig(tenantId);
  
  // Set cache headers for client-side caching
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json(config);
}

/**
 * GET /api/v1/shell/navigation
 * Get navigation items filtered by user authority
 */
export async function getNavigation(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }
  
  const tenantId = getTenantId(req);
  const authorities = getUserAuthorities(req);
  
  const navigation = await shellService.getNavigation(
    authorities,
    req.user.sub,
    req.user.type,
    tenantId
  );
  
  res.setHeader('Cache-Control', 'private, max-age=120');
  res.status(200).json(navigation);
}

/**
 * GET /api/v1/shell/policies
 * Get route access policies
 */
export async function getRoutePolicies(_req: Request, res: Response): Promise<void> {
  const policies = await shellService.getRoutePolicies();
  
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json(policies);
}

/**
 * GET /api/v1/shell/preferences/defaults
 * Get theme and locale preference defaults
 */
export async function getPreferenceDefaults(_req: Request, res: Response): Promise<void> {
  const defaults = await shellService.getPreferenceDefaults();
  
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).json(defaults);
}

/**
 * GET /api/v1/shell/preferences
 * Get current user's preferences
 */
export async function getUserPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }
  
  const tenantId = getTenantId(req);
  
  const preferences = await shellService.getUserPreferences(
    req.user.sub,
    req.user.type,
    tenantId
  );
  
  if (!preferences) {
    // Return defaults if no preferences set
    const defaults = await shellService.getPreferenceDefaults();
    res.status(200).json({
      theme: defaults.theme,
      localeCode: defaults.locale.code,
    });
    return;
  }
  
  res.status(200).json({
    theme: preferences.theme,
    localeCode: preferences.localeCode,
  });
}

/**
 * PUT /api/v1/shell/preferences
 * Update current user's preferences
 */
export async function updateUserPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }
  
  const tenantId = getTenantId(req);
  const { theme, localeCode } = req.body as PreferenceUpdateRequest;
  
  // Validate theme
  if (theme !== undefined && !shellService.isValidTheme(theme)) {
    res.status(400).json({
      error: 'Invalid theme value',
      code: 'INVALID_THEME',
      allowedValues: ['light', 'dark', 'system'],
    });
    return;
  }
  
  // Validate locale
  if (localeCode !== undefined && !shellService.isValidLocaleCode(localeCode)) {
    res.status(400).json({
      error: 'Invalid locale code',
      code: 'INVALID_LOCALE',
    });
    return;
  }
  
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.get('user-agent');
  
  const updated = await shellService.updateUserPreferences(
    req.user.sub,
    req.user.type,
    { theme, localeCode },
    tenantId,
    ipAddress,
    userAgent
  );
  
  res.status(200).json({
    theme: updated.theme,
    localeCode: updated.localeCode,
    message: 'Preferences updated successfully',
  });
}
