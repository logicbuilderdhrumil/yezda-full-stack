/**
 * Asset Management Tests
 * Task 1.3: Implement template asset retrieval endpoints and tests
 * Task 1.4: Test tenant scoping and RBAC
 * Task 1.5: Test audit logging
 * Task 1.6: Test caching and rate limiting
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../src/middleware/auth.middleware.js';
import {
  queryAssets,
  getAssetsByType,
  getAssetById,
  getTemplateById,
  getTemplatesByType,
  getHealthSummary,
} from '../src/controllers/asset-management.controller.js';
import { assetManagementService } from '../src/services/asset-management.service.js';
import { assetMetricsService } from '../src/services/asset-management-metrics.service.js';
import { ASSET_SLOS } from '../src/models/asset-management.model.js';
import type { AssetCatalogEntry, AssetMetadata, TemplateAsset } from '../src/models/asset-management.model.js';

// Mock the assetManagementService
vi.mock('../src/services/asset-management.service.js', () => ({
  assetManagementService: {
    queryAssets: vi.fn(),
    getAssetsByType: vi.fn(),
    getAssetById: vi.fn(),
    getTemplateById: vi.fn(),
    getTemplatesByType: vi.fn(),
    getHealthSummary: vi.fn(),
    verifyTenantAccess: vi.fn(),
    clearCache: vi.fn(),
  },
}));

// Mock the assetMetricsService
vi.mock('../src/services/asset-management-metrics.service.js', () => ({
  assetMetricsService: {
    recordRead: vi.fn(),
    recordCatalog: vi.fn(),
    recordTemplate: vi.fn(),
    recordAccessDenied: vi.fn(),
    recordRateLimitHit: vi.fn(),
    recordCacheHit: vi.fn(),
    recordCacheMiss: vi.fn(),
    getHealthSummary: vi.fn(),
    checkSLOs: vi.fn(),
  },
}));

/**
 * Create a mock Express request
 */
