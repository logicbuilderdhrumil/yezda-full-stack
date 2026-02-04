/**
 * Theme Controller
 * Task 1.2: HTTP endpoint handlers for theme operations
 * Task 1.4: Enforce tenant scoping and RBAC
 */

import type { Response } from 'express';
import { z } from 'zod';
import { themeService } from '../services/theme.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import type { ThemePresetId, ThemePreferenceUpdate } from '../models/theme.model.js';

/**
 * Zod schemas for input validation
 */
const presetIdSchema = z.enum(['light', 'dark', 'high-contrast']);

const colorTokensSchema = z.object({
  primary: z.string().optional(),
  primaryForeground: z.string().optional(),
  secondary: z.string().optional(),
  secondaryForeground: z.string().optional(),
  background: z.string().optional(),
  foreground: z.string().optional(),
  muted: z.string().optional(),
  mutedForeground: z.string().optional(),
  accent: z.string().optional(),
  accentForeground: z.string().optional(),
  destructive: z.string().optional(),
  destructiveForeground: z.string().optional(),
  border: z.string().optional(),
  input: z.string().optional(),
  ring: z.string().optional(),
  card: z.string().optional(),
  cardForeground: z.string().optional(),
  popover: z.string().optional(),
  popoverForeground: z.string().optional(),
}).optional();

const typographyTokensSchema = z.object({
  fontFamily: z.string().optional(),
  fontSizeBase: z.string().optional(),
  fontSizeSm: z.string().optional(),
  fontSizeLg: z.string().optional(),
  fontSizeXl: z.string().optional(),
  lineHeightBase: z.string().optional(),
  lineHeightTight: z.string().optional(),
  lineHeightRelaxed: z.string().optional(),
}).optional();

const spacingTokensSchema = z.object({
  xs: z.string().optional(),
  sm: z.string().optional(),
  md: z.string().optional(),
  lg: z.string().optional(),
  xl: z.string().optional(),
  xxl: z.string().optional(),
}).optional();

const radiusTokensSchema = z.object({
  sm: z.string().optional(),
  md: z.string().optional(),
  lg: z.string().optional(),
  full: z.string().optional(),
}).optional();

const customTokensSchema = z.object({
  colors: colorTokensSchema,
  typography: typographyTokensSchema,
  spacing: spacingTokensSchema,
  radius: radiusTokensSchema,
}).optional();

const preferenceUpdateSchema = z.object({
  presetId: presetIdSchema.optional(),
  customTokens: customTokensSchema,
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
 */
function getTenantId(req: AuthenticatedRequest): string | null {
  const tenantId = req.get('x-tenant-id');
  if (!tenantId || tenantId.trim() === '') {
    return null;
  }
  return tenantId.trim();
}

/**
 * GET /api/v1/theme/presets
 * Get all available theme presets
 */
export async function getPresets(req: AuthenticatedRequest, res: Response): Promise<void> {
  const context = getClientContext(req);

  const result = await themeService.getPresets(context);

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/theme/presets/:presetId
 * Get a specific theme preset
 */
export async function getPreset(req: AuthenticatedRequest, res: Response): Promise<void> {
  const context = getClientContext(req);
  const presetId = req.params.presetId as ThemePresetId;

  // Validate preset ID
  const parseResult = presetIdSchema.safeParse(presetId);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Invalid preset ID', code: 'INVALID_PRESET_ID' });
    return;
  }

  const result = await themeService.getPreset(presetId, context);

  if (!result.success) {
    const statusCode = result.errorCode === 'THEME_NOT_FOUND' ? 404 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/theme/preference
 * Get user's theme preference
 */
export async function getPreference(req: AuthenticatedRequest, res: Response): Promise<void> {
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

  const result = await themeService.getPreference(
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
 * PUT /api/v1/theme/preference
 * Update user's theme preference
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

  // Validate request body
  const parseResult = preferenceUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMessage = parseResult.error.errors[0]?.message || 'Invalid preference update';
    res.status(400).json({ error: errorMessage, code: 'INVALID_INPUT' });
    return;
  }

  const update: ThemePreferenceUpdate = parseResult.data;

  // Ensure at least one field is being updated
  if (!update.presetId && !update.customTokens) {
    res.status(400).json({ error: 'At least presetId or customTokens required', code: 'INVALID_INPUT' });
    return;
  }

  const result = await themeService.updatePreference(
    tenantId,
    req.user.sub,
    req.user.type,
    update,
    context
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'INVALID_PRESET' ? 400 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * DELETE /api/v1/theme/preference
 * Reset user's theme preference to default
 */
export async function deletePreference(req: AuthenticatedRequest, res: Response): Promise<void> {
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

  const result = await themeService.deletePreference(
    tenantId,
    req.user.sub,
    req.user.type,
    context
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json({ message: 'Preference reset to default' });
}

/**
 * GET /api/v1/theme/tokens
 * Get effective theme tokens (preset + custom overrides)
 */
export async function getEffectiveTokens(req: AuthenticatedRequest, res: Response): Promise<void> {
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

  const result = await themeService.getEffectiveTokens(
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
 * GET /api/v1/theme/health
 * Get theme system health summary
 */
export async function getHealthSummary(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const summary = themeService.getHealthSummary();
  res.status(200).json(summary);
}
