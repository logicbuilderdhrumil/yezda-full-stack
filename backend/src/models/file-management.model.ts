/**
 * File Management Models
 * Task 1.1: Define file metadata model and storage adapter interfaces
 */

/**
 * Allowed file types for upload
 */
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
] as const;

export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];

/**
 * File size limits in bytes
 */
export const FILE_SIZE_LIMITS = {
  maxUploadSize: 10 * 1024 * 1024, // 10 MB
  minUploadSize: 1, // 1 byte minimum
} as const;

/**
 * File metadata entity
 */
export interface FileMetadata {
  id: string;
  tenantId: string;
  uploaderId: string;
  uploaderType: 'user' | 'candidate';
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  sizeFormatted: string;
  storageKey: string;
  storageAdapter: 'local' | 's3';
  checksum?: string;
  scanStatus: 'pending' | 'clean' | 'infected' | 'error';
  scanResult?: string;
  accessCount: number;
  lastAccessedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * File upload request input
 */
export interface FileUploadInput {
  tenantId: string;
  uploaderId: string;
  uploaderType: 'user' | 'candidate';
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
  expiresInDays?: number;
}

/**
 * File upload result
 */
export interface FileUploadResult {
  success: boolean;
  file?: FileMetadata;
  error?: string;
  errorCode?: string;
}

/**
 * File download result
 */
export interface FileDownloadResult {
  success: boolean;
  file?: FileMetadata;
  stream?: NodeJS.ReadableStream;
  buffer?: Buffer;
  error?: string;
  errorCode?: string;
}

/**
 * Storage adapter interface for pluggable storage backends
 */
export interface StorageAdapter {
  /**
   * Store a file and return the storage key
   */
  store(buffer: Buffer, key: string, mimeType: string): Promise<string>;

  /**
   * Retrieve a file by storage key
   */
  retrieve(key: string): Promise<Buffer | null>;

  /**
   * Create a readable stream for a file
   */
  createReadStream(key: string): Promise<NodeJS.ReadableStream | null>;

  /**
   * Delete a file by storage key
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if a file exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get the adapter name
   */
  getName(): 'local' | 's3';
}

/**
 * File list query options
 */
export interface FileListOptions {
  tenantId: string;
  uploaderId?: string;
  mimeType?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

/**
 * File list result
 */
export interface FileListResult {
  files: FileMetadata[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * File management SLO targets
 */
export const FILE_SLOS = {
  uploadLatencyP95Ms: 2000,
  downloadLatencyP95Ms: 500,
  metadataLatencyP95Ms: 100,
  availabilityPercent: 99.9,
  scanTimeP95Ms: 5000,
} as const;

/**
 * File management metrics names
 */
export const FILE_METRICS = {
  uploadCount: 'file_upload_total',
  uploadLatency: 'file_upload_latency_ms',
  uploadErrors: 'file_upload_errors_total',
  downloadCount: 'file_download_total',
  downloadLatency: 'file_download_latency_ms',
  downloadErrors: 'file_download_errors_total',
  scanCount: 'file_scan_total',
  scanLatency: 'file_scan_latency_ms',
  scanInfected: 'file_scan_infected_total',
  storageBytes: 'file_storage_bytes',
  rateLimitHits: 'file_rate_limit_hits_total',
} as const;

/**
 * Normalize file size to human-readable format
 */
export function normalizeFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  return `${size.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

/**
 * Normalize MIME type for display
 */
export function normalizeMimeType(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'image/jpeg': 'JPEG Image',
    'image/png': 'PNG Image',
    'image/gif': 'GIF Image',
    'image/webp': 'WebP Image',
    'application/pdf': 'PDF Document',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'application/vnd.ms-excel': 'Excel Spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
    'text/plain': 'Text File',
    'text/csv': 'CSV File',
  };
  return typeMap[mimeType] || mimeType;
}

/**
 * Validate file type
 */
export function isAllowedFileType(mimeType: string): boolean {
  return ALLOWED_FILE_TYPES.includes(mimeType as AllowedFileType);
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number): boolean {
  return size >= FILE_SIZE_LIMITS.minUploadSize && size <= FILE_SIZE_LIMITS.maxUploadSize;
}

/**
 * File audit event types
 */
export type FileAuditEventType =
  | 'FILE_UPLOADED'
  | 'FILE_DOWNLOADED'
  | 'FILE_DELETED'
  | 'FILE_ACCESS_DENIED'
  | 'FILE_SCAN_COMPLETED'
  | 'FILE_SCAN_FAILED'
  | 'FILE_VALIDATION_FAILED'
  | 'FILE_RATE_LIMITED';