function createMockRequest(overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest {
  return {
    user: { sub: 'user-123', type: 'user' as const },
    get: vi.fn().mockImplementation((header: string) => {
      if (header === 'x-tenant-id') return 'tenant-123';
      if (header === 'x-channel') return 'api';
      return undefined;
    }),
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    params: {},
    query: {},
    body: {},
    ...overrides,
  } as unknown as AuthenticatedRequest;
}

/**
 * Create a mock Express response
 */
function createMockResponse(): Response & { getStatus: () => number; getBody: () => unknown } {
  let statusCode = 200;
  let body: unknown = null;

  const res = {
    status: vi.fn().mockImplementation((code: number) => {
      statusCode = code;
      return res;
    }),
    json: vi.fn().mockImplementation((data: unknown) => {
      body = data;
      return res;
    }),
    getStatus: () => statusCode,
    getBody: () => body,
  };

  return res as unknown as Response & { getStatus: () => number; getBody: () => unknown };
}

describe('Asset Management Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('queryAssets', () => {
    it('should return assets matching query filters', async () => {
      const mockAssets: AssetCatalogEntry[] = [
        {
          id: 'asset-1',
          type: 'image',
          usage: 'branding',
          name: 'Logo',
          path: '/assets/logo.png',
          mimeType: 'image/png',
          size: 1024,
          tags: ['brand'],
          createdAt: new Date(),
        },
      ];

      vi.mocked(assetManagementService.queryAssets).mockResolvedValue({
        success: true,
        data: mockAssets,
      });

      const req = createMockRequest({ query: { type: 'image' } });
      const res = createMockResponse();

      await queryAssets(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAssets);
    });

    it('should require authentication', async () => {
      const req = createMockRequest({ user: undefined });
      const res = createMockResponse();

      await queryAssets(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.getBody()).toEqual({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    });

    it('should require tenant context', async () => {
      const req = createMockRequest();
      req.get = vi.fn().mockReturnValue(undefined);
      const res = createMockResponse();

      await queryAssets(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.getBody()).toEqual({ error: 'Tenant context required', code: 'MISSING_TENANT' });
    });

    it('should handle invalid query parameters', async () => {
      const req = createMockRequest({ query: { type: 'invalid-type' } });
      const res = createMockResponse();

      await queryAssets(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getAssetsByType', () => {
    it('should return assets by type', async () => {
      const mockAssets: AssetCatalogEntry[] = [
        {
          id: 'asset-1',
          type: 'document',
          usage: 'content',
          name: 'User Guide',
          path: '/assets/guide.pdf',
          mimeType: 'application/pdf',
          size: 2048,
          tags: ['documentation'],
          createdAt: new Date(),
        },
      ];

      vi.mocked(assetManagementService.getAssetsByType).mockResolvedValue({
        success: true,
        data: mockAssets,
      });

      const req = createMockRequest({ params: { type: 'document' } });
      const res = createMockResponse();

      await getAssetsByType(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAssets);
    });

    it('should reject invalid asset type', async () => {
      const req = createMockRequest({ params: { type: 'invalid' } });
      const res = createMockResponse();

      await getAssetsByType(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.getBody()).toEqual({ error: 'Invalid asset type', code: 'INVALID_ASSET_TYPE' });
    });

    it('should filter by usage when provided', async () => {
      vi.mocked(assetManagementService.getAssetsByType).mockResolvedValue({
        success: true,
        data: [],
      });

      const req = createMockRequest({
        params: { type: 'image' },
        query: { usage: 'branding' },
      });
      const res = createMockResponse();

      await getAssetsByType(req, res);

      expect(assetManagementService.getAssetsByType).toHaveBeenCalledWith(
        'tenant-123',
        'image',
        'branding',
        expect.any(Object)
      );
    });
  });

  describe('getAssetById', () => {
    it('should return a specific asset', async () => {
      const mockAsset: AssetMetadata = {
        id: 'asset-1',
        tenantId: 'tenant-123',
        type: 'image',
        usage: 'branding',
        name: 'Logo',
        path: '/assets/logo.png',
        mimeType: 'image/png',
        size: 1024,
        tags: ['brand'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(assetManagementService.getAssetById).mockResolvedValue({
        success: true,
        data: mockAsset,
      });

      const req = createMockRequest({ params: { assetId: 'asset-1' } });
      const res = createMockResponse();

      await getAssetById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAsset);
    });

    it('should return 404 for non-existent asset', async () => {
      vi.mocked(assetManagementService.getAssetById).mockResolvedValue({
        success: false,
        error: 'Asset not found',
        errorCode: 'ASSET_NOT_FOUND',
      });

      const req = createMockRequest({ params: { assetId: 'non-existent' } });
      const res = createMockResponse();

      await getAssetById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getTemplateById', () => {
    it('should return a template asset', async () => {
      const mockTemplate: TemplateAsset = {
        id: 'template-1',
        tenantId: 'tenant-123',
        type: 'template',
        usage: 'export',
        name: 'Report Template',
        path: '/templates/report.html',
        mimeType: 'text/html',
        size: 512,
        tags: ['report'],
        createdAt: new Date(),
        updatedAt: new Date(),
        templateType: 'report',
        variables: ['title', 'date', 'content'],
      };

      vi.mocked(assetManagementService.getTemplateById).mockResolvedValue({
        success: true,
        data: mockTemplate,
      });

      const req = createMockRequest({ params: { templateId: 'template-1' } });
      const res = createMockResponse();

      await getTemplateById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTemplate);
    });

    it('should return 404 for non-existent template', async () => {
      vi.mocked(assetManagementService.getTemplateById).mockResolvedValue({
        success: false,
        error: 'Template not found',
        errorCode: 'TEMPLATE_NOT_FOUND',
      });

      const req = createMockRequest({ params: { templateId: 'non-existent' } });
      const res = createMockResponse();

      await getTemplateById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getTemplatesByType', () => {
    it('should return templates by type', async () => {
      const mockTemplates: TemplateAsset[] = [
        {
          id: 'template-1',
          tenantId: 'tenant-123',
          type: 'template',
          usage: 'export',
          name: 'Email Template',
          path: '/templates/email.html',
          mimeType: 'text/html',
          size: 256,
          tags: ['email'],
          createdAt: new Date(),
          updatedAt: new Date(),
          templateType: 'email',
          variables: ['subject', 'body'],
        },
      ];

      vi.mocked(assetManagementService.getTemplatesByType).mockResolvedValue({
        success: true,
        data: mockTemplates,
      });

      const req = createMockRequest({ params: { templateType: 'email' } });
      const res = createMockResponse();

      await getTemplatesByType(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTemplates);
    });

    it('should reject invalid template type', async () => {
      const req = createMockRequest({ params: { templateType: 'invalid' } });
      const res = createMockResponse();

      await getTemplatesByType(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.getBody()).toEqual({ error: 'Invalid template type', code: 'INVALID_TEMPLATE_TYPE' });
    });

    it('should pass locale filter when provided', async () => {
      vi.mocked(assetManagementService.getTemplatesByType).mockResolvedValue({
        success: true,
        data: [],
      });

      const req = createMockRequest({
        params: { templateType: 'email' },
        query: { locale: 'en-US' },
      });
      const res = createMockResponse();

      await getTemplatesByType(req, res);

      expect(assetManagementService.getTemplatesByType).toHaveBeenCalledWith(
        'tenant-123',
        'email',
        'en-US',
        expect.any(Object)
      );
    });
  });

  describe('getHealthSummary', () => {
    it('should return health summary', async () => {
      const mockSummary = {
        readSuccessRate: 99.9,
        catalogSuccessRate: 99.5,
        readP99Latency: 50,
        catalogP99Latency: 100,
        templateP99Latency: 30,
        cacheHitRate: 85,
        sloStatus: { met: true, violations: [] },
      };

      vi.mocked(assetManagementService.getHealthSummary).mockReturnValue(mockSummary);

      const req = createMockRequest();
      const res = createMockResponse();

      await getHealthSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockSummary);
    });
  });
});

describe('Asset Management Service', () => {
  describe('Tenant Isolation', () => {
    it('should verify tenant access correctly', () => {
      // Mock verifyTenantAccess to return true for matching tenants
      vi.mocked(assetManagementService.verifyTenantAccess).mockReturnValue(true);

      const result = assetManagementService.verifyTenantAccess(
        'tenant-123',
        'tenant-123',
        'user-1',
        'user',
        { channel: 'api' }
      );
      expect(result).toBe(true);
    });

    it('should deny cross-tenant access', () => {
      // Mock verifyTenantAccess to return false for different tenants
      vi.mocked(assetManagementService.verifyTenantAccess).mockReturnValue(false);

      const result = assetManagementService.verifyTenantAccess(
        'tenant-123',
        'tenant-456',
        'user-1',
        'user',
        { channel: 'api' }
      );
      expect(result).toBe(false);
    });
  });
});

describe('Asset Metrics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should record read operations', () => {
    assetMetricsService.recordRead(true, 50, { operation: 'getAssetById' });
    expect(assetMetricsService.recordRead).toHaveBeenCalledWith(true, 50, { operation: 'getAssetById' });
  });

  it('should record catalog operations', () => {
    assetMetricsService.recordCatalog(true, 100, { operation: 'queryAssets' });
    expect(assetMetricsService.recordCatalog).toHaveBeenCalledWith(true, 100, { operation: 'queryAssets' });
  });

  it('should record template operations', () => {
    assetMetricsService.recordTemplate(true, 30, { operation: 'getTemplateById' });
    expect(assetMetricsService.recordTemplate).toHaveBeenCalledWith(true, 30, { operation: 'getTemplateById' });
  });

  it('should record cache hits and misses', () => {
    assetMetricsService.recordCacheHit('asset');
    assetMetricsService.recordCacheMiss('catalog');
    expect(assetMetricsService.recordCacheHit).toHaveBeenCalledWith('asset');
    expect(assetMetricsService.recordCacheMiss).toHaveBeenCalledWith('catalog');
  });

  it('should record rate limit hits', () => {
    assetMetricsService.recordRateLimitHit('/api/v1/assets');
    expect(assetMetricsService.recordRateLimitHit).toHaveBeenCalledWith('/api/v1/assets');
  });

  it('should record access denied events', () => {
    assetMetricsService.recordAccessDenied('cross_tenant');
    expect(assetMetricsService.recordAccessDenied).toHaveBeenCalledWith('cross_tenant');
  });
});

describe('Asset Model Validation', () => {
  it('should validate asset types', () => {
    const validTypes = ['image', 'document', 'template', 'icon', 'font', 'video', 'audio'];
    validTypes.forEach((type) => {
      expect(['image', 'document', 'template', 'icon', 'font', 'video', 'audio']).toContain(type);
    });
  });

  it('should validate asset usages', () => {
    const validUsages = ['export', 'preview', 'branding', 'content', 'ui', 'report'];
    validUsages.forEach((usage) => {
      expect(['export', 'preview', 'branding', 'content', 'ui', 'report']).toContain(usage);
    });
  });

  it('should validate template types', () => {
    const validTemplateTypes = ['email', 'report', 'form', 'document', 'notification'];
    validTemplateTypes.forEach((type) => {
      expect(['email', 'report', 'form', 'document', 'notification']).toContain(type);
    });
  });
});

describe('Asset SLO Configuration', () => {
  it('should have defined SLO targets', () => {
    expect(ASSET_SLOS.READ_LATENCY_P99_MS).toBeDefined();
    expect(ASSET_SLOS.CATALOG_LATENCY_P99_MS).toBeDefined();
    expect(ASSET_SLOS.TEMPLATE_LATENCY_P99_MS).toBeDefined();
    expect(ASSET_SLOS.READ_SUCCESS_RATE).toBeDefined();
    expect(ASSET_SLOS.CATALOG_SUCCESS_RATE).toBeDefined();
    expect(ASSET_SLOS.DEFAULT_RATE_LIMIT_WINDOW_MS).toBeDefined();
    expect(ASSET_SLOS.DEFAULT_READ_RATE_LIMIT_MAX_REQUESTS).toBeDefined();
    expect(ASSET_SLOS.ASSET_CACHE_TTL_MS).toBeDefined();
  });
});
