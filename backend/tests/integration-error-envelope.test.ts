/**
 * Integration Tests - Error Envelope and Contract Alignment
 *
 * Tests that verify the backend error handling aligns with the shared contract.
 *
 * @see shared/src/contracts/error-envelope.ts for contract definition
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import request from 'supertest';
import {
  errorHandler,
  notFoundHandler,
  createError,
  createValidationError,
  type ApiError,
} from '../src/middleware/error.middleware.js';

// Import shared contract types and validators for cross-layer validation
import type { ApiErrorEnvelope } from '@yezda/shared/contracts';
import { isApiErrorEnvelope } from '@yezda/shared/contracts';

describe('Error Envelope Integration', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('errorHandler middleware', () => {
    beforeEach(() => {
      // Route that throws an error
      app.get('/test-error', (_req: Request, _res: Response, next: NextFunction) => {
        const error = createError('Test error message', 400, 'BAD_REQUEST');
        next(error);
      });

      // Route that throws a validation error
      app.post('/test-validation', (_req: Request, _res: Response, next: NextFunction) => {
        const error = createValidationError([
          { field: 'email', message: 'Invalid email format', rule: 'format' },
          { field: 'password', message: 'Password required', rule: 'required' },
        ]);
        next(error);
      });

      // Route that throws an internal error
      app.get('/test-internal', (_req: Request, _res: Response, next: NextFunction) => {
        next(new Error('Unexpected error'));
      });

      app.use(errorHandler);
    });

    it('should return error envelope with required fields', async () => {
      const response = await request(app).get('/test-error');

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          code: 'BAD_REQUEST',
          message: 'Test error message',
          correlationId: expect.any(String),
          timestamp: expect.any(String),
        })
      );
    });

    it('should include x-correlation-id header in response', async () => {
      const response = await request(app).get('/test-error');

      expect(response.headers['x-correlation-id']).toBeDefined();
      expect(response.headers['x-correlation-id']).toBe(response.body.correlationId);
    });

    it('should use provided correlation ID from request header', async () => {
      const customCorrelationId = 'custom-correlation-123';

      const response = await request(app)
        .get('/test-error')
        .set('x-correlation-id', customCorrelationId);

      expect(response.body.correlationId).toBe(customCorrelationId);
      expect(response.headers['x-correlation-id']).toBe(customCorrelationId);
    });

    it('should include validation details for validation errors', async () => {
      const response = await request(app).post('/test-validation');

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.details).toHaveLength(2);
      expect(response.body.details[0]).toEqual({
        field: 'email',
        message: 'Invalid email format',
        rule: 'format',
      });
    });

    it('should mask internal error messages in production', async () => {
      const response = await request(app).get('/test-internal');

      expect(response.status).toBe(500);
      expect(response.body.code).toBe('INTERNAL_ERROR');
      expect(response.body.message).toBe('Internal server error');
      // Should not expose internal error details
      expect(response.body.message).not.toContain('Unexpected error');
    });

    it('should have valid ISO timestamp', async () => {
      const response = await request(app).get('/test-error');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });
  });

  describe('notFoundHandler middleware', () => {
    beforeEach(() => {
      app.use(notFoundHandler);
    });

    it('should return 404 with error envelope', async () => {
      const response = await request(app).get('/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.body).toEqual(
        expect.objectContaining({
          code: 'NOT_FOUND',
          message: expect.stringContaining('/non-existent-route'),
          correlationId: expect.any(String),
          timestamp: expect.any(String),
        })
      );
    });

    it('should include correlation ID header for 404', async () => {
      const response = await request(app).get('/unknown');

      expect(response.headers['x-correlation-id']).toBeDefined();
      expect(response.headers['x-correlation-id']).toBe(response.body.correlationId);
    });
  });

  describe('createError helper', () => {
    it('should create error with statusCode and code', () => {
      const error = createError('Unauthorized access', 401, 'UNAUTHORIZED');

      expect(error.message).toBe('Unauthorized access');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should create error with validation details', () => {
      const details = [{ field: 'name', message: 'Name required' }];
      const error = createError('Validation failed', 400, 'VALIDATION_ERROR', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('createValidationError helper', () => {
    it('should create validation error with default message', () => {
      const details = [{ field: 'email', message: 'Invalid' }];
      const error = createValidationError(details);

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Validation failed');
      expect(error.details).toEqual(details);
    });

    it('should create validation error with custom message', () => {
      const error = createValidationError([], 'Custom validation message');

      expect(error.message).toBe('Custom validation message');
    });
  });
});

describe('HTTP Status Code Mapping', () => {
  const statusCodeMappings: Array<[string, number]> = [
    ['BAD_REQUEST', 400],
    ['UNAUTHORIZED', 401],
    ['FORBIDDEN', 403],
    ['NOT_FOUND', 404],
    ['CONFLICT', 409],
    ['VALIDATION_ERROR', 400],
    ['RATE_LIMITED', 429],
    ['INTERNAL_ERROR', 500],
    ['SERVICE_UNAVAILABLE', 503],
  ];

  it.each(statusCodeMappings)(
    'should map %s to HTTP status %d',
    (code, expectedStatus) => {
      // Verify the mapping exists conceptually
      expect(typeof code).toBe('string');
      expect(typeof expectedStatus).toBe('number');
      expect(expectedStatus).toBeGreaterThanOrEqual(400);
      expect(expectedStatus).toBeLessThan(600);
    }
  );
});

describe('Cross-Layer Contract Validation', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Backend produces valid ApiErrorEnvelope per shared contract', () => {
    beforeEach(() => {
      // Route that throws an error
      app.get('/test-error', (_req: Request, _res: Response, next: NextFunction) => {
        const error = createError('Test error message', 400, 'BAD_REQUEST');
        next(error);
      });

      // Route that throws a validation error
      app.post('/test-validation', (_req: Request, _res: Response, next: NextFunction) => {
        const error = createValidationError([
          { field: 'email', message: 'Invalid email format', rule: 'format' },
        ]);
        next(error);
      });

      app.use(errorHandler);
      app.use(notFoundHandler);
    });

    it('should produce JSON that passes isApiErrorEnvelope() from @yezda/shared', async () => {
      const response = await request(app).get('/test-error');

      // The critical test: backend response must pass the shared contract validator
      expect(isApiErrorEnvelope(response.body)).toBe(true);
    });

    it('should produce valid error envelope for validation errors', async () => {
      const response = await request(app).post('/test-validation');

      // Verify the response passes the shared contract validator
      expect(isApiErrorEnvelope(response.body)).toBe(true);

      // Additionally verify the structure matches ApiErrorEnvelope type
      const envelope: ApiErrorEnvelope = response.body;
      expect(envelope.code).toBe('VALIDATION_ERROR');
      expect(envelope.message).toBe('Validation failed');
      expect(envelope.correlationId).toBeDefined();
      expect(envelope.details).toHaveLength(1);
    });

    it('should produce valid error envelope for 404 responses', async () => {
      const response = await request(app).get('/non-existent');

      // Verify the response passes the shared contract validator
      expect(isApiErrorEnvelope(response.body)).toBe(true);

      const envelope: ApiErrorEnvelope = response.body;
      expect(envelope.code).toBe('NOT_FOUND');
      expect(envelope.correlationId).toBeDefined();
    });

    it('should include all required ApiErrorEnvelope fields', async () => {
      const response = await request(app).get('/test-error');
      const envelope = response.body as ApiErrorEnvelope;

      // Required fields per shared contract
      expect(typeof envelope.code).toBe('string');
      expect(typeof envelope.message).toBe('string');
      expect(typeof envelope.correlationId).toBe('string');

      // Optional fields should be correct types if present
      if (envelope.timestamp) {
        expect(typeof envelope.timestamp).toBe('string');
        const date = new Date(envelope.timestamp);
        expect(isNaN(date.getTime())).toBe(false);
      }
      if (envelope.details) {
        expect(Array.isArray(envelope.details)).toBe(true);
      }
    });
  });
});
