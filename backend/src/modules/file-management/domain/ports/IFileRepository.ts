/**
 * File repository port — defines persistence contract for file metadata
 */
import type {
  FileMetadata,
  FileListOptions,
  FileListResult,
} from '../entities/index.js';

export interface IFileRepository {
  create(params: {
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
  }): Promise<FileMetadata>;

  findById(id: string): Promise<FileMetadata | undefined>;

  findByIdForTenant(id: string, tenantId: string): Promise<FileMetadata | undefined>;

  list(options: FileListOptions): Promise<FileListResult>;

  updateScanStatus(
    id: string,
    status: 'pending' | 'clean' | 'infected' | 'error',
    result?: string,
  ): Promise<FileMetadata | undefined>;

  incrementAccessCount(id: string): Promise<void>;

  softDelete(id: string): Promise<boolean>;

  hardDelete(id: string): Promise<boolean>;

  findExpired(limit?: number): Promise<FileMetadata[]>;

  verifyTenantOwnership(id: string, tenantId: string): Promise<boolean>;

  getTenantStorageUsed(tenantId: string): Promise<number>;
}
