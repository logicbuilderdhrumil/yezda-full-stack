/**
 * Asset Management Domain Entities
 * Migrated from legacy asset-management.model.ts
 */

export type AssetType = 'image' | 'document' | 'template' | 'icon' | 'font' | 'video' | 'audio';
export type AssetUsage = 'export' | 'preview' | 'branding' | 'content' | 'ui' | 'report';
export type TemplateType = 'email' | 'report' | 'form' | 'document' | 'notification';

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

export interface TemplateAsset extends AssetMetadata {
  type: 'template';
  templateType: TemplateType;
  variables: string[];
  locale?: string;
}

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

export interface AssetQueryFilters {
  type?: AssetType;
  usage?: AssetUsage;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

export const ASSET_SLOS = {
  READ_LATENCY_P99_MS: 100,
  CATALOG_LATENCY_P99_MS: 150,
  TEMPLATE_LATENCY_P99_MS: 75,
  READ_SUCCESS_RATE: 99.9,
  CATALOG_SUCCESS_RATE: 99.5,
  DEFAULT_RATE_LIMIT_WINDOW_MS: 60000,
  DEFAULT_READ_RATE_LIMIT_MAX_REQUESTS: 200,
  DEFAULT_CATALOG_RATE_LIMIT_MAX_REQUESTS: 60,
  ASSET_CACHE_TTL_MS: 300000,
  CATALOG_CACHE_TTL_MS: 60000,
  TEMPLATE_CACHE_TTL_MS: 600000,
} as const;

export const SUPPORTED_ASSET_TYPES: AssetType[] = ['image', 'document', 'template', 'icon', 'font', 'video', 'audio'];
export const SUPPORTED_ASSET_USAGES: AssetUsage[] = ['export', 'preview', 'branding', 'content', 'ui', 'report'];
export const SUPPORTED_TEMPLATE_TYPES: readonly TemplateType[] = ['email', 'report', 'form', 'document', 'notification'];

export type AssetEventType =
  | 'ASSET_ACCESSED'
  | 'ASSET_CATALOG_ACCESSED'
  | 'ASSET_TEMPLATE_ACCESSED'
  | 'ASSET_ACCESS_DENIED'
  | 'ASSET_CREATED'
  | 'ASSET_UPDATED'
  | 'ASSET_DELETED';

export function toCatalogEntry(asset: AssetMetadata): AssetCatalogEntry {
  return {
    id: asset.id,
    type: asset.type,
    usage: asset.usage,
    name: asset.name,
    path: asset.path,
    mimeType: asset.mimeType,
    size: asset.size,
    tags: asset.tags,
    createdAt: asset.createdAt,
  };
}

export interface RequestContext {
  userId: string;
  userType: 'user' | 'candidate';
  tenantId: string;
  ipAddress?: string;
  channel?: 'web' | 'mobile' | 'api';
}

export type OperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };
