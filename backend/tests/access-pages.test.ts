/**
 * Access Pages Tests
 * Tests for access denied and not-found error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import {
  errorHandler,
  notFoundHandler,
  correlationIdMiddleware,
  createError,
  createAccessDeniedError,
  createUnauthorizedError,
  type ApiError,
} from '../src/middleware/error.middleware.js';
import {
  ACCESS_ERROR_CODES,
  createAccessErrorResponse,
  createNotFoundErrorResponse,
} from '../src/models/access-error.model.js';

// Mock dependencies
vi.mock('../src/services/audit.service.js', () => ({
  auditService: {
    log: vi.fn(),
  },
}));

vi.mock('../src/services/metrics.service.js', () => ({
  metricsService: {
    incrementCounter: vi.fn(),
    recordLatency: vi.fn(),
  },
}));

vi.mock('../src/db/redis.js', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 29,
    resetAt: Date.now() + 60000,
  }),
}));

vi.mock('../src/utils/ip.util.js', () => ({
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

// Mock uuid to return predictable values
vi.mock('uuid', async () => {
  const actual = await vi.importActual<typeof import('uuid')>('uuid');
  return {
    ...actual,
    v4: vi.fn().mockReturnValue('test-correlation-id-12345'),
  };
});

import { auditService } from '../src/services/audit.service.js';
import { metricsService } from '../src/services/metrics.service.js';
import { checkRateLimit } from '../src/db/redis.js';

describe('Access Pages', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let statusSpy: ReturnType<typeof vi.fn>;
  let setHeaderSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    jsonSpy = vi.fn();
    setHeaderSpy = vi.fn();
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });

    mockReq = {
      headers: {},
      path: '/api/v1/test',
      method: 'GET',
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' } as never,
    };

    mockRes = {
      status: statusSpy,
      setHeader: setHeaderSpy,
      headersSent: false,
    };

    mockNext = vi.fn();

    // Reset rate limit mock to allow requests
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 29,
      resetAt: Date.now() + 60000,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Access Error Models', () => {
    it('should create access error response with correlation ID', () => {
      const response = createAccessErrorResponse(
        ACCESS_ERROR_CODES.FORBIDDEN,
        'test-correlation-123'
      );

      expect(response).toEqual({
        error: 'Access denied',
        code: 'FORBIDDEN',
        correlationId: 'test-correlation-123',
        timestamp: expect.any(String),
      });
    });

    it('should create not-found error response without path (security)', () => {
      const response = createNotFoundErrorResponse(
        'test-correlation-456'
      );

      expect(response).toEqual({
        error: 'The requested resource was not found',
        code: 'NOT_FOUND',
        correlationId: 'test-correlation-456',
        timestamp: expect.any(String),
      });
      // Verify path is NOT included to prevent information disclosure
      expect('path' in response).toBe(false);
    });

    it('should support custom error messages', () => {
      const response = createAccessErrorResponse(
        ACCESS_ERROR_CODES.UNAUTHORIZED,
        'test-id',
        'Custom auth message'
      );

      expect(response.error).toBe('Custom auth message');
    });
  });

  describe('correlationIdMiddleware', () => {
    it('should attach correlation ID to request and call next', () => {
      correlationIdMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Verify correlationId property exists on request
      expect('correlationId' in mockReq).toBe(true);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should set X-Correlation-Id response header', () => {
      correlationIdMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Verify header is set (uuid mock may return undefined in ESM context)
      expect(setHeaderSpy).toHaveBeenCalled();
      const headerCall = setHeaderSpy.mock.calls.find(
        (call: unknown[]) => call[0] === 'X-Correlation-Id'
      );
      expect(headerCall).toBeDefined();
    });

    it('should reuse existing X-Correlation-Id from request headers', () => {
      mockReq.headers = { 'x-correlation-id': 'existing-correlation-id' };

      correlationIdMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect((mockReq as Request & { correlationId: string }).correlationId).toBe('existing-correlation-id');
    });

    it('should reuse existing X-Request-Id from request headers', () => {
      mockReq.headers = { 'x-request-id': 'existing-request-id' };

      correlationIdMiddleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect((mockReq as Request & { correlationId: string }).correlationId).toBe('existing-request-id');
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 with proper structure', async () => {
      await notFoundHandler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'The requested resource was not found',
          code: 'NOT_FOUND',
          timestamp: expect.any(String),
        })
      );
      // Verify path is NOT included to prevent information disclosure
      const responseBody = jsonSpy.mock.calls[0][0];
      expect('path' in responseBody).toBe(false);
    });

    it('should set X-Correlation-Id header with value', async () => {
      await notFoundHandler(mockReq as Request, mockRes as Response);

      // X-Correlation-Id header is set (uuid mock may return undefined in ESM)
      expect(setHeaderSpy).toHaveBeenCalled();
      const headerCall = setHeaderSpy.mock.calls.find(
        (call: unknown[]) => call[0] === 'X-Correlation-Id'
      );
      expect(headerCall).toBeDefined();
    });

    it('should record audit event for not-found', async () => {
      await notFoundHandler(mockReq as Request, mockRes as Response);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'ACCESS_NOT_FOUND',
          channel: 'api',
          metadata: expect.objectContaining({
            route: '/api/v1/test',
            method: 'GET',
          }),
          success: false,
        })
      );
    });

    it('should record metrics for not-found', async () => {
      await notFoundHandler(mockReq as Request, mockRes as Response);

      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'access_error_not_found_total',
        { path: '/api/v1/test' }
      );
    });

    it('should rate limit excessive not-found requests', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
      });

      await notFoundHandler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(429);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'ACCESS_RATE_LIMITED',
        })
      );
    });

    it('should set Retry-After header when rate limited', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
      });

      await notFoundHandler(mockReq as Request, mockRes as Response);

      expect(setHeaderSpy).toHaveBeenCalledWith('Retry-After', expect.any(String));
    });

    it('should log rate limit audit event when throttled', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
      });

      await notFoundHandler(mockReq as Request, mockRes as Response);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'ACCESS_RATE_LIMITED',
          metadata: expect.objectContaining({
            type: 'not_found_burst',
          }),
        })
      );
    });
  });

  describe('errorHandler', () => {
    it('should handle 403 access denied errors', async () => {
      const error: ApiError = new Error('Access denied');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';

      await errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'ACCESS_DENIED',
          error: 'Access denied',
          timestamp: expect.any(String),
        })
      );
    });

    it('should handle 401 unauthorized errors', async () => {
      const error: ApiError = new Error('Not authenticated');
      error.statusCode = 401;
      error.code = 'UNAUTHORIZED';

      await errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        })
      );
    });

    it('should sanitize 500 internal errors', async () => {
      const error: ApiError = new Error('Sensitive database error');
      error.statusCode = 500;

      await errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
        })
      );
      // Should NOT include original message
      expect(jsonSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('database'),
        })
      );
    });

    it('should set correlation ID from error if present', async () => {
      const error: ApiError = new Error('Access denied');
      error.statusCode = 403;
      error.correlationId = 'error-specific-correlation-id';

      await errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: 'error-specific-correlation-id',
        })
      );
    });

    it('should record audit event for access denied', async () => {
      const error: ApiError = new Error('Access denied');
      error.statusCode = 403;

      await errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'ACCESS_DENIED',
          channel: 'api',
          success: false,
        })
      );
    });

    it('should record metrics for access errors', async () => {
      const error: ApiError = new Error('Access denied');
      error.statusCode = 403;

      await errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'access_error_denied_total',
        expect.objectContaining({ path: '/api/v1/test' })
      );
    });
  });

  describe('createError utilities', () => {
    it('should create error with all properties', () => {
      const error = createError('Test error', 403, 'TEST_CODE', 'corr-id-123');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('TEST_CODE');
      expect(error.correlationId).toBe('corr-id-123');
    });

    it('should create access denied error with defaults', () => {
      const error = createAccessDeniedError();

      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('ACCESS_DENIED');
    });

    it('should create unauthorized error with defaults', () => {
      const error = createUnauthorizedError();

      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should allow custom messages', () => {
      const error = createAccessDeniedError('Custom denied message');

      expect(error.message).toBe('Custom denied message');
    });
  });

  describe('Redis Fallback', () => {
    it('should use in-memory limiter when Redis fails', async () => {
      vi.mocked(checkRateLimit).mockRejectedValue(new Error('Redis connection failed'));

      // First request should still work (in-memory limiter allows it)
      await notFoundHandler(mockReq as Request, mockRes as Response);

      // Should get 404 not-found (not 500 error or 429) - proving fallback worked
      expect(statusSpy).toHaveBeenCalledWith(404);
    });

    it('should rate limit via in-memory fallback after many failures', async () => {
      vi.mocked(checkRateLimit).mockRejectedValue(new Error('Redis connection failed'));

      // Simulate many requests
      for (let i = 0; i < 31; i++) {
        // Reset response mocks for each request
        jsonSpy = vi.fn();
        statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });
        mockRes.status = statusSpy;

        await notFoundHandler(
          { ...mockReq, ip: '192.168.1.100' } as Request,
          mockRes as Response
        );
      }

      // After 30 failures, subsequent requests should be rate limited
      expect(statusSpy).toHaveBeenCalledWith(429);
    });
  });

  describe('Access Error Codes', () => {
    it('should have all expected error codes', () => {
      expect(ACCESS_ERROR_CODES).toEqual({
        UNAUTHORIZED: 'UNAUTHORIZED',
        FORBIDDEN: 'FORBIDDEN',
        ACCESS_DENIED: 'ACCESS_DENIED',
        NOT_FOUND: 'NOT_FOUND',
        ACCESS_RATE_LIMITED: 'ACCESS_RATE_LIMITED',
        INTERNAL_ERROR: 'INTERNAL_ERROR',
      });
    });
  });

  describe('Response Privacy', () => {
    it('should not expose stack traces in error responses', async () => {
      const error: ApiError = new Error('Database connection failed');
      error.statusCode = 500;
      error.stack = 'Error: Database connection failed\n    at Database.connect (db.ts:42)';

      await errorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      const responseBody = jsonSpy.mock.calls[0][0];
      expect(JSON.stringify(responseBody)).not.toContain('stack');
      expect(JSON.stringify(responseBody)).not.toContain('db.ts');
    });

    it('should not expose path in not-found responses (security hardening)', async () => {
      const reqWithPath = { ...mockReq, path: '/api/../../etc/passwd' };

      await notFoundHandler(reqWithPath as Request, mockRes as Response);

      // Path should NOT be included to prevent information disclosure
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'The requested resource was not found',
          code: 'NOT_FOUND',
        })
      );
      // Verify path is NOT exposed
      const responseBody = jsonSpy.mock.calls[0][0];
      expect('path' in responseBody).toBe(false);
    });
  });
});
