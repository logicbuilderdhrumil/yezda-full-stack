/**
 * Route Guards Tests
 * Tests for authentication and authorization guards
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Response, NextFunction } from 'express';
import {
  requireAuthGuard,
  requireUserTypeGuard,
  requireRoleGuard,
  requireRoleOrOwnerGuard,
  composeGuards,
  type AuthenticatedRoleRequest,
  type UserRole,
} from '../src/middleware/route-guards.middleware.js';

// Mock dependencies
vi.mock('../src/services/token.service.js', () => ({
  tokenService: {
    validateAccessToken: vi.fn(),
  },
}));

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
    remaining: 19,
    resetAt: Date.now() + 60000,
  }),
}));

import { tokenService } from '../src/services/token.service.js';
import { auditService } from '../src/services/audit.service.js';
import { metricsService } from '../src/services/metrics.service.js';
import { checkRateLimit } from '../src/db/redis.js';

describe('Route Guards', () => {
  let mockReq: Partial<AuthenticatedRoleRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: ReturnType<typeof vi.fn>;
  let statusSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    jsonSpy = vi.fn();
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
      headersSent: false,
      setHeader: vi.fn(),
    };

    mockNext = vi.fn();

    // Reset rate limit mock to allow requests
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 19,
      resetAt: Date.now() + 60000,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('requireAuthGuard', () => {
    it('should reject request without authorization header', async () => {
      await requireAuthGuard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Authorization header required',
        code: 'UNAUTHORIZED',
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalled();
      expect(metricsService.incrementCounter).toHaveBeenCalled();
    });

    it('should reject request with invalid bearer format', async () => {
      mockReq.headers = { authorization: 'Basic token123' };

      await requireAuthGuard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Authorization header required',
        code: 'UNAUTHORIZED',
      });
    });

    it('should reject request with invalid token', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      vi.mocked(tokenService.validateAccessToken).mockResolvedValue(null);

      await requireAuthGuard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
    });

    it('should allow request with valid token', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      vi.mocked(tokenService.validateAccessToken).mockResolvedValue({
        sub: 'user-123',
        type: 'user',
        iat: Date.now(),
        exp: Date.now() + 3600000,
        jti: 'jti-123',
      });

      await requireAuthGuard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.sub).toBe('user-123');
      expect(metricsService.incrementCounter).toHaveBeenCalled();
    });

    it('should rate limit excessive auth failures', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
      });

      await requireAuthGuard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(429);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Too many failed authentication attempts',
        code: 'GUARD_RATE_LIMITED',
      });
    });
  });

  describe('requireUserTypeGuard', () => {
    it('should reject unauthenticated request', async () => {
      const guard = requireUserTypeGuard('user');

      await guard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    });

    it('should reject wrong user type', async () => {
      mockReq.user = {
        sub: 'user-123',
        type: 'candidate',
        iat: Date.now(),
        exp: Date.now() + 3600000,
        jti: 'jti-123',
      };

      const guard = requireUserTypeGuard('user');

      await guard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Access denied',
        code: 'FORBIDDEN',
      });
    });

    it('should allow correct user type', async () => {
      mockReq.user = {
        sub: 'user-123',
        type: 'user',
        iat: Date.now(),
        exp: Date.now() + 3600000,
        jti: 'jti-123',
      };

      const guard = requireUserTypeGuard('user');

      await guard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireRoleGuard', () => {
    it('should reject unauthenticated request', async () => {
      const guard = requireRoleGuard('admin');

      await guard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(401);
    });

    it('should reject user without required role', async () => {
      mockReq.user = {
        sub: 'user-123',
        type: 'user',
        iat: Date.now(),
        exp: Date.now() + 3600000,
        jti: 'jti-123',
        roles: ['viewer'] as UserRole[],
      };

      const guard = requireRoleGuard('admin');

      await guard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(403);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'Access denied. Required role: admin',
        code: 'FORBIDDEN',
      });
    });

    it('should allow user with required role', async () => {
      mockReq.user = {
        sub: 'user-123',
        type: 'user',
        iat: Date.now(),
        exp: Date.now() + 3600000,
        jti: 'jti-123',
        roles: ['admin'] as UserRole[],
      };

      const guard = requireRoleGuard('admin');

      await guard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow any of multiple roles', async () => {
      mockReq.user = {
        sub: 'user-123',
        type: 'user',
        iat: Date.now(),
        exp: Date.now() + 3600000,
        jti: 'jti-123',
        roles: ['manager'] as UserRole[],
      };

      const guard = requireRoleGuard('admin', 'manager');

      await guard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle user with no roles array', async () => {
      mockReq.user = {
        sub: 'user-123',
        type: 'user',
        iat: Date.now(),
        exp: Date.now() + 3600000,
        jti: 'jti-123',
      };

      const guard = requireRoleGuard('admin');

      await guard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(403);
    });
  });

  describe('requireRoleOrOwnerGuard', () => {
    it('should allow resource owner without role', async () => {
      mockReq.user = {
        sub: 'user-123',
        type: 'user',
        iat: Date.now(),
        exp: Date.now() + 3600000,
        jti: 'jti-123',
        roles: [] as UserRole[],
      };
      mockReq.params = { userId: 'user-123' };

      const guard = requireRoleOrOwnerGuard((req) => req.params?.userId, 'admin');

      await guard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow admin without being owner', async () => {
      mockReq.user = {
        sub: 'admin-456',
        type: 'user',
        iat: Date.now(),
        exp: Date.now() + 3600000,
        jti: 'jti-123',
        roles: ['admin'] as UserRole[],
      };
      mockReq.params = { userId: 'user-123' };

      const guard = requireRoleOrOwnerGuard((req) => req.params?.userId, 'admin');

      await guard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject non-owner without role', async () => {
      mockReq.user = {
        sub: 'user-456',
        type: 'user',
        iat: Date.now(),
        exp: Date.now() + 3600000,
        jti: 'jti-123',
        roles: ['viewer'] as UserRole[],
      };
      mockReq.params = { userId: 'user-123' };

      const guard = requireRoleOrOwnerGuard((req) => req.params?.userId, 'admin');

      await guard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(403);
    });
  });

  describe('composeGuards', () => {
    it('should chain multiple guards', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      vi.mocked(tokenService.validateAccessToken).mockResolvedValue({
        sub: 'user-123',
        type: 'user',
        iat: Date.now(),
        exp: Date.now() + 3600000,
        jti: 'jti-123',
        roles: ['admin'],
      });

      const composedGuard = composeGuards(
        requireAuthGuard,
        requireRoleGuard('admin')
      );

      await composedGuard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should stop at first failing guard', async () => {
      // No auth header - first guard should fail
      const composedGuard = composeGuards(
        requireAuthGuard,
        requireRoleGuard('admin')
      );

      await composedGuard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Audit Logging', () => {
    it('should log authentication denial', async () => {
      await requireAuthGuard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'GUARD_AUTH_DENIED',
          success: false,
        })
      );
    });

    it('should log role denial with route info', async () => {
      mockReq.user = {
        sub: 'user-123',
        type: 'user',
        iat: Date.now(),
        exp: Date.now() + 3600000,
        jti: 'jti-123',
        roles: ['viewer'] as UserRole[],
      };

      const guard = requireRoleGuard('admin');
      await guard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'GUARD_ROLE_DENIED',
          actorId: 'user-123',
          metadata: expect.objectContaining({
            route: '/api/v1/test',
            method: 'GET',
          }),
        })
      );
    });

    it('should log access granted events', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      vi.mocked(tokenService.validateAccessToken).mockResolvedValue({
        sub: 'user-123',
        type: 'user',
        iat: Date.now(),
        exp: Date.now() + 3600000,
        jti: 'jti-123',
      });

      mockReq.user = {
        sub: 'user-123',
        type: 'user',
        iat: Date.now(),
        exp: Date.now() + 3600000,
        jti: 'jti-123',
        roles: ['admin'] as UserRole[],
      };

      const guard = requireRoleGuard('admin');
      await guard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'GUARD_ACCESS_GRANTED',
          success: true,
        })
      );
    });
  });

  describe('Metrics', () => {
    it('should record auth denied metric', async () => {
      await requireAuthGuard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'guard_auth_denied_total',
        expect.any(Object)
      );
    });

    it('should record latency metric', async () => {
      await requireAuthGuard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(metricsService.recordLatency).toHaveBeenCalledWith(
        'guard_check_latency_ms',
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should record rate limit metric when throttled', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
      });

      await requireAuthGuard(
        mockReq as AuthenticatedRoleRequest,
        mockRes as Response,
        mockNext
      );

      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        'guard_rate_limited_total',
        expect.objectContaining({ type: 'auth' })
      );
    });
  });
});
