/**
 * View Components Controller
 * Task 1.2: Chat and file view endpoint handlers
 */

import type { Request, Response } from 'express';
import { viewComponentsService } from '../services/view-components.service.js';
import type { AuthenticatedRoleRequest } from '../middleware/route-guards.middleware.js';
import type { ChatConversationType, FileTypeCategory } from '../models/view-components.model.js';

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
 * Extract tenant ID from authenticated user context
 * Task 1.4: Tenant scoping - uses auth context to prevent tenant spoofing
 */
function getTenantId(req: AuthenticatedRoleRequest): string {
  // Use tenant from authenticated user context (prevents spoofing)
  if (req.user?.tenantId) {
    return req.user.tenantId;
  }

  // Default tenant for single-tenant or testing
  return 'default';
}

/**
 * GET /api/v1/view-components/chat/summaries
 * Get chat summary data for view components
 * Task 1.2: Fetch chat summaries
 */
export async function getChatSummaries(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const { ipAddress } = getClientInfo(req);
  const tenantId = getTenantId(req);
  const conversationType = req.query.conversationType as ChatConversationType | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

  // Auth required - user context used for tenant scoping and access control
  const userId = req.user?.sub;
  const userType = req.user?.type;

  const result = await viewComponentsService.getChatSummaries(
    tenantId,
    conversationType,
    limit,
    offset,
    userId,
    userType,
    ipAddress
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  // Set cache headers for chat summary responses
  res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
  res.status(200).json(result.data);
}

/**
 * GET /api/v1/view-components/file/types
 * Get file type metadata for view components
 * Task 1.2: Fetch file type metadata
 */
export async function getFileTypeMetadata(req: AuthenticatedRoleRequest, res: Response): Promise<void> {
  const { ipAddress } = getClientInfo(req);
  const tenantId = getTenantId(req);
  const category = req.query.category as FileTypeCategory | undefined;

  // Auth required - user context used for tenant scoping
  const userId = req.user?.sub;
  const userType = req.user?.type;

  const result = await viewComponentsService.getFileTypeMetadata(
    tenantId,
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
 * GET /api/v1/view-components/conversation-types
 * Get list of available conversation types
 */
export function getAvailableConversationTypes(_req: Request, res: Response): void {
  const types = viewComponentsService.getAvailableConversationTypes();
  res.status(200).json({ types });
}

/**
 * GET /api/v1/view-components/file/categories
 * Get list of available file type categories
 */
export function getAvailableFileCategories(_req: Request, res: Response): void {
  const categories = viewComponentsService.getAvailableFileTypeCategories();
  res.status(200).json({ categories });
}

/**
 * GET /api/v1/view-components/health
 * Health check and SLO status for view component endpoints
 * Task 1.7: SLO monitoring
 */
export function getViewComponentsHealth(_req: Request, res: Response): void {
  const sloStatus = viewComponentsService.checkSLOs();

  res.status(sloStatus.met ? 200 : 503).json({
    status: sloStatus.met ? 'healthy' : 'degraded',
    slosViolated: sloStatus.violations,
    timestamp: new Date().toISOString(),
  });
}
