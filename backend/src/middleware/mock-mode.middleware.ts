/**
 * Mock Mode Middleware
 * Provides route guards and safeguards for mock API mode.
 * 
 * Task 1.4: Enforce environment safeguards and RBAC for mock mode toggles.
 * Task 1.5: Audit logging for mock mode changes and fixture access.
 */

import type { Request, Response, NextFunction } from 'express';
import { isMockModeEnabled, canEnableMockMode, getMockModeBlockedReason } from '../config/mock.config.js';
import { mockApiService } from '../services/mock-api.service.js';
import { getClientIp } from '../utils/ip.util.js';
import type { AuthenticatedRoleRequest } from './route-guards.middleware.js';

/**
 * Middleware to require mock mode to be enabled.
 * Returns 404 if mock mode is not enabled (to avoid exposing mock endpoints in production).
 */
export function requireMockMode(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!isMockModeEnabled()) {
    // Log the blocked attempt
    mockApiService.logMockModeBlocked({
      reason: getMockModeBlockedReason() || 'Mock mode is not enabled',
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    // Return 404 to hide mock endpoints in production
    res.status(404).json({
      error: 'Not found',
      code: 'NOT_FOUND',
    });
    return;
  }

  next();
}

/**
 * Middleware to check if mock mode can be toggled.
 * For endpoints that manage mock mode state.
 */
export function requireMockModeToggleAccess(
  req: AuthenticatedRoleRequest,
  res: Response,
  next: NextFunction
): void {
  // Check environment first
  if (!canEnableMockMode()) {
    const reason = getMockModeBlockedReason() || 'Environment does not allow mock mode';
    
    mockApiService.logMockModeBlocked({
      reason,
      actorId: req.user?.sub,
      actorType: req.user?.type,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    res.status(403).json({
      error: reason,
      code: 'MOCK_MODE_BLOCKED',
    });
    return;
  }

  // Check for admin role - only admins can toggle mock mode
  const userRoles = req.user?.roles || [];
  if (!userRoles.includes('admin')) {
    mockApiService.logMockModeBlocked({
      reason: 'Insufficient permissions to toggle mock mode',
      actorId: req.user?.sub,
      actorType: req.user?.type,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    res.status(403).json({
      error: 'Admin role required to toggle mock mode',
      code: 'FORBIDDEN',
    });
    return;
  }

  next();
}

/**
 * Middleware to log fixture access for audit trail.
 * Should be applied after requireMockMode.
 */
export function logMockFixtureAccess(fixtureName: string) {
  return (req: AuthenticatedRoleRequest, _res: Response, next: NextFunction): void => {
    mockApiService.logFixtureAccess({
      endpoint: req.path,
      method: req.method,
      fixtureName,
      actorId: req.user?.sub,
      actorType: req.user?.type,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });

    next();
  };
}

/**
 * Middleware to log mock endpoint calls.
 * General purpose audit logging for mock API usage.
 */
export function logMockEndpointCall(
  req: AuthenticatedRoleRequest,
  _res: Response,
  next: NextFunction
): void {
  if (isMockModeEnabled()) {
    mockApiService.logEndpointCall({
      endpoint: req.path,
      method: req.method,
      actorId: req.user?.sub,
      actorType: req.user?.type,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });
  }

  next();
}

/**
 * Response wrapper to add mock mode header to responses.
 * Helps identify when responses are coming from mock data.
 */
export function addMockModeHeader(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (isMockModeEnabled()) {
    res.setHeader('X-Mock-Mode', 'true');
    res.setHeader('X-Mock-Warning', 'Response contains mock data - not for production use');
  }

  next();
}
