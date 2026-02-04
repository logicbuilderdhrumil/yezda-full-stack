/**
 * File Management Configuration
 * Task 1.1: Storage adapter configuration for file persistence
 */

export interface FileStorageConfig {
  /** Active storage adapter */
  adapter: 'local' | 's3';

  /** Local storage settings */
  local: {
    basePath: string;
  };

  /** S3-compatible storage settings */
  s3: {
    endpoint?: string;
    region: string;
    bucket: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    forcePathStyle?: boolean;
  };

  /** Upload constraints */
  upload: {
    maxFileSizeBytes: number;
    allowedMimeTypes: string[];
  };

  /** Security settings */
  security: {
    enableMalwareScanning: boolean;
    scanEndpoint?: string;
    scanApiKey?: string;
  };

  /** Rate limiting */
  rateLimit: {
    windowMs: number;
    maxUploads: number;
    maxDownloads: number;
    maxMetadataRequests: number;
  };

  /** Caching */
  cache: {
    metadataTtlSeconds: number;
    enableEtag: boolean;
  };

  /** Retention */
  retention: {
    defaultExpirationDays?: number;
    maxExpirationDays: number;
  };
}

function getEnvOrDefaultLocal(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function getEnvIntOrDefaultLocal(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function getEnvBoolOrDefault(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

export const fileStorageConfig: FileStorageConfig = {
  adapter: (getEnvOrDefaultLocal('FILE_STORAGE_ADAPTER', 'local') as 'local' | 's3'),

  local: {
    basePath: getEnvOrDefaultLocal('FILE_STORAGE_LOCAL_PATH', './uploads'),
  },

  s3: {
    endpoint: process.env.FILE_STORAGE_S3_ENDPOINT,
    region: getEnvOrDefaultLocal('FILE_STORAGE_S3_REGION', 'us-east-1'),
    bucket: getEnvOrDefaultLocal('FILE_STORAGE_S3_BUCKET', 'yezda-files'),
    accessKeyId: process.env.FILE_STORAGE_S3_ACCESS_KEY,
    secretAccessKey: process.env.FILE_STORAGE_S3_SECRET_KEY,
    forcePathStyle: getEnvBoolOrDefault('FILE_STORAGE_S3_FORCE_PATH_STYLE', false),
  },

  upload: {
    maxFileSizeBytes: getEnvIntOrDefaultLocal('FILE_MAX_SIZE_BYTES', 10 * 1024 * 1024), // 10 MB
    allowedMimeTypes: (process.env.FILE_ALLOWED_MIME_TYPES?.split(',') || [
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
    ]),
  },

  security: {
    enableMalwareScanning: getEnvBoolOrDefault('FILE_ENABLE_MALWARE_SCAN', false),
    scanEndpoint: process.env.FILE_MALWARE_SCAN_ENDPOINT,
    scanApiKey: process.env.FILE_MALWARE_SCAN_API_KEY,
  },

  rateLimit: {
    windowMs: getEnvIntOrDefaultLocal('FILE_RATE_LIMIT_WINDOW_MS', 60000), // 1 minute
    maxUploads: getEnvIntOrDefaultLocal('FILE_RATE_LIMIT_MAX_UPLOADS', 10),
    maxDownloads: getEnvIntOrDefaultLocal('FILE_RATE_LIMIT_MAX_DOWNLOADS', 100),
    maxMetadataRequests: getEnvIntOrDefaultLocal('FILE_RATE_LIMIT_MAX_METADATA', 200),
  },

  cache: {
    metadataTtlSeconds: getEnvIntOrDefaultLocal('FILE_CACHE_METADATA_TTL_SECONDS', 300), // 5 minutes
    enableEtag: getEnvBoolOrDefault('FILE_CACHE_ENABLE_ETAG', true),
  },

  retention: {
    defaultExpirationDays: process.env.FILE_DEFAULT_EXPIRATION_DAYS
      ? parseInt(process.env.FILE_DEFAULT_EXPIRATION_DAYS, 10)
      : undefined,
    maxExpirationDays: getEnvIntOrDefaultLocal('FILE_MAX_EXPIRATION_DAYS', 365),
  },
};

export default fileStorageConfig;
