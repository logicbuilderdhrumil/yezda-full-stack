/**
 * File Management Repository
 * Task 1.1, 1.2: Postgres persistence for file metadata
 */

import { query } from '../db/postgres.js';
import type {
  FileMetadata,
  FileListOptions,
  FileListResult,
} from '../models/file-management.model.js';
import { normalizeFileSize } from '../models/file-management.model.js';
import { randomUUID } from 'crypto';

type FileRow = {
  id: string;
  tenant_id: string;
  uploader_id: string;
  uploader_type: 'user' | 'candidate';
  filename: string;
  original_filename: string;
  mime_type: string;
  size: number;
  storage_key: string;
  storage_adapter: 'local' | 's3';
  checksum: string | null;
  scan_status: 'pending' | 'clean' | 'infected' | 'error';
  scan_result: string | null;
  access_count: number;
  last_accessed_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

function rowToFileMetadata(row: FileRow): FileMetadata {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    uploaderId: row.uploader_id,
    uploaderType: row.uploader_type,
    filename: row.filename,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    size: row.size,
    sizeFormatted: normalizeFileSize(row.size),
    storageKey: row.storage_key,
    storageAdapter: row.storage_adapter,
    checksum: row.checksum ?? undefined,
    scanStatus: row.scan_status,
    scanResult: row.scan_result ?? undefined,
    accessCount: row.access_count,
    lastAccessedAt: row.last_accessed_at ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

export class FileRepository {
  /**
   * Create file metadata record
   */
  async create(params: {
    tenantId: string;
    uploaderId: string;
    uploaderType: 'user' | 'candidate';
    filename: string;
    originalFilename: string;
    mimeType: string;
    size: number;
    storageKey: string;
    storageAdapter: 'local' | 's3';
    checksum?: string;
    expiresAt?: Date;
  }): Promise<FileMetadata> {
    const id = randomUUID();
    const now = new Date();

    const result = await query<FileRow>(
      `INSERT INTO files (
        id, tenant_id, uploader_id, uploader_type, filename, original_filename,
        mime_type, size, storage_key, storage_adapter, checksum, scan_status,
        access_count, expires_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', 0, $12, $13, $14)
      RETURNING *`,
      [
        id,
        params.tenantId,
        params.uploaderId,
        params.uploaderType,
        params.filename,
        params.originalFilename,
        params.mimeType,
        params.size,
        params.storageKey,
        params.storageAdapter,
        params.checksum ?? null,
        params.expiresAt ?? null,
        now,
        now,
      ]
    );

    return rowToFileMetadata(result.rows[0]);
  }

  /**
   * Find file by ID
   */
  async findById(id: string): Promise<FileMetadata | undefined> {
    const result = await query<FileRow>(
      'SELECT * FROM files WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] ? rowToFileMetadata(result.rows[0]) : undefined;
  }

  /**
   * Find file by ID with tenant verification
   */
  async findByIdForTenant(id: string, tenantId: string): Promise<FileMetadata | undefined> {
    const result = await query<FileRow>(
      'SELECT * FROM files WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL',
      [id, tenantId]
    );
    return result.rows[0] ? rowToFileMetadata(result.rows[0]) : undefined;
  }

  /**
   * List files with filters and pagination
   */
  async list(options: FileListOptions): Promise<FileListResult> {
    const limit = Math.min(options.limit ?? 20, 100);
    const offset = options.offset ?? 0;

    const conditions: string[] = ['tenant_id = $1'];
    const params: unknown[] = [options.tenantId];
    let paramIndex = 2;

    if (!options.includeDeleted) {
      conditions.push('deleted_at IS NULL');
    }

    if (options.uploaderId) {
      conditions.push(`uploader_id = $${paramIndex}`);
      params.push(options.uploaderId);
      paramIndex++;
    }

    if (options.mimeType) {
      conditions.push(`mime_type = $${paramIndex}`);
      params.push(options.mimeType);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM files WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const result = await query<FileRow>(
      `SELECT * FROM files 
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      files: result.rows.map(rowToFileMetadata),
      total,
      limit,
      offset,
    };
  }

  /**
   * Update scan status
   */
  async updateScanStatus(
    id: string,
    status: 'pending' | 'clean' | 'infected' | 'error',
    result?: string
  ): Promise<FileMetadata | undefined> {
    const queryResult = await query<FileRow>(
      `UPDATE files SET scan_status = $1, scan_result = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, result ?? null, id]
    );
    return queryResult.rows[0] ? rowToFileMetadata(queryResult.rows[0]) : undefined;
  }

  /**
   * Increment access count
   */
  async incrementAccessCount(id: string): Promise<void> {
    await query(
      `UPDATE files SET access_count = access_count + 1, last_accessed_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  /**
   * Soft delete file
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await query(
      'UPDATE files SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Hard delete file (for cleanup)
   */
  async hardDelete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM files WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Find expired files for cleanup
   */
  async findExpired(limit: number = 100): Promise<FileMetadata[]> {
    const result = await query<FileRow>(
      `SELECT * FROM files 
       WHERE expires_at IS NOT NULL AND expires_at < NOW() AND deleted_at IS NULL
       LIMIT $1`,
      [limit]
    );
    return result.rows.map(rowToFileMetadata);
  }

  /**
   * Verify tenant ownership
   */
  async verifyTenantOwnership(id: string, tenantId: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM files WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL) as exists',
      [id, tenantId]
    );
    return result.rows[0]?.exists ?? false;
  }

  /**
   * Get total storage used by tenant
   */
  async getTenantStorageUsed(tenantId: string): Promise<number> {
    const result = await query<{ total: string }>(
      'SELECT COALESCE(SUM(size), 0) as total FROM files WHERE tenant_id = $1 AND deleted_at IS NULL',
      [tenantId]
    );
    return parseInt(result.rows[0]?.total ?? '0', 10);
  }
}

export const fileRepository = new FileRepository();
