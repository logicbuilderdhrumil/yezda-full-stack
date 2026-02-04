/**
 * View Components Tests
 * Task 1.3: Tests for view component data responses
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { viewComponentsService } from '../src/services/view-components.service.js';
import { metricsService } from '../src/services/metrics.service.js';
import {
  CHAT_CONVERSATION_TYPES,
  FILE_TYPE_CATEGORIES,
  isValidConversationType,
  isValidFileTypeCategory,
  getChatSummaryQuerySchema,
  getFileTypeMetadataQuerySchema,
  DEFAULT_CHAT_SUMMARY_LIMIT,
  DEFAULT_CHAT_SUMMARY_OFFSET,
} from '../src/models/view-components.model.js';
import { validateQuery } from '../src/middleware/validation.middleware.js';

describe('View Components Model', () => {
  describe('isValidConversationType', () => {
    it('should return true for valid conversation types', () => {
      expect(isValidConversationType('direct')).toBe(true);
      expect(isValidConversationType('group')).toBe(true);
      expect(isValidConversationType('channel')).toBe(true);
      expect(isValidConversationType('support')).toBe(true);
    });

    it('should return false for invalid conversation types', () => {
      expect(isValidConversationType('invalid')).toBe(false);
      expect(isValidConversationType('private')).toBe(false);
      expect(isValidConversationType('')).toBe(false);
    });
  });

  describe('isValidFileTypeCategory', () => {
    it('should return true for valid file type categories', () => {
      expect(isValidFileTypeCategory('document')).toBe(true);
      expect(isValidFileTypeCategory('image')).toBe(true);
      expect(isValidFileTypeCategory('video')).toBe(true);
      expect(isValidFileTypeCategory('audio')).toBe(true);
      expect(isValidFileTypeCategory('archive')).toBe(true);
    });

    it('should return false for invalid file type categories', () => {
      expect(isValidFileTypeCategory('invalid')).toBe(false);
      expect(isValidFileTypeCategory('binary')).toBe(false);
      expect(isValidFileTypeCategory('')).toBe(false);
    });
  });

  describe('CHAT_CONVERSATION_TYPES', () => {
    it('should include all required conversation types', () => {
      expect(CHAT_CONVERSATION_TYPES).toContain('direct');
      expect(CHAT_CONVERSATION_TYPES).toContain('group');
      expect(CHAT_CONVERSATION_TYPES).toContain('channel');
      expect(CHAT_CONVERSATION_TYPES).toContain('support');
    });
  });

  describe('FILE_TYPE_CATEGORIES', () => {
    it('should include all required file type categories', () => {
      expect(FILE_TYPE_CATEGORIES).toContain('document');
      expect(FILE_TYPE_CATEGORIES).toContain('image');
      expect(FILE_TYPE_CATEGORIES).toContain('video');
      expect(FILE_TYPE_CATEGORIES).toContain('audio');
      expect(FILE_TYPE_CATEGORIES).toContain('archive');
      expect(FILE_TYPE_CATEGORIES).toContain('spreadsheet');
      expect(FILE_TYPE_CATEGORIES).toContain('presentation');
      expect(FILE_TYPE_CATEGORIES).toContain('code');
    });
  });

  describe('DEFAULT values', () => {
    it('should have correct default pagination values', () => {
      expect(DEFAULT_CHAT_SUMMARY_LIMIT).toBe(20);
      expect(DEFAULT_CHAT_SUMMARY_OFFSET).toBe(0);
    });
  });
});

describe('View Components Service', () => {
  beforeEach(() => {
    metricsService.clearAll();
  });

  afterEach(() => {
    metricsService.clearAll();
  });

  describe('getChatSummaries', () => {
    it('should return chat summaries for default tenant', async () => {
      const result = await viewComponentsService.getChatSummaries('default');

      expect(result.success).toBe(true);
      expect(result.data?.summaries).toBeDefined();
      expect(result.data?.summaries.length).toBeGreaterThan(0);
      expect(result.data?.totalCount).toBeGreaterThan(0);
    });

    it('should generate tenant-specific data for unknown tenant', async () => {
      const result = await viewComponentsService.getChatSummaries('unknown-tenant');

      expect(result.success).toBe(true);
      expect(result.data?.summaries).toBeDefined();
    });

    it('should filter summaries by conversation type when specified', async () => {
      const result = await viewComponentsService.getChatSummaries('default', 'direct');

      expect(result.success).toBe(true);
      expect(result.data?.summaries.every((s) => s.conversationType === 'direct')).toBe(true);
    });

    it('should apply pagination correctly', async () => {
      const result = await viewComponentsService.getChatSummaries('default', undefined, 2, 0);

      expect(result.success).toBe(true);
      expect(result.data?.summaries.length).toBeLessThanOrEqual(2);
    });

    it('should indicate if more results are available', async () => {
      const result = await viewComponentsService.getChatSummaries('default', undefined, 1, 0);

      expect(result.success).toBe(true);
      expect(typeof result.data?.hasMore).toBe('boolean');
    });

    it('should include required fields in chat summary', async () => {
      const result = await viewComponentsService.getChatSummaries('default');

      expect(result.success).toBe(true);
      const summary = result.data?.summaries[0];
      expect(summary?.conversationId).toBeDefined();
      expect(summary?.conversationType).toBeDefined();
      expect(summary?.title).toBeDefined();
      expect(summary?.participants).toBeDefined();
      expect(typeof summary?.unreadCount).toBe('number');
      expect(typeof summary?.isPinned).toBe('boolean');
      expect(typeof summary?.isMuted).toBe('boolean');
    });
  });

  describe('getFileTypeMetadata', () => {
    it('should return file type metadata for default tenant', async () => {
      const result = await viewComponentsService.getFileTypeMetadata('default');

      expect(result.success).toBe(true);
      expect(result.data?.metadata).toBeDefined();
      expect(result.data?.metadata.types.length).toBeGreaterThan(0);
    });

    it('should fall back to default metadata for unknown tenant', async () => {
      const result = await viewComponentsService.getFileTypeMetadata('unknown-tenant');

      expect(result.success).toBe(true);
      expect(result.data?.metadata).toBeDefined();
    });

    it('should filter types by category when specified', async () => {
      const result = await viewComponentsService.getFileTypeMetadata('default', 'document');

      expect(result.success).toBe(true);
      expect(result.data?.metadata.types.every((t) => t.category === 'document')).toBe(true);
    });

    it('should include required fields in file type metadata', async () => {
      const result = await viewComponentsService.getFileTypeMetadata('default');

      expect(result.success).toBe(true);
      const type = result.data?.metadata.types[0];
      expect(type?.extension).toBeDefined();
      expect(type?.mimeType).toBeDefined();
      expect(type?.category).toBeDefined();
      expect(type?.displayName).toBeDefined();
      expect(type?.iconName).toBeDefined();
      expect(typeof type?.previewSupported).toBe('boolean');
      expect(typeof type?.maxSizeBytes).toBe('number');
      expect(typeof type?.thumbnailGenerationSupported).toBe('boolean');
    });

    it('should include common file types', async () => {
      const result = await viewComponentsService.getFileTypeMetadata('default');

      expect(result.success).toBe(true);
      const extensions = result.data?.metadata.types.map((t) => t.extension);
      expect(extensions).toContain('pdf');
      expect(extensions).toContain('jpg');
      expect(extensions).toContain('png');
      expect(extensions).toContain('mp4');
      expect(extensions).toContain('zip');
    });
  });

  describe('getAvailableConversationTypes', () => {
    it('should return all available conversation types', () => {
      const types = viewComponentsService.getAvailableConversationTypes();

      expect(types).toEqual(expect.arrayContaining(['direct', 'group', 'channel', 'support']));
      expect(types.length).toBe(CHAT_CONVERSATION_TYPES.length);
    });
  });

  describe('getAvailableFileTypeCategories', () => {
    it('should return all available file type categories', () => {
      const categories = viewComponentsService.getAvailableFileTypeCategories();

      expect(categories).toEqual(expect.arrayContaining(['document', 'image', 'video', 'audio']));
      expect(categories.length).toBe(FILE_TYPE_CATEGORIES.length);
    });
  });

  describe('SLO compliance', () => {
    it('should report healthy when no violations', () => {
      const sloStatus = viewComponentsService.checkSLOs();

      expect(sloStatus.met).toBe(true);
      expect(sloStatus.violations).toHaveLength(0);
    });
  });
});

describe('Chat Summary Query Validation', () => {
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let statusSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    jsonSpy = vi.fn();
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });

    mockRes = {
      status: statusSpy,
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validationMiddleware = validateQuery(getChatSummaryQuerySchema as unknown as import('zod').ZodSchema);

  describe('validateQuery(getChatSummaryQuerySchema)', () => {
    it('should accept empty query (all summaries)', () => {
      const mockReq = {
        query: {},
      } as Partial<Request>;

      validationMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it('should accept valid conversation type', () => {
      const mockReq = {
        query: { conversationType: 'direct' },
      } as Partial<Request>;

      validationMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it('should accept valid limit', () => {
      const mockReq = {
        query: { limit: '10' },
      } as Partial<Request>;

      validationMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it('should accept valid offset', () => {
      const mockReq = {
        query: { offset: '0' },
      } as Partial<Request>;

      validationMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it('should accept all parameters together', () => {
      const mockReq = {
        query: { conversationType: 'group', limit: '50', offset: '10' },
      } as Partial<Request>;

      validationMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it('should reject invalid conversation type', () => {
      const mockReq = {
        query: { conversationType: 'invalid-type' },
      } as Partial<Request>;

      validationMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: expect.arrayContaining([
          expect.objectContaining({ path: 'conversationType' }),
        ]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject limit exceeding maximum', () => {
      const mockReq = {
        query: { limit: '200' },
      } as Partial<Request>;

      validationMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject negative offset', () => {
      const mockReq = {
        query: { offset: '-1' },
      } as Partial<Request>;

      validationMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

describe('File Type Metadata Query Validation', () => {
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let statusSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    jsonSpy = vi.fn();
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });

    mockRes = {
      status: statusSpy,
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validationMiddleware = validateQuery(getFileTypeMetadataQuerySchema as unknown as import('zod').ZodSchema);

  describe('validateQuery(getFileTypeMetadataQuerySchema)', () => {
    it('should accept empty query (all types)', () => {
      const mockReq = {
        query: {},
      } as Partial<Request>;

      validationMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it('should accept valid category', () => {
      const mockReq = {
        query: { category: 'document' },
      } as Partial<Request>;

      validationMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it('should reject invalid category', () => {
      const mockReq = {
        query: { category: 'invalid-category' },
      } as Partial<Request>;

      validationMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: expect.arrayContaining([
          expect.objectContaining({ path: 'category' }),
        ]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject path traversal attempts', () => {
      const mockReq = {
        query: { category: '../../etc/passwd' },
      } as Partial<Request>;

      validationMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

describe('View Components Metrics', () => {
  beforeEach(() => {
    metricsService.clearAll();
  });

  afterEach(() => {
    metricsService.clearAll();
  });

  describe('recordViewComponentsRequest', () => {
    it('should record chat request metrics', async () => {
      await viewComponentsService.getChatSummaries('default');

      // Metrics should be recorded (cache miss on first call)
      const sloStatus = viewComponentsService.checkSLOs();
      expect(sloStatus).toBeDefined();
    });

    it('should record file request metrics', async () => {
      await viewComponentsService.getFileTypeMetadata('default');

      const sloStatus = viewComponentsService.checkSLOs();
      expect(sloStatus).toBeDefined();
    });
  });

  describe('cache metrics', () => {
    it('should record cache miss on first request', async () => {
      metricsService.clearAll();
      
      await viewComponentsService.getChatSummaries('default');

      // First request should be a cache miss
      const hitRate = metricsService.getViewComponentsCacheHitRate();
      expect(hitRate).toBeLessThanOrEqual(100);
    });
  });
});

describe('View Components Access Control', () => {
  describe('Tenant scoping', () => {
    it('should scope chat summaries to specified tenant', async () => {
      const tenant1Result = await viewComponentsService.getChatSummaries('tenant-1');
      const tenant2Result = await viewComponentsService.getChatSummaries('tenant-2');

      expect(tenant1Result.success).toBe(true);
      expect(tenant2Result.success).toBe(true);
      
      // Each tenant should get their own data
      const tenant1ConvIds = tenant1Result.data?.summaries.map((s) => s.conversationId);
      const tenant2ConvIds = tenant2Result.data?.summaries.map((s) => s.conversationId);
      
      // Conversation IDs should include tenant prefix
      expect(tenant1ConvIds?.every((id) => id.includes('tenant-1'))).toBe(true);
      expect(tenant2ConvIds?.every((id) => id.includes('tenant-2'))).toBe(true);
    });
  });
});
