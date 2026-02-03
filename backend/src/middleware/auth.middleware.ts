/**
 * Authentication Middleware
 * Validates access tokens and protects routes
 */

import type { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services/token.service.js';
import type { AccessTokenPayload } from '../models/auth.model.js';

export interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

/**
 * Require valid access token
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header required', code: 'UNAUTHORIZED' });
    return;
  }

  const token = authHeader.slice(7);
  const payload = await tokenService.validateAccessToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
    return;
  }

  req.user = payload;
  next();
}

/**
 * Optional authentication - attaches user if token present
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = await tokenService.validateAccessToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}

/**
 * Require specific user type
 */
export function requireUserType(type: 'user' | 'candidate') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    if (req.user.type !== type) {
      res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
      return;
    }

    next();
  };
}
