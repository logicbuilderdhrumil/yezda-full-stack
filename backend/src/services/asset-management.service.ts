/**
 * Asset Management Service
 * Task 1.2: Implement asset catalog retrieval endpoints
 * Task 1.3: Implement template asset retrieval endpoints
 * Task 1.4: Enforce tenant scoping and RBAC for asset access
 * Task 1.5: Add audit logging for asset access and updates
 * Task 1.6: Add caching for asset endpoints
 * Task 1.7: Add metrics for SLO monitoring
 */

import { assetManagementRepository } from '../repositories/asset-management.repository.js';
import { auditService } from './audit.service.js';
import { assetMetricsService } from './asset-management-metrics.service.js';
import {
  ASSET_SLOS,
  type AssetMetadata,
  type TemplateAsset,
  type AssetType,
  type AssetUsage,
  type AssetQueryFilters,
  type AssetOperationResult,
  type AssetCatalogEntry,
  type AssetEventType,
  type TemplateType,
} from '../models/asset-management.model.js';

/** In-memory cache for assets */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const assetCache = new Map<string, CacheEntry<AssetMetadata | null>>();
const catalogCache = new Map<string, CacheEntry<AssetCatalogEntry[]>>();
const templateCache = new Map<string, CacheEntry<TemplateAsset | null>>();

/**
 * Generate cache key for asset
 */
function getAssetCacheKey(tenantId: string, assetId: string): string {
  return `asset:${tenantId}:${assetId}`;
}

/**
 * Generate cache key for catalog
 */
function getCatalogCacheKey(tenantId: string, type?: AssetType, usage?: AssetUsage): string {
  return `catalog:${tenantId}:${type ?? 'all'}:${usage ?? 'all'}`;
}

/**
 * Generate cache key for template
 */
function getTemplateCacheKey(tenantId: string, assetId: string): string {
  return `template:${tenantId}:${assetId}`;
}

/**
 * Convert AssetMetadata to AssetCatalogEntry
 */
