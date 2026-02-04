/**
 * Export Controller
 * API endpoint handlers for export operations.
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { exportService } from '../services/export.service.js';
import type { ExportFormat } from '../models/export.model.js';

/**
 * Get tenant ID from request.
 */
function getTenantId(req: AuthenticatedRequest): string | undefined {
  return (req.headers['x-tenant-id'] as string) || (req as any).tenantId;
}

/**
 * POST /api/v1/exports
 * Request a new export.
 */
export async function requestExport(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID required', code: 'TENANT_REQUIRED' });
    return;
  }

  const { format, filters, columns } = req.body;

  const result = await exportService.requestExport({
    tenantId,
    userId: req.user.sub,
    format: format as ExportFormat,
    filters,
    columns,
  });

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(202).json(formatExport(result.export!));
}

/**
 * GET /api/v1/exports/:exportId
 * Get export status.
 */
export async function getExportStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID required', code: 'TENANT_REQUIRED' });
    return;
  }

  const { exportId } = req.params;

  const exportRecord = await exportService.getExport(exportId, tenantId, req.user.sub);

  if (!exportRecord) {
    res.status(404).json({ error: 'Export not found', code: 'EXPORT_NOT_FOUND' });
    return;
  }

  res.status(200).json(formatExport(exportRecord));
}

/**
 * GET /api/v1/exports/:exportId/download
 * Download export file.
 */
export async function downloadExport(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID required', code: 'TENANT_REQUIRED' });
    return;
  }

  const { exportId } = req.params;

  const result = await exportService.downloadExport(exportId, tenantId, req.user.sub);

  if (!result.success) {
    const statusCode = result.errorCode === 'EXPORT_NOT_FOUND' ? 404
      : result.errorCode === 'EXPORT_NOT_READY' ? 400
      : result.errorCode === 'EXPORT_EXPIRED' ? 410
      : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  const file = result.file!;
  const contentType = getContentType(result.format!);

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', file.length);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(result.filename!)}"`
  );

  res.send(file);
}

/**
 * Format export for API response.
 */
function formatExport(exportRecord: any): Record<string, unknown> {
  return {
    exportId: exportRecord.id,
    status: exportRecord.status,
    format: exportRecord.format,
    progress: exportRecord.progress,
    downloadUrl: exportRecord.downloadUrl,
    expiresAt: exportRecord.expiresAt?.toISOString(),
    createdAt: exportRecord.createdAt?.toISOString(),
    completedAt: exportRecord.completedAt?.toISOString(),
  };
}

/**
 * Get content type for export format.
 */
function getContentType(format: ExportFormat): string {
  const contentTypes: Record<ExportFormat, string> = {
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
    json: 'application/json',
  };
  return contentTypes[format] || 'application/octet-stream';
}
