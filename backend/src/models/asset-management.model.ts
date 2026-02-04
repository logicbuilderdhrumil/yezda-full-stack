/**
 * Asset Management Models
 * Task 1.1: Define asset metadata model and storage strategy
 */

/** Supported asset types */
export type AssetType = 'image' | 'document' | 'template' | 'icon' | 'font' | 'video' | 'audio';

/** Asset usage context */
export type AssetUsage = 'export' | 'preview' | 'branding' | 'content' | 'ui' | 'report';

/** Asset metadata */
export interface AssetMetadata {
  id: string;
  tenantId: string;
  type: AssetType;
  usage: AssetUsage;
  name: string;
  description?: string;
  path: string;
  mimeType: string;
  size: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  version?: string;
}

/** Template asset with additional metadata */
export interface TemplateAsset extends AssetMetadata {
  type: 'template';
  templateType: 'email' | 'report' | 'form' | 'document' | 'notification';
  variables: string[];
  locale?: string;
}

/** Asset catalog entry for listing */
export interface AssetCatalogEntry {
  id: string;
  type: AssetType;
  usage: AssetUsage;
  name: string;
  path: string;
  mimeType: string;
  size: number;
  tags: string[];
  createdAt: Date;
}

/** Asset retrieval result */
export interface AssetRetrievalResult {
  asset: AssetMetadata | TemplateAsset;
  cached: boolean;
  expiresAt?: Date;
}

/** Asset operation result */
export interface AssetOperationResult<T = unknown> {
  success: boolean;
  error?: string;
  errorCode?: string;
  data?: T;
}

/** Asset query filters */
export interface AssetQueryFilters {
  type?: AssetType;
  usage?: AssetUsage;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

/** Asset audit event types */
export type AssetEventType =
  | 'ASSET_ACCESSED'
  | 'ASSET_CATALOG_ACCESSED'
  | 'ASSET_TEMPLATE_ACCESSED'
  | 'ASSET_ACCESS_DENIED'
  | 'ASSET_CREATED'
  | 'ASSET_UPDATED'
  | 'ASSET_DELETED';

/** Rate limit configuration for asset operations */
export interface AssetRateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

/** SLO targets for asset operations */
export const ASSET_SLOS = {
  // Latency SLOs
  READ_LATENCY_P99_MS: 100,
  CATALOG_LATENCY_P99_MS: 150,
  TEMPLATE_LATENCY_P99_MS: 75,

  // Availability SLOs
  READ_SUCCESS_RATE: 99.9,
  CATALOG_SUCCESS_RATE: 99.5,

  // Rate limits
  DEFAULT_RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  DEFAULT_READ_RATE_LIMIT_MAX_REQUESTS: 200, // 200 reads per minute
  DEFAULT_CATALOG_RATE_LIMIT_MAX_REQUESTS: 60, // 60 catalog queries per minute

  // Cache TTL
  ASSET_CACHE_TTL_MS: 300000, // 5 minutes
  CATALOG_CACHE_TTL_MS: 60000, // 1 minute
  TEMPLATE_CACHE_TTL_MS: 600000, // 10 minutes
} as const;

/** Supported asset types for validation */
export const SUPPORTED_ASSET_TYPES: AssetType[] = [
  'image',
  'document',
  'template',
  'icon',
  'font',
  'video',
  'audio',
];

/** Supported asset usages for validation */
export const SUPPORTED_ASSET_USAGES: AssetUsage[] = [
  'export',
  'preview',
  'branding',
  'content',
  'ui',
  'report',
];

/** Template types for validation */
export const SUPPORTED_TEMPLATE_TYPES = [
  'email',
  'report',
  'form',
  'document',
  'notification',
] as const;

export type TemplateType = (typeof SUPPORTED_TEMPLATE_TYPES)[number];