function toCatalogEntry(asset: AssetMetadata): AssetCatalogEntry {
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

export class AssetManagementService {
  /**
   * Get assets by type
   * Task 1.2: Asset catalog retrieval
   */
  async getAssetsByType(
    tenantId: string,
    type: AssetType,
    usage: AssetUsage | undefined,
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api'; userId?: string; userType?: 'user' | 'candidate' }
  ): Promise<AssetOperationResult<AssetCatalogEntry[]>> {
    const start = Date.now();
    const cacheKey = getCatalogCacheKey(tenantId, type, usage);

    try {
      // Check cache first
      const cached = catalogCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        assetMetricsService.recordCacheHit('catalog');

        this.logAssetAccess('ASSET_CATALOG_ACCESSED', {
          tenantId,
          userId: requestContext.userId,
          userType: requestContext.userType,
          success: true,
          metadata: { type, usage, cached: true, count: cached.data.length },
          ...requestContext,
        });

        assetMetricsService.recordCatalog(true, Date.now() - start, { operation: 'getAssetsByType' });

        return { success: true, data: cached.data };
      }

      assetMetricsService.recordCacheMiss('catalog');

      // Fetch from repository
      const assets = await assetManagementRepository.findByType(tenantId, type, usage);
      const catalogEntries = assets.map(toCatalogEntry);

      // Update cache
      catalogCache.set(cacheKey, {
        data: catalogEntries,
        expiresAt: Date.now() + ASSET_SLOS.CATALOG_CACHE_TTL_MS,
      });

      this.logAssetAccess('ASSET_CATALOG_ACCESSED', {
        tenantId,
        userId: requestContext.userId,
        userType: requestContext.userType,
        success: true,
        metadata: { type, usage, cached: false, count: catalogEntries.length },
        ...requestContext,
      });

      assetMetricsService.recordCatalog(true, Date.now() - start, { operation: 'getAssetsByType' });

      return { success: true, data: catalogEntries };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logAssetAccess('ASSET_CATALOG_ACCESSED', {
        tenantId,
        userId: requestContext.userId,
        userType: requestContext.userType,
        success: false,
        errorMessage,
        metadata: { type, usage },
        ...requestContext,
      });

      assetMetricsService.recordCatalog(false, Date.now() - start, { operation: 'getAssetsByType' });

      return { success: false, error: 'Failed to retrieve assets', errorCode: 'ASSET_READ_ERROR' };
    }
  }

  /**
   * Get assets by query filters
   * Task 1.2: Asset catalog retrieval with filtering
   */
  async queryAssets(
    tenantId: string,
    filters: AssetQueryFilters,
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api'; userId?: string; userType?: 'user' | 'candidate' }
  ): Promise<AssetOperationResult<AssetCatalogEntry[]>> {
    const start = Date.now();

    try {
      const assets = await assetManagementRepository.findByFilters(tenantId, filters);
      const catalogEntries = assets.map(toCatalogEntry);

      this.logAssetAccess('ASSET_CATALOG_ACCESSED', {
        tenantId,
        userId: requestContext.userId,
        userType: requestContext.userType,
        success: true,
        metadata: { filters, count: catalogEntries.length },
        ...requestContext,
      });

      assetMetricsService.recordCatalog(true, Date.now() - start, { operation: 'queryAssets' });

      return { success: true, data: catalogEntries };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logAssetAccess('ASSET_CATALOG_ACCESSED', {
        tenantId,
        userId: requestContext.userId,
        userType: requestContext.userType,
        success: false,
        errorMessage,
        metadata: { filters },
        ...requestContext,
      });

      assetMetricsService.recordCatalog(false, Date.now() - start, { operation: 'queryAssets' });

      return { success: false, error: 'Failed to query assets', errorCode: 'ASSET_READ_ERROR' };
    }
  }

  /**
   * Get a specific asset by ID
   * Task 1.2: Asset retrieval with caching
   */
  async getAssetById(
    tenantId: string,
    assetId: string,
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api'; userId?: string; userType?: 'user' | 'candidate' }
  ): Promise<AssetOperationResult<AssetMetadata>> {
    const start = Date.now();
    const cacheKey = getAssetCacheKey(tenantId, assetId);

    try {
      // Check cache first
      const cached = assetCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        assetMetricsService.recordCacheHit('asset');

        if (!cached.data) {
          assetMetricsService.recordRead(false, Date.now() - start, { operation: 'getAssetById' });
          return { success: false, error: 'Asset not found', errorCode: 'ASSET_NOT_FOUND' };
        }

        this.logAssetAccess('ASSET_ACCESSED', {
          tenantId,
          userId: requestContext.userId,
          userType: requestContext.userType,
          success: true,
          metadata: { assetId, cached: true },
          ...requestContext,
        });

        assetMetricsService.recordRead(true, Date.now() - start, { operation: 'getAssetById' });

        return { success: true, data: cached.data };
      }

      assetMetricsService.recordCacheMiss('asset');

      // Fetch from repository
      const asset = await assetManagementRepository.findById(tenantId, assetId);

      // Update cache
      assetCache.set(cacheKey, {
        data: asset,
        expiresAt: Date.now() + ASSET_SLOS.ASSET_CACHE_TTL_MS,
      });

      if (!asset) {
        assetMetricsService.recordRead(false, Date.now() - start, { operation: 'getAssetById' });
        return { success: false, error: 'Asset not found', errorCode: 'ASSET_NOT_FOUND' };
      }

      this.logAssetAccess('ASSET_ACCESSED', {
        tenantId,
        userId: requestContext.userId,
        userType: requestContext.userType,
        success: true,
        metadata: { assetId, cached: false },
        ...requestContext,
      });

      assetMetricsService.recordRead(true, Date.now() - start, { operation: 'getAssetById' });

      return { success: true, data: asset };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logAssetAccess('ASSET_ACCESSED', {
        tenantId,
        userId: requestContext.userId,
        userType: requestContext.userType,
        success: false,
        errorMessage,
        metadata: { assetId },
        ...requestContext,
      });

      assetMetricsService.recordRead(false, Date.now() - start, { operation: 'getAssetById' });

      return { success: false, error: 'Failed to retrieve asset', errorCode: 'ASSET_READ_ERROR' };
    }
  }

  /**
   * Get a template asset by ID
   * Task 1.3: Template asset retrieval
   */
  async getTemplateById(
    tenantId: string,
    assetId: string,
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api'; userId?: string; userType?: 'user' | 'candidate' }
  ): Promise<AssetOperationResult<TemplateAsset>> {
    const start = Date.now();
    const cacheKey = getTemplateCacheKey(tenantId, assetId);

    try {
      // Check cache first
      const cached = templateCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        assetMetricsService.recordCacheHit('template');

        if (!cached.data) {
          assetMetricsService.recordTemplate(false, Date.now() - start, { operation: 'getTemplateById' });
          return { success: false, error: 'Template not found', errorCode: 'TEMPLATE_NOT_FOUND' };
        }

        this.logAssetAccess('ASSET_TEMPLATE_ACCESSED', {
          tenantId,
          userId: requestContext.userId,
          userType: requestContext.userType,
          success: true,
          metadata: { assetId, templateType: cached.data.templateType, cached: true },
          ...requestContext,
        });

        assetMetricsService.recordTemplate(true, Date.now() - start, { operation: 'getTemplateById' });

        return { success: true, data: cached.data };
      }

      assetMetricsService.recordCacheMiss('template');

      // Fetch from repository
      const template = await assetManagementRepository.findTemplateById(tenantId, assetId);

      // Update cache
      templateCache.set(cacheKey, {
        data: template,
        expiresAt: Date.now() + ASSET_SLOS.TEMPLATE_CACHE_TTL_MS,
      });

      if (!template) {
        assetMetricsService.recordTemplate(false, Date.now() - start, { operation: 'getTemplateById' });
        return { success: false, error: 'Template not found', errorCode: 'TEMPLATE_NOT_FOUND' };
      }

      this.logAssetAccess('ASSET_TEMPLATE_ACCESSED', {
        tenantId,
        userId: requestContext.userId,
        userType: requestContext.userType,
        success: true,
        metadata: { assetId, templateType: template.templateType, cached: false },
        ...requestContext,
      });

      assetMetricsService.recordTemplate(true, Date.now() - start, { operation: 'getTemplateById' });

      return { success: true, data: template };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logAssetAccess('ASSET_TEMPLATE_ACCESSED', {
        tenantId,
        userId: requestContext.userId,
        userType: requestContext.userType,
        success: false,
        errorMessage,
        metadata: { assetId },
        ...requestContext,
      });

      assetMetricsService.recordTemplate(false, Date.now() - start, { operation: 'getTemplateById' });

      return { success: false, error: 'Failed to retrieve template', errorCode: 'ASSET_READ_ERROR' };
    }
  }

  /**
   * Get templates by type
   * Task 1.3: Template asset retrieval
   */
  async getTemplatesByType(
    tenantId: string,
    templateType: TemplateType,
    locale: string | undefined,
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api'; userId?: string; userType?: 'user' | 'candidate' }
  ): Promise<AssetOperationResult<TemplateAsset[]>> {
    const start = Date.now();

    try {
      const templates = await assetManagementRepository.findTemplatesByType(tenantId, templateType, locale);

      this.logAssetAccess('ASSET_TEMPLATE_ACCESSED', {
        tenantId,
        userId: requestContext.userId,
        userType: requestContext.userType,
        success: true,
        metadata: { templateType, locale, count: templates.length },
        ...requestContext,
      });

      assetMetricsService.recordTemplate(true, Date.now() - start, { operation: 'getTemplatesByType' });

      return { success: true, data: templates };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logAssetAccess('ASSET_TEMPLATE_ACCESSED', {
        tenantId,
        userId: requestContext.userId,
        userType: requestContext.userType,
        success: false,
        errorMessage,
        metadata: { templateType, locale },
        ...requestContext,
      });

      assetMetricsService.recordTemplate(false, Date.now() - start, { operation: 'getTemplatesByType' });

      return { success: false, error: 'Failed to retrieve templates', errorCode: 'ASSET_READ_ERROR' };
    }
  }

  /**
   * Verify tenant access and log denied access
   * Task 1.4: Tenant isolation enforcement
   */
  verifyTenantAccess(
    requestTenantId: string,
    targetTenantId: string,
    userId: string | undefined,
    userType: 'user' | 'candidate' | undefined,
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api' }
  ): boolean {
    if (requestTenantId !== targetTenantId) {
      this.logAssetAccess('ASSET_ACCESS_DENIED', {
        tenantId: targetTenantId,
        userId,
        userType,
        success: false,
        errorMessage: `Tenant ${requestTenantId} attempted to access tenant ${targetTenantId} assets`,
        ...requestContext,
      });

      assetMetricsService.recordAccessDenied('cross_tenant');
      return false;
    }
    return true;
  }

  /**
   * Invalidate cache for a specific asset
   */
  invalidateAssetCache(tenantId: string, assetId: string): void {
    const assetCacheKey = getAssetCacheKey(tenantId, assetId);
    const templateCacheKey = getTemplateCacheKey(tenantId, assetId);
    assetCache.delete(assetCacheKey);
    templateCache.delete(templateCacheKey);
  }

  /**
   * Invalidate all catalog caches for a tenant
   */
  invalidateCatalogCache(tenantId: string): void {
    for (const key of catalogCache.keys()) {
      if (key.startsWith(`catalog:${tenantId}:`)) {
        catalogCache.delete(key);
      }
    }
  }

  /**
   * Log asset access for audit trail
   * Task 1.5: Audit logging
   */
  private logAssetAccess(
    eventType: AssetEventType,
    params: {
      tenantId?: string;
      userId?: string;
      userType?: 'user' | 'candidate';
      success: boolean;
      errorMessage?: string;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
      channel: 'web' | 'mobile' | 'api';
    }
  ): void {
    // Map asset events to existing audit event types
    const auditEventType = params.success ? 'SHELL_CONFIG_ACCESSED' : 'AUTH_ANOMALY_DETECTED';

    auditService.log({
      eventType: auditEventType,
      actorId: params.userId,
      actorType: params.userType,
      channel: params.channel,
      ipAddress: params.ipAddress,
      metadata: {
        assetEventType: eventType,
        tenantId: params.tenantId,
        ...params.metadata,
      },
      success: params.success,
      errorMessage: params.errorMessage,
    });
  }

  /**
   * Get health summary for monitoring
   */
  getHealthSummary() {
    return assetMetricsService.getHealthSummary();
  }

  /**
   * Clear all caches (for testing)
   */
  clearCache(): void {
    assetCache.clear();
    catalogCache.clear();
    templateCache.clear();
  }
}

export const assetManagementService = new AssetManagementService();
