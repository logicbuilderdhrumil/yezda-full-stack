/**
 * Shared Widgets Tests
 * Task 1.4: Tests for widget data consistency and access control
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { sharedWidgetsService } from '../src/services/shared-widgets.service.js';
import { sharedWidgetsMetricsService } from '../src/services/shared-widgets-metrics.service.js';
import {
  AVAILABLE_WIDGETS,
  WIDGET_METADATA,
  isValidWidgetId,
  getWidgetMetadata,
  tableDataQuerySchema,
  visualizationDataQuerySchema,
} from '../src/models/shared-widgets.model.js';
import { validateQuery, validateParams } from '../src/middleware/validation.middleware.js';
import { z } from 'zod';

describe('Shared Widgets Model', () => {
  describe('isValidWidgetId', () => {
    it('should return true for valid widget IDs', () => {
      expect(isValidWidgetId('candidates-overview-table')).toBe(true);
      expect(isValidWidgetId('screening-pipeline-chart')).toBe(true);
      expect(isValidWidgetId('status-distribution-pie')).toBe(true);
    });

    it('should return false for invalid widget IDs', () => {
      expect(isValidWidgetId('invalid-widget')).toBe(false);
      expect(isValidWidgetId('')).toBe(false);
      expect(isValidWidgetId('custom-widget')).toBe(false);
    });
  });

  describe('getWidgetMetadata', () => {
    it('should return correct metadata for table widgets', () => {
      const meta = getWidgetMetadata('candidates-overview-table');
      expect(meta.type).toBe('table');
      expect(meta.category).toBe('operational');
    });

    it('should return correct metadata for chart widgets', () => {
      const meta = getWidgetMetadata('screening-pipeline-chart');
      expect(meta.type).toBe('line');
      expect(meta.category).toBe('analytics');
    });

    it('should return correct metadata for pie widgets', () => {
      const meta = getWidgetMetadata('status-distribution-pie');
      expect(meta.type).toBe('pie');
      expect(meta.category).toBe('reporting');
    });
  });

  describe('AVAILABLE_WIDGETS', () => {
    it('should include table widgets', () => {
      expect(AVAILABLE_WIDGETS).toContain('candidates-overview-table');
      expect(AVAILABLE_WIDGETS).toContain('screenings-status-table');
      expect(AVAILABLE_WIDGETS).toContain('recent-applications-table');
      expect(AVAILABLE_WIDGETS).toContain('compliance-checks-table');
    });

    it('should include visualization widgets', () => {
      expect(AVAILABLE_WIDGETS).toContain('screening-pipeline-chart');
      expect(AVAILABLE_WIDGETS).toContain('completion-trends-chart');
      expect(AVAILABLE_WIDGETS).toContain('status-distribution-pie');
      expect(AVAILABLE_WIDGETS).toContain('monthly-volume-bar');
    });
  });

  describe('WIDGET_METADATA', () => {
    it('should have metadata for all available widgets', () => {
      for (const widgetId of AVAILABLE_WIDGETS) {
        expect(WIDGET_METADATA[widgetId]).toBeDefined();
        expect(WIDGET_METADATA[widgetId].type).toBeDefined();
        expect(WIDGET_METADATA[widgetId].category).toBeDefined();
      }
    });
  });
});

describe('Shared Widgets Service', () => {
  beforeEach(() => {
    sharedWidgetsMetricsService.clearAll();
    sharedWidgetsService.clearCache();
  });

  afterEach(() => {
    sharedWidgetsMetricsService.clearAll();
    sharedWidgetsService.clearCache();
  });

  describe('getTableData', () => {
    it('should return table data for valid table widget', async () => {
      const result = await sharedWidgetsService.getTableData('default', 'candidates-overview-table');

      expect(result.success).toBe(true);
      expect(result.data?.widgetId).toBe('candidates-overview-table');
      expect(result.data?.widgetType).toBe('table');
      expect(result.data?.columns).toBeDefined();
      expect(result.data?.columns.length).toBeGreaterThan(0);
      expect(result.data?.rows).toBeDefined();
      expect(result.data?.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const page1 = await sharedWidgetsService.getTableData('default', 'candidates-overview-table', { page: 1, pageSize: 10 });
      const page2 = await sharedWidgetsService.getTableData('default', 'candidates-overview-table', { page: 2, pageSize: 10 });

      expect(page1.success).toBe(true);
      expect(page2.success).toBe(true);
      expect(page1.data?.pagination.page).toBe(1);
      expect(page2.data?.pagination.page).toBe(2);
      expect(page1.data?.rows[0]).not.toEqual(page2.data?.rows[0]);
    });

    it('should include pagination metadata', async () => {
      const result = await sharedWidgetsService.getTableData('default', 'candidates-overview-table', { page: 1, pageSize: 10 });

      expect(result.data?.pagination.page).toBe(1);
      expect(result.data?.pagination.pageSize).toBe(10);
      expect(result.data?.pagination.totalItems).toBeGreaterThan(0);
      expect(result.data?.pagination.totalPages).toBeGreaterThan(0);
      expect(typeof result.data?.pagination.hasNextPage).toBe('boolean');
      expect(typeof result.data?.pagination.hasPreviousPage).toBe('boolean');
    });

    it('should support sorting', async () => {
      const ascResult = await sharedWidgetsService.getTableData('default', 'candidates-overview-table', {
        sortColumn: 'name',
        sortDirection: 'asc',
      });
      const descResult = await sharedWidgetsService.getTableData('default', 'candidates-overview-table', {
        sortColumn: 'name',
        sortDirection: 'desc',
      });

      expect(ascResult.success).toBe(true);
      expect(descResult.success).toBe(true);
      expect(ascResult.data?.sort?.column).toBe('name');
      expect(ascResult.data?.sort?.direction).toBe('asc');
      expect(descResult.data?.sort?.direction).toBe('desc');
    });

    it('should return error for invalid widget ID', async () => {
      // @ts-expect-error Testing invalid input
      const result = await sharedWidgetsService.getTableData('default', 'invalid-widget');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_WIDGET');
    });

    it('should return error for visualization widget', async () => {
      const result = await sharedWidgetsService.getTableData('default', 'screening-pipeline-chart');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_WIDGET_TYPE');
    });

    it('should cache results', async () => {
      const first = await sharedWidgetsService.getTableData('default', 'candidates-overview-table');
      const second = await sharedWidgetsService.getTableData('default', 'candidates-overview-table');

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      expect(first.cached).toBe(false);
      expect(second.cached).toBe(true);
    });

    it('should include column metadata', async () => {
      const result = await sharedWidgetsService.getTableData('default', 'candidates-overview-table');

      expect(result.data?.columns[0].id).toBeDefined();
      expect(result.data?.columns[0].label).toBeDefined();
      expect(result.data?.columns[0].type).toBeDefined();
      expect(typeof result.data?.columns[0].sortable).toBe('boolean');
      expect(typeof result.data?.columns[0].filterable).toBe('boolean');
    });
  });

  describe('getVisualizationData', () => {
    it('should return visualization data for valid chart widget', async () => {
      const result = await sharedWidgetsService.getVisualizationData('default', 'screening-pipeline-chart');

      expect(result.success).toBe(true);
      expect(result.data?.widgetId).toBe('screening-pipeline-chart');
      expect(result.data?.widgetType).toBe('line');
      expect(result.data?.series).toBeDefined();
      expect(result.data?.series.length).toBeGreaterThan(0);
    });

    it('should return pie chart data', async () => {
      const result = await sharedWidgetsService.getVisualizationData('default', 'status-distribution-pie');

      expect(result.success).toBe(true);
      expect(result.data?.widgetType).toBe('pie');
      expect(result.data?.series[0].data.length).toBeGreaterThan(0);
    });

    it('should return bar chart data', async () => {
      const result = await sharedWidgetsService.getVisualizationData('default', 'monthly-volume-bar');

      expect(result.success).toBe(true);
      expect(result.data?.widgetType).toBe('bar');
    });

    it('should support time range parameters', async () => {
      const result = await sharedWidgetsService.getVisualizationData('default', 'screening-pipeline-chart', {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        granularity: 'day',
      });

      expect(result.success).toBe(true);
      expect(result.data?.timeRange).toBeDefined();
      expect(result.data?.timeRange?.granularity).toBe('day');
    });

    it('should return error for table widget', async () => {
      const result = await sharedWidgetsService.getVisualizationData('default', 'candidates-overview-table');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_WIDGET_TYPE');
    });

    it('should include aggregated metrics when available', async () => {
      const result = await sharedWidgetsService.getVisualizationData('default', 'turnaround-metrics-chart');

      expect(result.success).toBe(true);
      expect(result.data?.metrics).toBeDefined();
      expect(result.data?.metrics?.length).toBeGreaterThan(0);
    });

    it('should cache results', async () => {
      const first = await sharedWidgetsService.getVisualizationData('default', 'screening-pipeline-chart');
      const second = await sharedWidgetsService.getVisualizationData('default', 'screening-pipeline-chart');

      expect(first.cached).toBe(false);
      expect(second.cached).toBe(true);
    });

    it('should include series metadata', async () => {
      const result = await sharedWidgetsService.getVisualizationData('default', 'screening-pipeline-chart');

      expect(result.data?.series[0].id).toBeDefined();
      expect(result.data?.series[0].name).toBeDefined();
      expect(result.data?.series[0].data).toBeDefined();
    });
  });

  describe('validateTenantAccess', () => {
    it('should allow access for matching tenant', () => {
      const result = sharedWidgetsService.validateTenantAccess(
        'tenant-1',
        'tenant-1',
        'candidates-overview-table',
        'user-1',
        'user'
      );

      expect(result.allowed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should deny access for mismatched tenant', () => {
      const result = sharedWidgetsService.validateTenantAccess(
        'tenant-1',
        'tenant-2',
        'candidates-overview-table',
        'user-1',
        'user'
      );

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getAvailableWidgets', () => {
    it('should return all available widgets with metadata', () => {
      const widgets = sharedWidgetsService.getAvailableWidgets();

      expect(widgets.length).toBe(AVAILABLE_WIDGETS.length);
      expect(widgets[0].id).toBeDefined();
      expect(widgets[0].type).toBeDefined();
      expect(widgets[0].category).toBeDefined();
    });
  });

  describe('SLO compliance', () => {
    it('should report healthy when no requests made', () => {
      const sloStatus = sharedWidgetsService.checkSLOs();

      expect(sloStatus.met).toBe(true);
      expect(sloStatus.violations).toHaveLength(0);
    });

    it('should track availability after successful requests', async () => {
      await sharedWidgetsService.getTableData('default', 'candidates-overview-table');
      const sloStatus = sharedWidgetsService.checkSLOs();

      expect(sloStatus.availability).toBe(100);
    });
  });
});

describe('Shared Widgets Metrics Service', () => {
  beforeEach(() => {
    sharedWidgetsMetricsService.clearAll();
  });

  afterEach(() => {
    sharedWidgetsMetricsService.clearAll();
  });

  describe('recordSuccess', () => {
    it('should record successful requests', () => {
      sharedWidgetsMetricsService.recordSuccess(100, false);
      const metrics = sharedWidgetsMetricsService.getMetrics();

      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.failedRequests).toBe(0);
    });

    it('should track cache hits', () => {
      sharedWidgetsMetricsService.recordSuccess(50, true);
      const metrics = sharedWidgetsMetricsService.getMetrics();

      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(0);
    });

    it('should track cache misses', () => {
      sharedWidgetsMetricsService.recordSuccess(100, false);
      const metrics = sharedWidgetsMetricsService.getMetrics();

      expect(metrics.cacheHits).toBe(0);
      expect(metrics.cacheMisses).toBe(1);
    });
  });

  describe('recordFailure', () => {
    it('should record failed requests', () => {
      sharedWidgetsMetricsService.recordFailure(200);
      const metrics = sharedWidgetsMetricsService.getMetrics();

      expect(metrics.totalRequests).toBe(1);
      expect(metrics.failedRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(0);
    });
  });

  describe('recordThrottled', () => {
    it('should record throttled requests', () => {
      sharedWidgetsMetricsService.recordThrottled();
      const metrics = sharedWidgetsMetricsService.getMetrics();

      expect(metrics.throttledRequests).toBe(1);
    });
  });

  describe('checkSLOs', () => {
    it('should report violations when availability is low', () => {
      // Simulate 50% failure rate
      sharedWidgetsMetricsService.recordSuccess(100, false);
      sharedWidgetsMetricsService.recordFailure(100);

      const sloStatus = sharedWidgetsMetricsService.checkSLOs();

      expect(sloStatus.met).toBe(false);
      expect(sloStatus.violations.length).toBeGreaterThan(0);
      expect(sloStatus.availability).toBe(50);
    });

    it('should report violations when cache hit rate is low', () => {
      // All cache misses
      for (let i = 0; i < 10; i++) {
        sharedWidgetsMetricsService.recordSuccess(100, false);
      }

      const sloStatus = sharedWidgetsMetricsService.checkSLOs();

      expect(sloStatus.cacheHitRate).toBe(0);
      expect(sloStatus.violations.some((v) => v.includes('Cache hit rate'))).toBe(true);
    });

    it('should pass when all SLOs are met', () => {
      // Record successful cached requests
      for (let i = 0; i < 10; i++) {
        sharedWidgetsMetricsService.recordSuccess(50, true);
      }

      const sloStatus = sharedWidgetsMetricsService.checkSLOs();

      expect(sloStatus.met).toBe(true);
      expect(sloStatus.violations).toHaveLength(0);
    });
  });

  describe('getSLOConfig', () => {
    it('should return SLO configuration', () => {
      const config = sharedWidgetsMetricsService.getSLOConfig();

      expect(config.availabilityTarget).toBeDefined();
      expect(config.latencyP95Target).toBeDefined();
      expect(config.errorRateTarget).toBeDefined();
      expect(config.cacheHitRateTarget).toBeDefined();
    });
  });
});

describe('Table Data Query Validation', () => {
  describe('tableDataQuerySchema', () => {
    it('should accept valid pagination params', () => {
      const result = tableDataQuerySchema.safeParse({
        widgetId: 'candidates-overview-table',
        page: 1,
        pageSize: 20,
      });

      expect(result.success).toBe(true);
    });

    it('should accept valid sort params', () => {
      const result = tableDataQuerySchema.safeParse({
        widgetId: 'candidates-overview-table',
        sortColumn: 'name',
        sortDirection: 'asc',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid widget ID', () => {
      const result = tableDataQuerySchema.safeParse({
        widgetId: 'invalid-widget',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid page number', () => {
      const result = tableDataQuerySchema.safeParse({
        widgetId: 'candidates-overview-table',
        page: 0,
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid page size', () => {
      const result = tableDataQuerySchema.safeParse({
        widgetId: 'candidates-overview-table',
        pageSize: 200,
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid sort direction', () => {
      const result = tableDataQuerySchema.safeParse({
        widgetId: 'candidates-overview-table',
        sortDirection: 'invalid',
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('Visualization Data Query Validation', () => {
  describe('visualizationDataQuerySchema', () => {
    it('should accept valid widget ID', () => {
      const result = visualizationDataQuerySchema.safeParse({
        widgetId: 'screening-pipeline-chart',
      });

      expect(result.success).toBe(true);
    });

    it('should accept valid time range params', () => {
      const result = visualizationDataQuerySchema.safeParse({
        widgetId: 'screening-pipeline-chart',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z',
        granularity: 'day',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid granularity', () => {
      const result = visualizationDataQuerySchema.safeParse({
        widgetId: 'screening-pipeline-chart',
        granularity: 'invalid',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const result = visualizationDataQuerySchema.safeParse({
        widgetId: 'screening-pipeline-chart',
        startDate: 'not-a-date',
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('Widget Param Validation Middleware', () => {
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

  const widgetIdSchema = z.object({
    widgetId: z.enum(AVAILABLE_WIDGETS),
  });

  const validationMiddleware = validateParams(widgetIdSchema);

  it('should accept valid widget ID param', () => {
    const mockReq = {
      params: { widgetId: 'candidates-overview-table' },
    } as Partial<Request>;

    validationMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(statusSpy).not.toHaveBeenCalled();
  });

  it('should reject invalid widget ID param', () => {
    const mockReq = {
      params: { widgetId: 'invalid-widget' },
    } as Partial<Request>;

    validationMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: expect.arrayContaining([
        expect.objectContaining({ path: 'widgetId' }),
      ]),
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe('Widget Query Validation Middleware', () => {
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

  const tableQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    sortColumn: z.string().max(50).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
  });

  const validationMiddleware = validateQuery(tableQuerySchema);

  it('should accept empty query', () => {
    const mockReq = {
      query: {},
    } as Partial<Request>;

    validationMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should accept valid pagination', () => {
    const mockReq = {
      query: { page: '2', pageSize: '25' },
    } as Partial<Request>;

    validationMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should reject invalid page size', () => {
    const mockReq = {
      query: { pageSize: '200' },
    } as Partial<Request>;

    validationMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(400);
  });
});
