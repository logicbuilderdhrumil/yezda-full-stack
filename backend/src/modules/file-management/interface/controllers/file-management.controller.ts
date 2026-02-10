/**
 * File Management Controller (Clean Architecture)
 * HTTP request handlers delegating to use cases via constructor injection.
 * Uses arrow function methods to preserve `this` binding in route handlers.
 */
import type { Request, Response } from 'express';
import type { UploadFileUseCase } from '../../application/use-cases/UploadFileUseCase.js';
import type { DownloadFileUseCase } from '../../application/use-cases/DownloadFileUseCase.js';
import type { GetFileMetadataUseCase } from '../../application/use-cases/GetFileMetadataUseCase.js';
import type { ListFilesUseCase } from '../../application/use-cases/ListFilesUseCase.js';
import type { DeleteFileUseCase } from '../../application/use-cases/DeleteFileUseCase.js';
import type { GetStorageUsageUseCase } from '../../application/use-cases/GetStorageUsageUseCase.js';
import type { GetHealthMetricsUseCase } from '../../application/use-cases/GetHealthMetricsUseCase.js';
import type { RequestContext } from '../../domain/entities/index.js';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    type: 'user' | 'candidate';
    tenantId?: string;
    [key: string]: unknown;
  };
}

type FileUploadRequest = Omit<AuthenticatedRequest, 'file'> & {
  file?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
};

/**
 * Extract tenant ID from request (header or user context)
 */
function getTenantId(req: AuthenticatedRequest): string {
  return (
    (req.headers['x-tenant-id'] as string) ||
    req.user?.tenantId ||
    ''
  );
}

/**
 * Build RequestContext from the authenticated request
 */
function buildContext(req: AuthenticatedRequest): RequestContext {
  return {
    userId: req.user!.sub,
    userType: req.user!.type,
    tenantId: getTenantId(req),
    ipAddress: req.ip || req.socket.remoteAddress,
  };
}

export class FileManagementController {
  constructor(
    private readonly uploadFileUseCase: UploadFileUseCase,
    private readonly downloadFileUseCase: DownloadFileUseCase,
    private readonly getFileMetadataUseCase: GetFileMetadataUseCase,
    private readonly listFilesUseCase: ListFilesUseCase,
    private readonly deleteFileUseCase: DeleteFileUseCase,
    private readonly getStorageUsageUseCase: GetStorageUsageUseCase,
    private readonly getHealthMetricsUseCase: GetHealthMetricsUseCase,
  ) {}

  /**
   * POST /upload
   */
  uploadFile = async (req: FileUploadRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const ctx = buildContext(req as unknown as AuthenticatedRequest);
    if (!ctx.tenantId) {
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

    const result = await this.uploadFileUseCase.execute(
      ctx,
      {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      expiresInDays,
    );

    if (!result.success) {
      const statusCode =
        result.code === 'INVALID_FILE_TYPE' || result.code === 'FILE_TOO_LARGE' ? 400 : 500;
      res.status(statusCode).json({ error: result.error, code: result.code });
      return;
    }

    const file = result.data;
    res.status(201).json({
      id: file.id,
      filename: file.filename,
      originalFilename: file.originalFilename,
      mimeType: file.mimeType,
      size: file.size,
      sizeFormatted: file.sizeFormatted,
      scanStatus: file.scanStatus,
      createdAt: file.createdAt,
      expiresAt: file.expiresAt,
    });
  };

  /**
   * GET /:id
   */
  getFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const ctx = buildContext(req);
    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID required', code: 'TENANT_REQUIRED' });
      return;
    }

    const { id } = req.params;
    const result = await this.getFileMetadataUseCase.execute(ctx, id);

    if (!result.success) {
      res.status(404).json({ error: result.error, code: result.code });
      return;
    }

    const file = result.data;
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
  };

  /**
   * GET /:id/download
   */
  downloadFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const ctx = buildContext(req);
    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID required', code: 'TENANT_REQUIRED' });
      return;
    }

    const { id } = req.params;
    const result = await this.downloadFileUseCase.execute(ctx, id);

    if (!result.success) {
      const statusCode =
        result.code === 'FILE_NOT_FOUND'
          ? 404
          : result.code === 'FILE_EXPIRED'
            ? 410
            : result.code === 'FILE_INFECTED'
              ? 403
              : 500;
      res.status(statusCode).json({ error: result.error, code: result.code });
      return;
    }

    const { file, buffer } = result.data;

    // Set response headers
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.size);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.originalFilename)}"`,
    );

    // ETag for caching
    if (file.checksum) {
      res.setHeader('ETag', `"${file.checksum}"`);
    }

    res.send(buffer);
  };

  /**
   * GET /
   */
  listFiles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const ctx = buildContext(req);
    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID required', code: 'TENANT_REQUIRED' });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const mimeType = req.query.mimeType as string | undefined;
    const uploaderId = req.query.uploaderId as string | undefined;

    const result = await this.listFilesUseCase.execute(ctx, {
      uploaderId,
      mimeType,
      limit,
      offset,
    });

    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.code });
      return;
    }

    const data = result.data;
    res.status(200).json({
      files: data.files.map((file) => ({
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
      total: data.total,
      limit: data.limit,
      offset: data.offset,
    });
  };

  /**
   * DELETE /:id
   */
  deleteFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const ctx = buildContext(req);
    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID required', code: 'TENANT_REQUIRED' });
      return;
    }

    const { id } = req.params;
    const result = await this.deleteFileUseCase.execute(ctx, id);

    if (!result.success) {
      res.status(404).json({ error: result.error, code: result.code });
      return;
    }

    res.status(200).json({ message: result.data.message });
  };

  /**
   * GET /storage-usage
   */
  getStorageUsage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const ctx = buildContext(req);
    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID required', code: 'TENANT_REQUIRED' });
      return;
    }

    const result = await this.getStorageUsageUseCase.execute(ctx);

    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.code });
      return;
    }

    res.status(200).json(result.data);
  };

  /**
   * GET /health
   */
  getHealth = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const result = this.getHealthMetricsUseCase.execute();

    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.code });
      return;
    }

    res.status(200).json(result.data);
  };
}
