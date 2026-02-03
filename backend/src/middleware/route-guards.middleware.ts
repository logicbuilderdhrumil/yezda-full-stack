/**
 * Route Guards Middleware
 * Enforces authentication and authorization with audit logging and operational safeguards.
 */

import type { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services/token.service.js';
import { auditService } from '../services/audit.service.js';
import { metricsService } from '../services/metrics.service.js';
import { checkRateLimit } from '../db/redis.js';
import type { AccessTokenPayload } from '../models/auth.model.js';

/**
 * Extended request with authenticated user info
 */
export interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

/**
 * Role types for authorization
 */
export type UserRole = 'admin' | 'manager' | 'agent' | 'viewer';

/**
 * Extended user payload with roles
 */
export interface AuthenticatedUserPayload extends AccessTokenPayload {
  roles?: UserRole[];
}

export interface AuthenticatedRoleRequest extends Request {
  user?: AuthenticatedUserPayload;
}

// SLO targets for route guards
export const GUARD_SLOS = {
  // Latency SLOs
  GUARD_CHECK_LATENCY_P99_MS: 50,
  GUARD_CHECK_LATENCY_P95_MS: 20,

  // Availability SLOs
  GUARD_AVAILABILITY_RATE: 99.99,

  // Error rate SLOs
  MAX_AUTH_DENIED_RATE_PER_MINUTE: 100,
  MAX_ROLE_DENIED_RATE_PER_MINUTE: 50,
} as const;

// Metric names for guard operations
export const GUARD_METRICS = {
  AUTH_DENIED: 'guard_auth_denied_total',
  ROLE_DENIED: 'guard_role_denied_total',
  ACCESS_GRANTED: 'guard_access_granted_total',
  CHECK_LATENCY: 'guard_check_latency_ms',
  RATE_LIMITED: 'guard_rate_limited_total',
} as const;

// In-memory fallback rate limiter for guard denials
class GuardDenialLimiter {
  private windows: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  check(
    key: string,
    limit: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const window = this.windows.get(key);

    if (!window || window.resetAt < now) {
      this.windows.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    window.count += 1;
    const remaining = Math.max(0, limit - window.count);
    const allowed = window.count <= limit;

    return { allowed, remaining, resetAt: window.resetAt };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, window] of this.windows.entries()) {
      if (window.resetAt < now) {
        this.windows.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.windows.clear();
  }
}

const guardDenialLimiter = new GuardDenialLimiter();

// Rate limit settings for guard denials
const GUARD_DENIAL_WINDOW_MS = 60000; // 1 minute
const GUARD_DENIAL_MAX_ATTEMPTS = 20; // 20 denials per minute before throttling

/**
 * Check rate limiting for access denials
 */
async function checkGuardDenialRateLimit(ip: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const key = `guard:denial:${ip}`;

  try {
    return await checkRateLimit(key, GUARD_DENIAL_MAX_ATTEMPTS, GUARD_DENIAL_WINDOW_MS);
  } catch {
    // Fall back to in-memory limiter on Redis error
    return guardDenialLimiter.check(key, GUARD_DENIAL_MAX_ATTEMPTS, GUARD_DENIAL_WINDOW_MS);
  }
}

/**
 * Log guard denial to audit service
 */
function logGuardDenial(
  req: Request,
  reason: 'auth' | 'role',
  userId?: string,
  userType?: 'user' | 'candidate',
  requiredRole?: string
): void {
  const ip = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  auditService.log({
    eventType: reason === 'auth' ? 'GUARD_AUTH_DENIED' : 'GUARD_ROLE_DENIED',
    actorId: userId,
    actorType: userType,
    channel: 'api',
    ipAddress: ip,
    userAgent,
    success: false,
    errorMessage: reason === 'auth' ? 'Authentication required' : `Missing required role: ${requiredRole}`,
    metadata: {
      route: req.path,
      method: req.method,
      requiredRole,
    },
  });
}

/**
 * Log guard access granted
 */
function logGuardAccessGranted(
  req: AuthenticatedRoleRequest,
  requiredRole?: string
): void {
  const ip = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  auditService.log({
    eventType: 'GUARD_ACCESS_GRANTED',
    actorId: req.user?.sub,
    actorType: req.user?.type,
    channel: 'api',
    ipAddress: ip,
    userAgent,
    success: true,
    metadata: {
      route: req.path,
      method: req.method,
      requiredRole,
    },
  });
}

/**
 * Require valid authentication token with audit logging and rate limiting
 */
export async function requireAuthGuard(
  req: AuthenticatedRoleRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const startTime = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Check rate limit for repeated denials
    const rateCheck = await checkGuardDenialRateLimit(ip);
    if (!rateCheck.allowed) {
      metricsService.incrementCounter(GUARD_METRICS.RATE_LIMITED, { type: 'auth' });
      res.status(429).json({
        error: 'Too many failed authentication attempts',
        code: 'GUARD_RATE_LIMITED',
      });
      return;
    }

    metricsService.incrementCounter(GUARD_METRICS.AUTH_DENIED, { reason: 'missing_header' });
    logGuardDenial(req, 'auth');
    metricsService.recordLatency(GUARD_METRICS.CHECK_LATENCY, Date.now() - startTime, { result: 'denied' });

    res.status(401).json({ error: 'Authorization header required', code: 'UNAUTHORIZED' });
    return;
  }

  const token = authHeader.slice(7);
  const payload = await tokenService.validateAccessToken(token);

  if (!payload) {
    // Check rate limit for repeated denials
    const rateCheck = await checkGuardDenialRateLimit(ip);
    if (!rateCheck.allowed) {
      metricsService.incrementCounter(GUARD_METRICS.RATE_LIMITED, { type: 'auth' });
      res.status(429).json({
        error: 'Too many failed authentication attempts',
        code: 'GUARD_RATE_LIMITED',
      });
      return;
    }

    metricsService.incrementCounter(GUARD_METRICS.AUTH_DENIED, { reason: 'invalid_token' });
    logGuardDenial(req, 'auth');
    metricsService.recordLatency(GUARD_METRICS.CHECK_LATENCY, Date.now() - startTime, { result: 'denied' });

    res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
    return;
  }

  req.user = payload as AuthenticatedUserPayload;
  metricsService.incrementCounter(GUARD_METRICS.ACCESS_GRANTED, { type: 'auth' });
  metricsService.recordLatency(GUARD_METRICS.CHECK_LATENCY, Date.now() - startTime, { result: 'granted' });

  next();
}

/**
 * Require specific user type
 */
export function requireUserTypeGuard(type: 'user' | 'candidate') {
  return async (req: AuthenticatedRoleRequest, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (!req.user) {
      metricsService.incrementCounter(GUARD_METRICS.AUTH_DENIED, { reason: 'no_user' });
      logGuardDenial(req, 'auth');
      metricsService.recordLatency(GUARD_METRICS.CHECK_LATENCY, Date.now() - startTime, { result: 'denied' });

      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    if (req.user.type !== type) {
      // Check rate limit for repeated denials
      const rateCheck = await checkGuardDenialRateLimit(ip);
      if (!rateCheck.allowed) {
        metricsService.incrementCounter(GUARD_METRICS.RATE_LIMITED, { type: 'user_type' });
        res.status(429).json({
          error: 'Too many access attempts',
          code: 'GUARD_RATE_LIMITED',
        });
        return;
      }

      metricsService.incrementCounter(GUARD_METRICS.ROLE_DENIED, { required: type, actual: req.user.type });
      logGuardDenial(req, 'role', req.user.sub, req.user.type, type);
      metricsService.recordLatency(GUARD_METRICS.CHECK_LATENCY, Date.now() - startTime, { result: 'denied' });

      res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
      return;
    }

    metricsService.incrementCounter(GUARD_METRICS.ACCESS_GRANTED, { type: 'user_type' });
    logGuardAccessGranted(req, type);
    metricsService.recordLatency(GUARD_METRICS.CHECK_LATENCY, Date.now() - startTime, { result: 'granted' });

    next();
  };
}

/**
 * Require specific role(s)
 * Chain after requireAuthGuard to ensure user is authenticated
 */
export function requireRoleGuard(...requiredRoles: UserRole[]) {
  return async (req: AuthenticatedRoleRequest, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (!req.user) {
      metricsService.incrementCounter(GUARD_METRICS.AUTH_DENIED, { reason: 'no_user' });
      logGuardDenial(req, 'auth');
      metricsService.recordLatency(GUARD_METRICS.CHECK_LATENCY, Date.now() - startTime, { result: 'denied' });

      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      // Check rate limit for repeated denials
      const rateCheck = await checkGuardDenialRateLimit(ip);
      if (!rateCheck.allowed) {
        metricsService.incrementCounter(GUARD_METRICS.RATE_LIMITED, { type: 'role' });
        res.status(429).json({
          error: 'Too many access attempts',
          code: 'GUARD_RATE_LIMITED',
        });
        return;
      }

      metricsService.incrementCounter(GUARD_METRICS.ROLE_DENIED, {
        required: requiredRoles.join(','),
        actual: userRoles.join(','),
      });
      logGuardDenial(req, 'role', req.user.sub, req.user.type, requiredRoles.join(','));
      metricsService.recordLatency(GUARD_METRICS.CHECK_LATENCY, Date.now() - startTime, { result: 'denied' });

      res.status(403).json({
        error: `Access denied. Required role: ${requiredRoles.join(' or ')}`,
        code: 'FORBIDDEN',
      });
      return;
    }

    metricsService.incrementCounter(GUARD_METRICS.ACCESS_GRANTED, { type: 'role' });
    logGuardAccessGranted(req, requiredRoles.join(','));
    metricsService.recordLatency(GUARD_METRICS.CHECK_LATENCY, Date.now() - startTime, { result: 'granted' });

    next();
  };
}

/**
 * Require any of the specified roles OR be the resource owner
 * Useful for endpoints where users can manage their own resources
 */
export function requireRoleOrOwnerGuard(
  ownerIdExtractor: (req: Request) => string | undefined,
  ...requiredRoles: UserRole[]
) {
  return async (req: AuthenticatedRoleRequest, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (!req.user) {
      metricsService.incrementCounter(GUARD_METRICS.AUTH_DENIED, { reason: 'no_user' });
      logGuardDenial(req, 'auth');
      metricsService.recordLatency(GUARD_METRICS.CHECK_LATENCY, Date.now() - startTime, { result: 'denied' });

      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));

    // Extract owner ID from request
    const ownerId = ownerIdExtractor(req);
    const isOwner = ownerId !== undefined && req.user.sub === ownerId;

    if (!hasRequiredRole && !isOwner) {
      // Check rate limit for repeated denials
      const rateCheck = await checkGuardDenialRateLimit(ip);
      if (!rateCheck.allowed) {
        metricsService.incrementCounter(GUARD_METRICS.RATE_LIMITED, { type: 'role_or_owner' });
        res.status(429).json({
          error: 'Too many access attempts',
          code: 'GUARD_RATE_LIMITED',
        });
        return;
      }

      metricsService.incrementCounter(GUARD_METRICS.ROLE_DENIED, {
        required: requiredRoles.join(','),
        actual: userRoles.join(','),
        isOwner: 'false',
      });
      logGuardDenial(req, 'role', req.user.sub, req.user.type, `${requiredRoles.join(',')} or owner`);
      metricsService.recordLatency(GUARD_METRICS.CHECK_LATENCY, Date.now() - startTime, { result: 'denied' });

      res.status(403).json({
        error: 'Access denied',
        code: 'FORBIDDEN',
      });
      return;
    }

    metricsService.incrementCounter(GUARD_METRICS.ACCESS_GRANTED, {
      type: hasRequiredRole ? 'role' : 'owner',
    });
    logGuardAccessGranted(req, hasRequiredRole ? requiredRoles.join(',') : 'owner');
    metricsService.recordLatency(GUARD_METRICS.CHECK_LATENCY, Date.now() - startTime, { result: 'granted' });

    next();
  };
}

/**
 * Compose multiple guards - all must pass
 */
export function composeGuards(
  ...guards: Array<(req: Request, res: Response, next: NextFunction) => Promise<void> | void>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let index = 0;

    const runNext = async (): Promise<void> => {
      if (index >= guards.length) {
        next();
        return;
      }

      const guard = guards[index++];
      await guard(req, res, (err?: unknown) => {
        if (err) {
          next(err);
          return;
        }
        // Only continue if response hasn't been sent
        if (!res.headersSent) {
          runNext();
        }
      });
    };

    await runNext();
  };
}
