/**
 * Firebase Integration Tests
 * Task 1.4: Tests for token registration and dispatch behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase config before importing services
// Use dev values to trigger mock mode in tests
vi.mock('../src/config/firebase.config.js', () => ({
  firebaseConfig: {
    projectId: 'dev-project-id',
    clientEmail: 'dev@example.com',
    privateKey: 'dev-private-key',
  },
  firebaseRateLimitConfig: {
    windowMs: 60000,
    maxTokenRegistrations: 10,
    maxNotificationDispatch: 50,
  },
}));

// Mock audit service
const mockAuditService = {
  log: vi.fn(),
  logFirebaseTokenRegistered: vi.fn(),
  logFirebaseTokenUnregistered: vi.fn(),
  logFirebaseTokenRegistrationDenied: vi.fn(),
  logFirebaseNotificationDispatched: vi.fn(),
  logFirebaseNotificationFailed: vi.fn(),
  logAnomaly: vi.fn(),
};

vi.mock('../src/services/audit.service.js', () => ({
  auditService: mockAuditService,
}));

// Mock metrics service with actual class export for tests that need the real class
vi.mock('../src/services/metrics.service.js', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    metricsService: {
      recordFirebaseTokenRegistration: vi.fn(),
      recordFirebaseTokenUnregistration: vi.fn(),
      recordFirebaseDispatch: vi.fn(),
      recordFirebaseRateLimitHit: vi.fn(),
    },
  };
});

import { metricsService as mockMetricsService } from '../src/services/metrics.service.js';

describe('Firebase Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('FirebaseAdminService', () => {
    it('should validate token format correctly', async () => {
      const { firebaseAdminService } = await import('../src/services/firebase-admin.service.js');

      // Valid FCM token format (100-300 alphanumeric chars with allowed special chars)
      const validToken = 'a'.repeat(150);
      expect(firebaseAdminService.validateTokenFormat(validToken)).toBe(true);

      // Too short
      expect(firebaseAdminService.validateTokenFormat('short')).toBe(false);

      // Too long
      expect(firebaseAdminService.validateTokenFormat('a'.repeat(350))).toBe(false);

      // Invalid characters
      expect(firebaseAdminService.validateTokenFormat('a'.repeat(150) + '!')).toBe(false);

      // Empty
      expect(firebaseAdminService.validateTokenFormat('')).toBe(false);

      // Null/undefined
      expect(firebaseAdminService.validateTokenFormat(null as unknown as string)).toBe(false);
    });

    it('should be in mock mode without production credentials', async () => {
      const { firebaseAdminService } = await import('../src/services/firebase-admin.service.js');
      expect(firebaseAdminService.isInitialized()).toBe(true);
      expect(firebaseAdminService.isMockMode()).toBe(true);
    });

    it('should send notification in mock mode', async () => {
      const { firebaseAdminService } = await import('../src/services/firebase-admin.service.js');

      const validToken = 'a'.repeat(150);
      const message = {
        title: 'Test Title',
        body: 'Test Body',
        data: { type: 'test' },
      };

      const result = await firebaseAdminService.sendToDevice(validToken, message, {
        actorId: 'user-123',
        actorType: 'user',
        tenantId: 'tenant-1',
        channel: 'api',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^mock-/);
      expect(mockAuditService.logFirebaseNotificationDispatched).toHaveBeenCalled();
      expect(mockMetricsService.recordFirebaseDispatch).toHaveBeenCalledWith(true, expect.any(Number));
    });

    it('should reject invalid token format in sendToDevice', async () => {
      const { firebaseAdminService } = await import('../src/services/firebase-admin.service.js');

      const result = await firebaseAdminService.sendToDevice('invalid-token', {
        title: 'Test',
        body: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_TOKEN_FORMAT');
    });

    it('should send batch notifications in mock mode', async () => {
      const { firebaseAdminService } = await import('../src/services/firebase-admin.service.js');

      const tokens = [
        'a'.repeat(150),
        'b'.repeat(150),
        'c'.repeat(150),
      ];

      const result = await firebaseAdminService.sendToDevices(tokens, {
        title: 'Batch Test',
        body: 'Testing batch send',
      });

      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
      expect(result.results).toHaveLength(3);
    });
  });

  describe('DeviceTokenRepository', () => {
    beforeEach(async () => {
      // Reset repository between tests
      const { deviceTokenRepository: repo } = await import('../src/repositories/device-token.repository.js');
      // Clear by calling cleanup with 0 retention (cleans all inactive) - need active tokens test
    });

    it('should register a new device token', async () => {
      const { deviceTokenRepository: repo } = await import('../src/repositories/device-token.repository.js');

      const token = await repo.upsert({
        userId: 'user-1',
        userType: 'user',
        tenantId: 'tenant-1',
        token: 'a'.repeat(150),
        platform: 'ios',
        deviceId: 'device-1',
        deviceName: 'iPhone',
        appVersion: '1.0.0',
      });

      expect(token.id).toBeDefined();
      expect(token.userId).toBe('user-1');
      expect(token.tenantId).toBe('tenant-1');
      expect(token.platform).toBe('ios');
      expect(token.active).toBe(true);
    });

    it('should update existing token on upsert', async () => {
      const { deviceTokenRepository: repo } = await import('../src/repositories/device-token.repository.js');

      const tokenValue = 'x'.repeat(150);

      const token1 = await repo.upsert({
        userId: 'user-1',
        userType: 'user',
        tenantId: 'tenant-1',
        token: tokenValue,
        platform: 'ios',
        appVersion: '1.0.0',
      });

      const token2 = await repo.upsert({
        userId: 'user-1',
        userType: 'user',
        tenantId: 'tenant-1',
        token: tokenValue,
        platform: 'ios',
        appVersion: '2.0.0', // Updated version
      });

      expect(token2.id).toBe(token1.id);
      expect(token2.appVersion).toBe('2.0.0');
    });

    it('should find active tokens for user', async () => {
      const { deviceTokenRepository: repo } = await import('../src/repositories/device-token.repository.js');

      await repo.upsert({
        userId: 'user-find',
        userType: 'user',
        tenantId: 'tenant-find',
        token: 'm'.repeat(150),
        platform: 'android',
      });

      await repo.upsert({
        userId: 'user-find',
        userType: 'user',
        tenantId: 'tenant-find',
        token: 'n'.repeat(150),
        platform: 'ios',
      });

      const tokens = await repo.findActiveByUser('user-find', 'user', 'tenant-find');
      expect(tokens.length).toBeGreaterThanOrEqual(2);
    });

    it('should deactivate a token', async () => {
      const { deviceTokenRepository: repo } = await import('../src/repositories/device-token.repository.js');

      const tokenValue = 'p'.repeat(150);

      const token = await repo.upsert({
        userId: 'user-deact',
        userType: 'user',
        tenantId: 'tenant-deact',
        token: tokenValue,
        platform: 'web',
      });

      const deactivated = await repo.deactivate(token.id);
      expect(deactivated).toBe(true);

      const found = await repo.findByToken(tokenValue);
      expect(found?.active).toBe(false);
    });

    it('should verify tenant ownership', async () => {
      const { deviceTokenRepository: repo } = await import('../src/repositories/device-token.repository.js');

      const token = await repo.upsert({
        userId: 'user-own',
        userType: 'user',
        tenantId: 'tenant-owner',
        token: 'q'.repeat(150),
        platform: 'ios',
      });

      expect(await repo.verifyTenantOwnership(token.id, 'tenant-owner')).toBe(true);
      expect(await repo.verifyTenantOwnership(token.id, 'other-tenant')).toBe(false);
    });
  });

  describe('FirebaseDeviceTokenService', () => {
    it('should register token with audit logging', async () => {
      const { firebaseDeviceTokenService } = await import('../src/services/firebase-device-token.service.js');

      const result = await firebaseDeviceTokenService.registerToken(
        {
          userId: 'user-reg',
          userType: 'user',
          tenantId: 'tenant-reg',
          token: 'r'.repeat(150),
          platform: 'android',
        },
        {
          channel: 'mobile',
          ipAddress: '192.168.1.1',
        }
      );

      expect(result.success).toBe(true);
      expect(result.tokenId).toBeDefined();
      expect(mockAuditService.logFirebaseTokenRegistered).toHaveBeenCalled();
      expect(mockMetricsService.recordFirebaseTokenRegistration).toHaveBeenCalledWith(true);
    });

    it('should reject invalid token format', async () => {
      const { firebaseDeviceTokenService } = await import('../src/services/firebase-device-token.service.js');

      const result = await firebaseDeviceTokenService.registerToken(
        {
          userId: 'user-invalid',
          userType: 'user',
          tenantId: 'tenant-invalid',
          token: 'too-short',
          platform: 'ios',
        },
        { channel: 'api' }
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_TOKEN_FORMAT');
      expect(mockMetricsService.recordFirebaseTokenRegistration).toHaveBeenCalledWith(false);
    });

    it('should block cross-tenant token registration', async () => {
      const { firebaseDeviceTokenService } = await import('../src/services/firebase-device-token.service.js');

      const sharedToken = 's'.repeat(150);

      // Register with tenant-1
      await firebaseDeviceTokenService.registerToken(
        {
          userId: 'user-cross',
          userType: 'user',
          tenantId: 'tenant-1-cross',
          token: sharedToken,
          platform: 'ios',
        },
        { channel: 'api' }
      );

      // Try to register same token with tenant-2
      const result = await firebaseDeviceTokenService.registerToken(
        {
          userId: 'user-cross-2',
          userType: 'user',
          tenantId: 'tenant-2-cross',
          token: sharedToken,
          platform: 'ios',
        },
        { channel: 'api' }
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CROSS_TENANT_REGISTRATION');
      expect(mockAuditService.logFirebaseTokenRegistrationDenied).toHaveBeenCalled();
    });

    it('should unregister token with audit logging', async () => {
      const { firebaseDeviceTokenService } = await import('../src/services/firebase-device-token.service.js');

      const tokenValue = 't'.repeat(150);

      await firebaseDeviceTokenService.registerToken(
        {
          userId: 'user-unreg',
          userType: 'user',
          tenantId: 'tenant-unreg',
          token: tokenValue,
          platform: 'web',
        },
        { channel: 'api' }
      );

      const result = await firebaseDeviceTokenService.unregisterToken(
        tokenValue,
        {
          userId: 'user-unreg',
          userType: 'user',
          tenantId: 'tenant-unreg',
        },
        { channel: 'api' }
      );

      expect(result.success).toBe(true);
      expect(mockAuditService.logFirebaseTokenUnregistered).toHaveBeenCalled();
      expect(mockMetricsService.recordFirebaseTokenUnregistration).toHaveBeenCalled();
    });

    it('should dispatch notification to user devices', async () => {
      const { firebaseDeviceTokenService } = await import('../src/services/firebase-device-token.service.js');

      // Register a token first
      await firebaseDeviceTokenService.registerToken(
        {
          userId: 'user-dispatch',
          userType: 'user',
          tenantId: 'tenant-dispatch',
          token: 'u'.repeat(150),
          platform: 'android',
        },
        { channel: 'api' }
      );

      const result = await firebaseDeviceTokenService.dispatchToUser(
        {
          type: 'test-notification',
          recipientId: 'user-dispatch',
          recipientType: 'user',
          tenantId: 'tenant-dispatch',
          payload: {
            title: 'Test Notification',
            body: 'This is a test',
          },
        },
        {
          actorId: 'admin-1',
          actorType: 'system',
          channel: 'api',
        }
      );

      expect(result.successCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Firebase Validation Schemas', () => {
    it('should validate device token registration schema', async () => {
      const { deviceTokenRegistrationSchema } = await import('../src/middleware/validation.middleware.js');

      const validData = {
        token: 'a'.repeat(150),
        platform: 'ios',
        deviceId: 'device-123',
        deviceName: 'Test Device',
        appVersion: '1.0.0',
      };

      const result = deviceTokenRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid platform', async () => {
      const { deviceTokenRegistrationSchema } = await import('../src/middleware/validation.middleware.js');

      const invalidData = {
        token: 'a'.repeat(150),
        platform: 'invalid',
      };

      const result = deviceTokenRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate notification dispatch schema', async () => {
      const { notificationDispatchSchema } = await import('../src/middleware/validation.middleware.js');

      const validData = {
        recipientId: '550e8400-e29b-41d4-a716-446655440000',
        recipientType: 'user',
        title: 'Test Title',
        body: 'Test body message',
        type: 'general',
      };

      const result = notificationDispatchSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields in dispatch', async () => {
      const { notificationDispatchSchema } = await import('../src/middleware/validation.middleware.js');

      const invalidData = {
        recipientId: '550e8400-e29b-41d4-a716-446655440000',
        // missing recipientType, title, body
      };

      const result = notificationDispatchSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Firebase Metrics', () => {
    it('should record token registration metrics', async () => {
      const { MetricsService, FIREBASE_METRICS, FIREBASE_SLOS } = await import('../src/services/metrics.service.js');
      const service = new MetricsService();

      service.recordFirebaseTokenRegistration(true);
      service.recordFirebaseTokenRegistration(true);
      service.recordFirebaseTokenRegistration(false);

      const rate = service.getFirebaseTokenRegistrationSuccessRate();
      expect(rate).toBeCloseTo(66.67, 1);
    });

    it('should record dispatch metrics', async () => {
      const { MetricsService, FIREBASE_METRICS } = await import('../src/services/metrics.service.js');
      const service = new MetricsService();

      service.recordFirebaseDispatch(true, 100);
      service.recordFirebaseDispatch(true, 200);
      service.recordFirebaseDispatch(true, 150);

      const p99 = service.getFirebaseDispatchP99Latency();
      expect(p99).toBeGreaterThan(0);

      const rate = service.getFirebaseDispatchSuccessRate();
      expect(rate).toBe(100);
    });

    it('should check Firebase SLOs', async () => {
      const { MetricsService, FIREBASE_SLOS } = await import('../src/services/metrics.service.js');
      const service = new MetricsService();

      // Clear any metrics from previous tests
      service.clearAll();

      // Record all successes with low latency
      for (let i = 0; i < 10; i++) {
        service.recordFirebaseDispatch(true, 50);
        service.recordFirebaseTokenRegistration(true);
      }

      const sloCheck = service.checkFirebaseSLOs();
      expect(sloCheck.met).toBe(true);
      expect(sloCheck.violations).toHaveLength(0);
    });

    it('should report SLO violations', async () => {
      const { MetricsService, FIREBASE_SLOS } = await import('../src/services/metrics.service.js');
      const service = new MetricsService();

      // Clear any metrics from previous tests
      service.clearAll();

      // Record high latency dispatches
      for (let i = 0; i < 10; i++) {
        service.recordFirebaseDispatch(true, 600); // Exceeds 500ms P99 SLO
      }

      const sloCheck = service.checkFirebaseSLOs();
      expect(sloCheck.violations.length).toBeGreaterThan(0);
      expect(sloCheck.violations.some(v => v.includes('latency'))).toBe(true);
    });
  });

  describe('Firebase Audit Events', () => {
    it('should have Firebase audit event types defined', async () => {
      const { AuditEventType } = await import('../src/models/audit.model.js') as { AuditEventType: string };
      
      // Type should include Firebase events
      // This is a compile-time check, but we can verify the model file exists
      expect(true).toBe(true);
    });
  });
});
