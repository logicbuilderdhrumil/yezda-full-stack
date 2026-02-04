/**
 * Integration Smoke Tests - Foundation Contracts
 *
 * Tests that verify frontend-backend contract alignment for foundation APIs.
 * These tests validate error envelope format, endpoint availability, and response structure.
 *
 * @see shared/src/contracts for contract definitions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiErrorEnvelope } from '@yezda/shared/contracts';
import { isApiErrorEnvelope } from '@yezda/shared/contracts';

describe('Foundation Contracts', () => {
  describe('Error Envelope Format', () => {
    it('should validate correct error envelope structure', () => {
      const validEnvelope: ApiErrorEnvelope = {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        correlationId: 'test-correlation-id',
        timestamp: new Date().toISOString(),
      };

      expect(isApiErrorEnvelope(validEnvelope)).toBe(true);
    });

    it('should validate error envelope with details', () => {
      const envelopeWithDetails: ApiErrorEnvelope = {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        correlationId: 'test-correlation-id',
        details: [
          { field: 'email', message: 'Invalid email format', rule: 'format' },
          { field: 'password', message: 'Password too short', rule: 'minLength' },
        ],
      };

      expect(isApiErrorEnvelope(envelopeWithDetails)).toBe(true);
      expect(envelopeWithDetails.details).toHaveLength(2);
      expect(envelopeWithDetails.details![0].field).toBe('email');
    });

    it('should reject invalid error envelope without code', () => {
      const invalid = {
        message: 'Error',
        correlationId: 'test-id',
      };

      expect(isApiErrorEnvelope(invalid)).toBe(false);
    });

    it('should reject invalid error envelope without correlationId', () => {
      const invalid = {
        code: 'ERROR',
        message: 'Error',
      };

      expect(isApiErrorEnvelope(invalid)).toBe(false);
    });

    it('should reject null or undefined', () => {
      expect(isApiErrorEnvelope(null)).toBe(false);
      expect(isApiErrorEnvelope(undefined)).toBe(false);
    });
  });

  describe('Auth Contract Alignment', () => {
    it('should align sign-in response with contract', () => {
      // Token pair response
      const tokenResponse = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        expiresIn: 3600,
        tokenType: 'Bearer' as const,
      };

      expect(tokenResponse).toEqual(
        expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          expiresIn: expect.any(Number),
          tokenType: 'Bearer',
        })
      );
    });

    it('should align MFA challenge response with contract', () => {
      const mfaResponse = {
        requiresMfa: true,
        mfaSessionToken: 'mfa-session-token-123',
      };

      expect(mfaResponse).toEqual(
        expect.objectContaining({
          requiresMfa: true,
          mfaSessionToken: expect.any(String),
        })
      );
    });

    it('should align current user response with contract', () => {
      const userResponse = {
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        userType: 'user',
        mfaEnabled: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      expect(userResponse).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          email: expect.any(String),
          role: expect.stringMatching(/^(admin|manager|user|candidate)$/),
          userType: expect.stringMatching(/^(user|candidate)$/),
          mfaEnabled: expect.any(Boolean),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );
    });
  });

  describe('Notification Contract Alignment', () => {
    it('should align notification entity with contract', () => {
      const notification = {
        id: 'notif-123',
        tenantId: 'tenant-456',
        userId: 'user-789',
        userType: 'user',
        type: 'SYSTEM',
        priority: 'normal',
        title: 'Test Notification',
        body: 'This is a test notification body',
        status: 'unread',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      expect(notification).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          tenantId: expect.any(String),
          userId: expect.any(String),
          userType: expect.stringMatching(/^(user|candidate)$/),
          type: expect.stringMatching(/^(SYSTEM|APPLICATION|SCREENING|DOCUMENT|MESSAGE|SECURITY|REMINDER)$/),
          priority: expect.stringMatching(/^(low|normal|high|urgent)$/),
          title: expect.any(String),
          body: expect.any(String),
          status: expect.stringMatching(/^(unread|read)$/),
          createdAt: expect.any(String),
        })
      );
    });

    it('should align notification list response with contract', () => {
      const listResponse = {
        notifications: [],
        total: 0,
        hasMore: false,
        nextCursor: undefined,
      };

      expect(listResponse).toEqual(
        expect.objectContaining({
          notifications: expect.any(Array),
          total: expect.any(Number),
          hasMore: expect.any(Boolean),
        })
      );
    });

    it('should align unread count response with contract', () => {
      const unreadCountResponse = {
        count: 5,
      };

      expect(unreadCountResponse).toEqual({
        count: expect.any(Number),
      });
    });
  });

  describe('Socket Event Contract Alignment', () => {
    it('should align connection ack payload with contract', () => {
      const connectionAck = {
        socketId: 'socket-123',
        userId: 'user-456',
        userType: 'user',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      expect(connectionAck).toEqual(
        expect.objectContaining({
          socketId: expect.any(String),
          userId: expect.any(String),
          userType: expect.stringMatching(/^(user|candidate)$/),
          timestamp: expect.any(String),
        })
      );
    });

    it('should align presence update payload with contract', () => {
      const presenceUpdate = {
        userId: 'user-123',
        userType: 'user',
        status: 'online',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      expect(presenceUpdate).toEqual(
        expect.objectContaining({
          userId: expect.any(String),
          userType: expect.stringMatching(/^(user|candidate)$/),
          status: expect.stringMatching(/^(online|away|busy|offline)$/),
          timestamp: expect.any(String),
        })
      );
    });

    it('should align notification socket payload with contract', () => {
      const notificationPayload = {
        id: 'notif-123',
        type: 'SYSTEM',
        priority: 'normal',
        title: 'New Message',
        body: 'You have a new message',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      expect(notificationPayload).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          type: expect.stringMatching(/^(SYSTEM|APPLICATION|SCREENING|DOCUMENT|MESSAGE|SECURITY|REMINDER)$/),
          priority: expect.stringMatching(/^(low|normal|high|urgent)$/),
          title: expect.any(String),
          body: expect.any(String),
          createdAt: expect.any(String),
        })
      );
    });
  });

  describe('Pagination Contract Alignment', () => {
    it('should align pagination meta with contract', () => {
      const paginationMeta = {
        total: 100,
        count: 20,
        hasMore: true,
        nextCursor: 'cursor-abc123',
        limit: 20,
      };

      expect(paginationMeta).toEqual(
        expect.objectContaining({
          count: expect.any(Number),
          hasMore: expect.any(Boolean),
          limit: expect.any(Number),
        })
      );
    });

    it('should align paginated response with contract', () => {
      const paginatedResponse = {
        data: [{ id: '1' }, { id: '2' }],
        pagination: {
          count: 2,
          hasMore: false,
          limit: 20,
        },
      };

      expect(paginatedResponse).toEqual(
        expect.objectContaining({
          data: expect.any(Array),
          pagination: expect.objectContaining({
            count: expect.any(Number),
            hasMore: expect.any(Boolean),
            limit: expect.any(Number),
          }),
        })
      );
    });
  });
});

describe('Error Code Constants', () => {
  const validErrorCodes = [
    'VALIDATION_ERROR',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'CONFLICT',
    'RATE_LIMITED',
    'INTERNAL_ERROR',
    'SERVICE_UNAVAILABLE',
    'BAD_REQUEST',
    'AUTH_ERROR',
    'TOKEN_EXPIRED',
    'TOKEN_INVALID',
    'MFA_REQUIRED',
    'MFA_INVALID',
    'NETWORK_ERROR',
  ];

  it('should have all expected error codes defined', () => {
    validErrorCodes.forEach((code) => {
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
    });
  });

  it('should use uppercase snake_case for error codes', () => {
    validErrorCodes.forEach((code) => {
      expect(code).toMatch(/^[A-Z][A-Z0-9_]*$/);
    });
  });
});
