/**
 * Validation Middleware
 * Request body validation using Zod schemas
 */

import type { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Create validation middleware for request body
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));

      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

/**
 * Create validation middleware for query params
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));

      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      });
      return;
    }

    req.query = result.data as typeof req.query;
    next();
  };
}

/**
 * Create validation middleware for route params
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));

      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      });
      return;
    }

    req.params = result.data as typeof req.params;
    next();
  };
}

// Common validation schemas for auth endpoints
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  userType: z.enum(['user', 'candidate']),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  userType: z.enum(['user', 'candidate']),
  mfaCode: z.string().length(6).optional(),
});

export const mfaVerifySchema = z.object({
  mfaSessionToken: z.string().uuid(),
  mfaCode: z.string().length(6),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  userType: z.enum(['user', 'candidate']),
});

export const passwordResetCompleteSchema = z.object({
  token: z.string().uuid('Invalid reset token'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const mfaEnrollmentVerifySchema = z.object({
  enrollmentId: z.string().uuid(),
  code: z.string().length(6),
});

// Firebase validation schemas
export const deviceTokenRegistrationSchema = z.object({
  token: z.string().min(100, 'Device token must be at least 100 characters').max(300, 'Device token must be at most 300 characters'),
  platform: z.enum(['ios', 'android', 'web']),
  deviceId: z.string().max(255).optional(),
  deviceName: z.string().max(255).optional(),
  appVersion: z.string().max(50).optional(),
});

export const deviceTokenUnregistrationSchema = z.object({
  token: z.string().min(100, 'Device token must be at least 100 characters').max(300, 'Device token must be at most 300 characters'),
});

export const notificationDispatchSchema = z.object({
  recipientId: z.string().uuid(),
  recipientType: z.enum(['user', 'candidate']),
  title: z.string().min(1, 'Title is required').max(255),
  body: z.string().min(1, 'Body is required').max(1000),
  data: z.record(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  type: z.string().max(100).optional(),
});
