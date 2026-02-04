/**
 * Asset Management Controller
 * Task 1.2: HTTP endpoint handlers for asset catalog operations
 * Task 1.3: HTTP endpoint handlers for template asset operations
 * Task 1.4: Enforce tenant scoping and RBAC
 */

import type { Response } from 'express';
import { z } from 'zod';
import { assetManagementService } from '../services/asset-management.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  SUPPORTED_ASSET_TYPES,
  SUPPORTED_ASSET_USAGES,
  SUPPORTED_TEMPLATE_TYPES,
  type AssetType,
  type AssetUsage,
  type TemplateType,
} from '../models/asset-management.model.js';

/**
 * Zod schemas for input validation
 */
const assetTypeSchema = z.enum(SUPPORTED_ASSET_TYPES as unknown as [AssetType, ...AssetType[]]);
const assetUsageSchema = z.enum(SUPPORTED_ASSET_USAGES as unknown as [AssetUsage, ...AssetUsage[]]);
const templateTypeSchema = z.enum(SUPPORTED_TEMPLATE_TYPES as unknown as [TemplateType, ...TemplateType[]]);

const assetQuerySchema = z.object({
  type: assetTypeSchema.optional(),
  usage: assetUsageSchema.optional(),
  tags: z.string().optional().transform((val) => val?.split(',').map((t) => t.trim())),
  search: z.string().max(200).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
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
 * GET /api/v1/assets
 * Query assets with filters
 */
export async function queryAssets(req: AuthenticatedRequest, res: Response): Promise<void> {
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

  // Validate query parameters
  const parseResult = assetQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    const errorMessage = parseResult.error.errors[0]?.message || 'Invalid query parameters';
    res.status(400).json({ error: errorMessage, code: 'INVALID_INPUT' });
    return;
  }

  const filters = parseResult.data;

  const result = await assetManagementService.queryAssets(tenantId, filters, {
    ...context,
    userId: req.user.sub,
    userType: req.user.type,
  });

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/assets/type/:type
 * Get assets by type
 */
export async function getAssetsByType(req: AuthenticatedRequest, res: Response): Promise<void> {
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

  // Validate asset type
  const typeResult = assetTypeSchema.safeParse(req.params.type);
  if (!typeResult.success) {
    res.status(400).json({ error: 'Invalid asset type', code: 'INVALID_ASSET_TYPE' });
    return;
  }

  // Validate optional usage
  let usage: AssetUsage | undefined;
  if (req.query.usage) {
    const usageResult = assetUsageSchema.safeParse(req.query.usage);
    if (!usageResult.success) {
      res.status(400).json({ error: 'Invalid asset usage', code: 'INVALID_ASSET_USAGE' });
      return;
    }
    usage = usageResult.data;
  }

  const result = await assetManagementService.getAssetsByType(
    tenantId,
    typeResult.data,
    usage,
    {
      ...context,
      userId: req.user.sub,
      userType: req.user.type,
    }
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/assets/:assetId
 * Get a specific asset by ID
 */
export async function getAssetById(req: AuthenticatedRequest, res: Response): Promise<void> {
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
  const assetId = req.params.assetId;

  if (!assetId) {
    res.status(400).json({ error: 'Asset ID required', code: 'MISSING_ASSET_ID' });
    return;
  }

  const result = await assetManagementService.getAssetById(tenantId, assetId, {
    ...context,
    userId: req.user.sub,
    userType: req.user.type,
  });

  if (!result.success) {
    const statusCode = result.errorCode === 'ASSET_NOT_FOUND' ? 404 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/assets/templates/:templateId
 * Get a template asset by ID
 */
export async function getTemplateById(req: AuthenticatedRequest, res: Response): Promise<void> {
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
  const templateId = req.params.templateId;

  if (!templateId) {
    res.status(400).json({ error: 'Template ID required', code: 'MISSING_TEMPLATE_ID' });
    return;
  }

  const result = await assetManagementService.getTemplateById(tenantId, templateId, {
    ...context,
    userId: req.user.sub,
    userType: req.user.type,
  });

  if (!result.success) {
    const statusCode = result.errorCode === 'TEMPLATE_NOT_FOUND' ? 404 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/assets/templates/type/:templateType
 * Get templates by type
 */
export async function getTemplatesByType(req: AuthenticatedRequest, res: Response): Promise<void> {
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

  // Validate template type
  const typeResult = templateTypeSchema.safeParse(req.params.templateType);
  if (!typeResult.success) {
    res.status(400).json({ error: 'Invalid template type', code: 'INVALID_TEMPLATE_TYPE' });
    return;
  }

  // Get optional locale
  const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined;

  const result = await assetManagementService.getTemplatesByType(
    tenantId,
    typeResult.data,
    locale,
    {
      ...context,
      userId: req.user.sub,
      userType: req.user.type,
    }
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/assets/health
 * Get asset system health summary
 */
export async function getHealthSummary(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const summary = assetManagementService.getHealthSummary();
  res.status(200).json(summary);
}
