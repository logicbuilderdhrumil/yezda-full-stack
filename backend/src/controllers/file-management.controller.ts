/**
 * File Management Controller
 * Task 1.2: API endpoint handlers for file operations
 */

import type { Response } from 'express';
import { fileManagementService } from '../services/file-management.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

// File upload shape from multer
interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

// Extended request type for file uploads - use intersection to avoid conflict
type FileUploadRequest = AuthenticatedRequest & {
  file?: UploadedFile;
  tenantId?: string;
};

/**
 * Get tenant ID from request (header, user context, or JWT payload)
 */
function getTenantId(req: AuthenticatedRequest): string {
  return (req.headers['x-tenant-id'] as string) || (req as any).tenantId || req.user?.tenantId || 'default';
}

/**
 * POST /api/v1/files/upload
 * Upload a file
 */
export async function uploadFile(req: FileUploadRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID required', code: 'TENANT_REQUIRED' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded', code: 'NO_FILE' });
    return;
  }

  const expiresInDays = req.body.expiresInDays
    ? parseInt(req.body.expiresInDays, 10)
    : undefined;

  const result = await fileManagementService.uploadFile({
    tenantId,
    uploaderId: req.user.sub,
    uploaderType: req.user.type,
    file: {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    },
    expiresInDays,
  });

  if (!result.success) {
    const statusCode = result.errorCode === 'INVALID_FILE_TYPE' || result.errorCode === 'FILE_TOO_LARGE'
      ? 400
      : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(201).json({
    id: result.file!.id,
    filename: result.file!.filename,
    originalFilename: result.file!.originalFilename,
    mimeType: result.file!.mimeType,
    size: result.file!.size,
    sizeFormatted: result.file!.sizeFormatted,
    scanStatus: result.file!.scanStatus,
    createdAt: result.file!.createdAt,
    expiresAt: result.file!.expiresAt,
  });
}

/**
 * GET /api/v1/files/:id
 * Get file metadata
 */
export async function getFile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID required', code: 'TENANT_REQUIRED' });
    return;
  }

  const { id } = req.params;

  const file = await fileManagementService.getFileMetadata(
    id,
    tenantId,
    req.user.sub,
    req.user.type
  );

  if (!file) {
    res.status(404).json({ error: 'File not found', code: 'FILE_NOT_FOUND' });
    return;
  }

  res.status(200).json({
    id: file.id,
    filename: file.filename,
    originalFilename: file.originalFilename,
    mimeType: file.mimeType,
    size: file.size,
    sizeFormatted: file.sizeFormatted,
    scanStatus: file.scanStatus,
    accessCount: file.accessCount,
    lastAccessedAt: file.lastAccessedAt,
    createdAt: file.createdAt,
    expiresAt: file.expiresAt,
  });
}

/**
 * GET /api/v1/files/:id/download
 * Download file content
 */
export async function downloadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID required', code: 'TENANT_REQUIRED' });
    return;
  }

  const { id } = req.params;
  const ipAddress = req.ip || req.socket.remoteAddress;

  const result = await fileManagementService.downloadFile(
    id,
    tenantId,
    req.user.sub,
    req.user.type,
    ipAddress
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'FILE_NOT_FOUND' ? 404
      : result.errorCode === 'FILE_EXPIRED' ? 410
      : result.errorCode === 'FILE_INFECTED' ? 403
      : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  const file = result.file!;

  // Set response headers
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Length', file.size);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(file.originalFilename)}"`
  );

  // ETag for caching
  if (file.checksum) {
    res.setHeader('ETag', `"${file.checksum}"`);
  }

  // Send buffer
  res.send(result.buffer);
}

/**
 * GET /api/v1/files
 * List files for the tenant
 */
export async function listFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID required', code: 'TENANT_REQUIRED' });
    return;
  }

  const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
  const offset = parseInt(req.query.offset as string, 10) || 0;
  const mimeType = req.query.mimeType as string | undefined;
  const uploaderId = req.query.uploaderId as string | undefined;

  const result = await fileManagementService.listFiles({
    tenantId,
    uploaderId,
    mimeType,
    limit,
    offset,
  });

  res.status(200).json({
    files: result.files.map((file) => ({
      id: file.id,
      filename: file.filename,
      originalFilename: file.originalFilename,
      mimeType: file.mimeType,
      size: file.size,
      sizeFormatted: file.sizeFormatted,
      scanStatus: file.scanStatus,
      createdAt: file.createdAt,
      expiresAt: file.expiresAt,
    })),
    total: result.total,
    limit: result.limit,
    offset: result.offset,
  });
}

/**
 * DELETE /api/v1/files/:id
 * Delete a file
 */
export async function deleteFile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID required', code: 'TENANT_REQUIRED' });
    return;
  }

  const { id } = req.params;
  const ipAddress = req.ip || req.socket.remoteAddress;

  const result = await fileManagementService.deleteFile(
    id,
    tenantId,
    req.user.sub,
    req.user.type,
    ipAddress
  );

  if (!result.success) {
    res.status(404).json({ error: result.error, code: 'FILE_NOT_FOUND' });
    return;
  }

  res.status(200).json({ message: 'File deleted successfully' });
}

/**
 * GET /api/v1/files/storage-usage
 * Get storage usage for the tenant
 */
export async function getStorageUsage(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID required', code: 'TENANT_REQUIRED' });
    return;
  }

  const usage = await fileManagementService.getTenantStorageUsage(tenantId);

  res.status(200).json(usage);
}

/**
 * GET /api/v1/files/health
 * Get file management health metrics
 */
export async function getHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const metrics = fileManagementService.getHealthMetrics();

  res.status(200).json(metrics);
}
