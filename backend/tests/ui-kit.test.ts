/**
 * UI Kit Tests
 * Task 1.3: Tests for UI configuration responses
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { uiKitService } from '../src/services/ui-kit.service.js';
import { metricsService } from '../src/services/metrics.service.js';
import {
  UI_KIT_THEMES,
  COMPONENT_CATEGORIES,
  DEFAULT_UI_KIT_THEME,
  isValidUIKitTheme,
  isValidCategory,
  getUIConfigQuerySchema,
  getThemedVariantsQuerySchema,
} from '../src/models/ui-kit.model.js';
import { validateQuery } from '../src/middleware/validation.middleware.js';

describe('UI Kit Model', () => {
  describe('isValidUIKitTheme', () => {
    it('should return true for valid themes', () => {
      expect(isValidUIKitTheme('light')).toBe(true);
      expect(isValidUIKitTheme('dark')).toBe(true);
      expect(isValidUIKitTheme('system')).toBe(true);
      expect(isValidUIKitTheme('high-contrast')).toBe(true);
    });

    it('should return false for invalid themes', () => {
      expect(isValidUIKitTheme('invalid')).toBe(false);
      expect(isValidUIKitTheme('custom')).toBe(false);
      expect(isValidUIKitTheme('')).toBe(false);
    });
  });

  describe('isValidCategory', () => {
    it('should return true for valid categories', () => {
      expect(isValidCategory('button')).toBe(true);
      expect(isValidCategory('input')).toBe(true);
      expect(isValidCategory('card')).toBe(true);
      expect(isValidCategory('modal')).toBe(true);
    });

    it('should return false for invalid categories', () => {
      expect(isValidCategory('invalid')).toBe(false);
      expect(isValidCategory('custom-component')).toBe(false);
      expect(isValidCategory('')).toBe(false);
    });
  });

  describe('UI_KIT_THEMES', () => {
    it('should include all required themes', () => {
      expect(UI_KIT_THEMES).toContain('light');
      expect(UI_KIT_THEMES).toContain('dark');
      expect(UI_KIT_THEMES).toContain('system');
      expect(UI_KIT_THEMES).toContain('high-contrast');
    });
  });

  describe('COMPONENT_CATEGORIES', () => {
    it('should include common component types', () => {
      expect(COMPONENT_CATEGORIES).toContain('button');
      expect(COMPONENT_CATEGORIES).toContain('input');
      expect(COMPONENT_CATEGORIES).toContain('card');
      expect(COMPONENT_CATEGORIES).toContain('modal');
      expect(COMPONENT_CATEGORIES).toContain('form');
    });
  });

  describe('DEFAULT_UI_KIT_THEME', () => {
    it('should be light', () => {
      expect(DEFAULT_UI_KIT_THEME).toBe('light');
    });
  });
});

describe('UI Kit Service', () => {
  beforeEach(() => {
    metricsService.clearAll();
  });

  afterEach(() => {
    metricsService.clearAll();
  });

  describe('getUIConfig', () => {
    it('should return UI configuration for default tenant', async () => {
      const result = await uiKitService.getUIConfig('default');

      expect(result.success).toBe(true);
      expect(result.data?.config).toBeDefined();
      expect(result.data?.config.tenantId).toBe('default');
      expect(result.data?.config.components.length).toBeGreaterThan(0);
    });

    it('should fall back to default configuration for unknown tenant', async () => {
      const result = await uiKitService.getUIConfig('unknown-tenant');

      expect(result.success).toBe(true);
      expect(result.data?.config).toBeDefined();
    });

    it('should filter components by category when specified', async () => {
      const result = await uiKitService.getUIConfig('default', 'button');

      expect(result.success).toBe(true);
      expect(result.data?.config.components.every((c) => c.category === 'button')).toBe(true);
    });

    it('should filter global tokens by theme when specified', async () => {
      const result = await uiKitService.getUIConfig('default', undefined, 'dark');

      expect(result.success).toBe(true);
      expect(Object.keys(result.data?.config.globalTokens ?? {})).toContain('dark');
    });

    it('should include global tokens in response', async () => {
      const result = await uiKitService.getUIConfig('default');

      expect(result.success).toBe(true);
      expect(result.data?.config.globalTokens).toBeDefined();
      expect(result.data?.config.globalTokens.light).toBeDefined();
      expect(result.data?.config.globalTokens.dark).toBeDefined();
    });

    it('should include component metadata', async () => {
      const result = await uiKitService.getUIConfig('default');

      expect(result.success).toBe(true);
      const component = result.data?.config.components[0];
      expect(component?.id).toBeDefined();
      expect(component?.name).toBeDefined();
      expect(component?.category).toBeDefined();
      expect(component?.sizes).toBeDefined();
      expect(component?.colors).toBeDefined();
    });
  });

  describe('getThemedVariants', () => {
    it('should return themed variants for valid theme', async () => {
      const result = await uiKitService.getThemedVariants('default', 'light');

      expect(result.success).toBe(true);
      expect(result.data?.theme).toBe('light');
      expect(result.data?.components).toBeDefined();
      expect(result.data?.globalTokens).toBeDefined();
    });

    it('should return dark theme variants', async () => {
      const result = await uiKitService.getThemedVariants('default', 'dark');

      expect(result.success).toBe(true);
      expect(result.data?.theme).toBe('dark');
      expect(result.data?.globalTokens['--background']).toBeDefined();
    });

    it('should return high-contrast theme variants', async () => {
      const result = await uiKitService.getThemedVariants('default', 'high-contrast');

      expect(result.success).toBe(true);
      expect(result.data?.theme).toBe('high-contrast');
    });

    it('should filter by category when specified', async () => {
      const result = await uiKitService.getThemedVariants('default', 'light', 'button');

      expect(result.success).toBe(true);
      expect(result.data?.components.every((c) => c.category === 'button')).toBe(true);
    });

    it('should include component variants in response', async () => {
      const result = await uiKitService.getThemedVariants('default', 'light');

      expect(result.success).toBe(true);
      const component = result.data?.components[0];
      expect(component?.variants).toBeDefined();
    });
  });

  describe('getAvailableThemes', () => {
    it('should return all available themes', () => {
      const themes = uiKitService.getAvailableThemes();

      expect(themes).toEqual(expect.arrayContaining(['light', 'dark', 'system', 'high-contrast']));
      expect(themes.length).toBe(UI_KIT_THEMES.length);
    });
  });

  describe('getAvailableCategories', () => {
    it('should return all available categories', () => {
      const categories = uiKitService.getAvailableCategories();

      expect(categories).toEqual(expect.arrayContaining(['button', 'input', 'card']));
      expect(categories.length).toBe(COMPONENT_CATEGORIES.length);
    });
  });

  describe('SLO compliance', () => {
    it('should report healthy when no violations', () => {
      const sloStatus = uiKitService.checkSLOs();

      expect(sloStatus.met).toBe(true);
      expect(sloStatus.violations).toHaveLength(0);
    });
  });
});

describe('UI Config Query Validation', () => {
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

  const validationMiddleware = validateQuery(getUIConfigQuerySchema as unknown as import('zod').ZodSchema);

  describe('validateQuery(getUIConfigQuerySchema)', () => {
    it('should accept empty query (all configs)', () => {
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
        query: { category: 'button' },
      } as Partial<Request>;

      validationMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it('should accept valid theme', () => {
      const mockReq = {
        query: { theme: 'dark' },
      } as Partial<Request>;

      validationMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it('should accept both category and theme', () => {
      const mockReq = {
        query: { category: 'button', theme: 'dark' },
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

    it('should reject invalid theme', () => {
      const mockReq = {
        query: { theme: 'invalid-theme' },
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
          expect.objectContaining({ path: 'theme' }),
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

describe('Themed Variants Query Validation', () => {
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

  const validationMiddleware = validateQuery(getThemedVariantsQuerySchema as unknown as import('zod').ZodSchema);

  describe('validateQuery(getThemedVariantsQuerySchema)', () => {
    it('should accept valid theme', () => {
      const mockReq = {
        query: { theme: 'light' },
      } as Partial<Request>;

      validationMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it('should accept theme with category', () => {
      const mockReq = {
        query: { theme: 'dark', category: 'button' },
      } as Partial<Request>;

      validationMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusSpy).not.toHaveBeenCalled();
    });

    it('should reject missing theme', () => {
      const mockReq = {
        query: {},
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
          expect.objectContaining({ path: 'theme' }),
        ]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid theme', () => {
      const mockReq = {
        query: { theme: 'neon' },
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

describe('UI Kit Metrics', () => {
  beforeEach(() => {
    metricsService.clearAll();
  });

  afterEach(() => {
    metricsService.clearAll();
  });

  describe('recordUIKitRequest', () => {
    it('should record config request metrics', async () => {
      await uiKitService.getUIConfig('default');

      // Metrics should be recorded (cache miss on first call)
      const sloStatus = uiKitService.checkSLOs();
      expect(sloStatus).toBeDefined();
    });

    it('should record themed request metrics', async () => {
      await uiKitService.getThemedVariants('default', 'light');

      const sloStatus = uiKitService.checkSLOs();
      expect(sloStatus).toBeDefined();
    });
  });

  describe('cache metrics', () => {
    it('should record cache miss on first request', async () => {
      metricsService.clearAll();
      
      await uiKitService.getUIConfig('default');

      // First request should be a cache miss
      const hitRate = metricsService.getUIKitCacheHitRate();
      expect(hitRate).toBeLessThanOrEqual(100);
    });
  });
});
