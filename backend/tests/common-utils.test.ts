/**
 * Pagination and List Utilities Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  paginationSchema,
  searchSchema,
  sortSchema,
  listQuerySchema,
  buildPaginationMeta,
  buildListResponse,
  calculateOffset,
  createListResponse,
  parseListQuery,
  createListQuerySchema,
  createListError,
  zodToListError,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MAX_PAGE_NUMBER,
  MAX_SEARCH_LENGTH,
  ListErrorCodes,
} from '../src/utils/pagination.util.js';
import {
  startListTelemetry,
  withListTelemetry,
  setTelemetryCollector,
  resetTelemetryCollector,
  ListSLO,
  meetsP95LatencySLO,
  meetsP99LatencySLO,
  calculateErrorRate,
  meetsErrorRateSLO,
  type TelemetryCollector,
  type ListTelemetryEvent,
} from '../src/utils/list-telemetry.util.js';
import { z } from 'zod';

// ============================================================================
// Pagination Schema Tests
// ============================================================================

describe('paginationSchema', () => {
  it('uses defaults when no params provided', () => {
    const result = paginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.size).toBe(DEFAULT_PAGE_SIZE);
  });

  it('parses valid page and size', () => {
    const result = paginationSchema.parse({ page: '5', size: '25' });
    expect(result.page).toBe(5);
    expect(result.size).toBe(25);
  });

  it('coerces invalid page to 1', () => {
    const result = paginationSchema.parse({ page: 'invalid', size: '10' });
    expect(result.page).toBe(1);
  });

  it('coerces negative page to 1', () => {
    const result = paginationSchema.parse({ page: '-5', size: '10' });
    expect(result.page).toBe(1);
  });

  it('coerces zero page to 1', () => {
    const result = paginationSchema.parse({ page: '0', size: '10' });
    expect(result.page).toBe(1);
  });

  it('coerces invalid size to default', () => {
    const result = paginationSchema.parse({ page: '1', size: 'abc' });
    expect(result.size).toBe(DEFAULT_PAGE_SIZE);
  });

  it('rejects page number exceeding maximum', () => {
    const result = paginationSchema.safeParse({ page: String(MAX_PAGE_NUMBER + 1) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain(`Page number cannot exceed ${MAX_PAGE_NUMBER}`);
    }
  });

  it('rejects page size exceeding maximum', () => {
    const result = paginationSchema.safeParse({ size: String(MAX_PAGE_SIZE + 1) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain(`Page size cannot exceed ${MAX_PAGE_SIZE}`);
    }
  });
});

// ============================================================================
// Search Schema Tests
// ============================================================================

describe('searchSchema', () => {
  it('allows empty search query', () => {
    const result = searchSchema.parse({});
    expect(result.q).toBeUndefined();
  });

  it('parses valid search query', () => {
    const result = searchSchema.parse({ q: 'test query' });
    expect(result.q).toBe('test query');
  });

  it('trims whitespace from search query', () => {
    const result = searchSchema.parse({ q: '  search term  ' });
    expect(result.q).toBe('search term');
  });

  it('converts empty string to undefined', () => {
    const result = searchSchema.parse({ q: '   ' });
    expect(result.q).toBeUndefined();
  });

  it('rejects search query exceeding maximum length', () => {
    const longQuery = 'a'.repeat(MAX_SEARCH_LENGTH + 1);
    const result = searchSchema.safeParse({ q: longQuery });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Sort Schema Tests
// ============================================================================

describe('sortSchema', () => {
  it('defaults sortOrder to asc', () => {
    const result = sortSchema.parse({});
    expect(result.sortOrder).toBe('asc');
  });

  it('parses valid sort parameters', () => {
    const result = sortSchema.parse({ sortBy: 'createdAt', sortOrder: 'desc' });
    expect(result.sortBy).toBe('createdAt');
    expect(result.sortOrder).toBe('desc');
  });

  it('rejects invalid sort order', () => {
    const result = sortSchema.safeParse({ sortOrder: 'invalid' });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Combined List Query Schema Tests
// ============================================================================

describe('listQuerySchema', () => {
  it('parses combined parameters', () => {
    const result = listQuerySchema.parse({
      page: '2',
      size: '50',
      q: 'search term',
      sortBy: 'name',
      sortOrder: 'desc',
    });

    expect(result.page).toBe(2);
    expect(result.size).toBe(50);
    expect(result.q).toBe('search term');
    expect(result.sortBy).toBe('name');
    expect(result.sortOrder).toBe('desc');
  });
});

// ============================================================================
// Pagination Meta Tests
// ============================================================================

describe('buildPaginationMeta', () => {
  it('calculates correct metadata for first page', () => {
    const meta = buildPaginationMeta(1, 20, 100);

    expect(meta.page).toBe(1);
    expect(meta.size).toBe(20);
    expect(meta.total).toBe(100);
    expect(meta.totalPages).toBe(5);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrev).toBe(false);
  });

  it('calculates correct metadata for middle page', () => {
    const meta = buildPaginationMeta(3, 20, 100);

    expect(meta.page).toBe(3);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrev).toBe(true);
  });

  it('calculates correct metadata for last page', () => {
    const meta = buildPaginationMeta(5, 20, 100);

    expect(meta.page).toBe(5);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(true);
  });

  it('handles empty results', () => {
    const meta = buildPaginationMeta(1, 20, 0);

    expect(meta.totalPages).toBe(1);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(false);
  });

  it('clamps page to totalPages when page exceeds total', () => {
    const meta = buildPaginationMeta(10, 20, 50);

    expect(meta.page).toBe(3); // 50/20 = 2.5, ceil = 3
    expect(meta.hasNext).toBe(false);
  });
});

// ============================================================================
// Response Building Tests
// ============================================================================

describe('buildListResponse', () => {
  it('creates correct response envelope', () => {
    const items = [{ id: 1 }, { id: 2 }];
    const pagination = buildPaginationMeta(1, 10, 2);
    const response = buildListResponse(items, pagination);

    expect(response.items).toEqual(items);
    expect(response.pagination).toEqual(pagination);
  });
});

describe('createListResponse', () => {
  it('creates response from items and params', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const response = createListResponse(items, 25, { page: 1, size: 10 });

    expect(response.items).toEqual(items);
    expect(response.pagination.total).toBe(25);
    expect(response.pagination.page).toBe(1);
    expect(response.pagination.size).toBe(10);
  });
});

describe('calculateOffset', () => {
  it('calculates correct offset for page 1', () => {
    expect(calculateOffset(1, 20)).toBe(0);
  });

  it('calculates correct offset for page 2', () => {
    expect(calculateOffset(2, 20)).toBe(20);
  });

  it('calculates correct offset for page 5', () => {
    expect(calculateOffset(5, 10)).toBe(40);
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('createListError', () => {
  it('creates validation error with details', () => {
    const error = createListError('Validation failed', 'VALIDATION_ERROR', [
      { path: 'page', message: 'Invalid page number' },
    ]);

    expect(error.error).toBe('Validation failed');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details).toHaveLength(1);
  });

  it('sanitizes internal error message', () => {
    const error = createListError('Database connection failed: ECONNREFUSED', 'INTERNAL_ERROR');

    expect(error.error).toBe('An unexpected error occurred');
    expect(error.code).toBe('INTERNAL_ERROR');
  });
});

describe('zodToListError', () => {
  it('converts Zod error to list error format', () => {
    const schema = z.object({ page: z.number() });
    const result = schema.safeParse({ page: 'invalid' });

    if (!result.success) {
      const listError = zodToListError(result.error);

      expect(listError.code).toBe('VALIDATION_ERROR');
      expect(listError.error).toBe('Validation failed');
      expect(listError.details).toBeDefined();
    }
  });
});

describe('parseListQuery', () => {
  it('returns validated params for valid input', () => {
    const result = parseListQuery({ page: '1', size: '20' });

    expect(result.page).toBe(1);
    expect(result.size).toBe(20);
  });

  it('throws ListErrorResponse for invalid input', () => {
    expect(() => parseListQuery({ page: String(MAX_PAGE_NUMBER + 1) })).toThrow();
  });
});

// ============================================================================
// Custom Schema Tests
// ============================================================================

describe('createListQuerySchema', () => {
  it('creates schema with allowed sort fields', () => {
    const schema = createListQuerySchema(['name', 'createdAt', 'email'] as const);

    const valid = schema.safeParse({ sortBy: 'name', page: '1' });
    expect(valid.success).toBe(true);

    const invalid = schema.safeParse({ sortBy: 'invalidField' });
    expect(invalid.success).toBe(false);
  });
});

// ============================================================================
// Telemetry Tests
// ============================================================================

describe('List Telemetry', () => {
  let capturedEvents: ListTelemetryEvent[];
  let mockCollector: TelemetryCollector;

  beforeEach(() => {
    capturedEvents = [];
    mockCollector = {
      emit: (event: ListTelemetryEvent) => capturedEvents.push(event),
    };
    setTelemetryCollector(mockCollector);
  });

  afterEach(() => {
    resetTelemetryCollector();
  });

  describe('startListTelemetry', () => {
    it('tracks successful operations', () => {
      const telemetry = startListTelemetry('list_users');
      telemetry.success(10, 100);

      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0].operation).toBe('list_users');
      expect(capturedEvents[0].success).toBe(true);
      expect(capturedEvents[0].resultCount).toBe(10);
      expect(capturedEvents[0].totalCount).toBe(100);
      expect(capturedEvents[0].durationMs).toBeGreaterThanOrEqual(0);
    });

    it('tracks failed operations', () => {
      const telemetry = startListTelemetry('list_orders');
      telemetry.failure('DB_ERROR');

      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0].success).toBe(false);
      expect(capturedEvents[0].errorCode).toBe('DB_ERROR');
    });

    it('includes metadata', () => {
      const telemetry = startListTelemetry('search_products', { userId: '123' });
      telemetry.success(5);

      expect(capturedEvents[0].metadata).toEqual({ userId: '123' });
    });

    it('tracks current duration', async () => {
      const telemetry = startListTelemetry('slow_query');
      await new Promise((resolve) => setTimeout(resolve, 10));

      const duration = telemetry.getCurrentDurationMs();
      expect(duration).toBeGreaterThan(0);
    });
  });

  describe('withListTelemetry', () => {
    it('wraps async function with telemetry', async () => {
      const listFn = async () => ({ items: [1, 2, 3], pagination: { total: 10 } });
      const wrapped = withListTelemetry('wrapped_list', listFn);

      const result = await wrapped({});

      expect(result.items).toEqual([1, 2, 3]);
      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0].success).toBe(true);
      expect(capturedEvents[0].resultCount).toBe(3);
      expect(capturedEvents[0].totalCount).toBe(10);
    });

    it('tracks failures in wrapped function', async () => {
      const error = new Error('Test error');
      (error as Error & { code: string }).code = 'TEST_ERROR';

      const failingFn = async (): Promise<{ items: unknown[]; pagination?: { total?: number } }> => {
        throw error;
      };
      const wrapped = withListTelemetry('failing_list', failingFn);

      await expect(wrapped({})).rejects.toThrow('Test error');

      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0].success).toBe(false);
      expect(capturedEvents[0].errorCode).toBe('TEST_ERROR');
    });
  });
});

// ============================================================================
// SLO Helper Tests
// ============================================================================

describe('SLO Helpers', () => {
  describe('meetsP95LatencySLO', () => {
    it('returns true for durations under target', () => {
      expect(meetsP95LatencySLO(ListSLO.P95_LATENCY_MS - 1)).toBe(true);
    });

    it('returns true for durations at target', () => {
      expect(meetsP95LatencySLO(ListSLO.P95_LATENCY_MS)).toBe(true);
    });

    it('returns false for durations over target', () => {
      expect(meetsP95LatencySLO(ListSLO.P95_LATENCY_MS + 1)).toBe(false);
    });
  });

  describe('meetsP99LatencySLO', () => {
    it('returns true for durations under target', () => {
      expect(meetsP99LatencySLO(ListSLO.P99_LATENCY_MS - 1)).toBe(true);
    });

    it('returns false for durations over target', () => {
      expect(meetsP99LatencySLO(ListSLO.P99_LATENCY_MS + 1)).toBe(false);
    });
  });

  describe('calculateErrorRate', () => {
    it('returns 0 for no requests', () => {
      expect(calculateErrorRate(0, 0)).toBe(0);
    });

    it('calculates correct rate', () => {
      expect(calculateErrorRate(99, 1)).toBe(1);
      expect(calculateErrorRate(900, 100)).toBe(10);
    });
  });

  describe('meetsErrorRateSLO', () => {
    it('returns true when error rate is below target', () => {
      expect(meetsErrorRateSLO(10000, 5)).toBe(true); // 0.05%
    });

    it('returns false when error rate is above target', () => {
      expect(meetsErrorRateSLO(100, 5)).toBe(false); // 4.76%
    });
  });
});

// Import afterEach
import { afterEach } from 'vitest';
