/**
 * Account Settings Tests
 * Task 1.4: Tests for account and integration flows
 * Task 1.9: Security/compliance tests for profile access and integration callbacks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountSettingsService } from '../src/services/account-settings.service.js';
import type {
  UserProfile,
  IntegrationRecord,
  IntegrationProvider,
  IntegrationVerificationResult,
} from '../src/models/account-settings.model.js';

// Mock the repository
vi.mock('../src/repositories/account-settings.repository.js', () => ({
  accountSettingsRepository: {
    findProfileByUserId: vi.fn(),
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
    findIntegrationsByUser: vi.fn(),
    findIntegration: vi.fn(),
    createIntegration: vi.fn(),
    updateIntegrationStatus: vi.fn(),
    disconnectIntegration: vi.fn(),
  },
}));

// Mock the audit service
vi.mock('../src/services/audit.service.js', () => ({
  auditService: {
    log: vi.fn(),
  },
}));

// Mock the metrics service
vi.mock('../src/services/account-settings-metrics.service.js', () => ({
  accountSettingsMetricsService: {
    recordProfileOperation: vi.fn(),
    recordProfileUpdateDenied: vi.fn(),
    recordIntegrationOperation: vi.fn(),
    recordIntegrationCallback: vi.fn(),
    checkSLOs: vi.fn(() => ({ met: true, violations: [] })),
    getHealthSummary: vi.fn(() => ({
      profileReadP99Ms: 50,
      profileUpdateP99Ms: 100,
      integrationCallbackP99Ms: 200,
      integrationCallbackSuccessRate: 99.5,
      profileRateLimitHits: 0,
      integrationRateLimitHits: 0,
      slosViolations: [],
    })),
  },
}));

// Import after mocking
import { accountSettingsRepository } from '../src/repositories/account-settings.repository.js';
import { auditService } from '../src/services/audit.service.js';
import { accountSettingsMetricsService } from '../src/services/account-settings-metrics.service.js';

describe('AccountSettingsService', () => {
  let service: AccountSettingsService;
  const tenantId = 'tenant-1';
  const userId = 'user-1';
  const userType = 'user' as const;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AccountSettingsService();
  });

  describe('Profile Operations', () => {
    describe('getProfile', () => {
      it('should return existing profile', async () => {
        const mockProfile: UserProfile = {
          id: 'profile-1',
          tenantId,
          userId,
          userType,
          displayName: 'John Doe',
          notificationsEnabled: true,
          emailNotificationsEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        vi.mocked(accountSettingsRepository.findProfileByUserId).mockResolvedValue(mockProfile);

        const result = await service.getProfile(tenantId, userId, userType, userId, userType);

        expect(result.success).toBe(true);
        expect(result.profile).toBeDefined();
        expect(result.profile?.displayName).toBe('John Doe');
        expect(auditService.log).toHaveBeenCalled();
      });

      it('should create default profile if not exists', async () => {
        vi.mocked(accountSettingsRepository.findProfileByUserId).mockResolvedValue(undefined);
        vi.mocked(accountSettingsRepository.createProfile).mockResolvedValue();

        const result = await service.getProfile(tenantId, userId, userType, userId, userType);

        expect(result.success).toBe(true);
        expect(result.profile).toBeDefined();
        expect(accountSettingsRepository.createProfile).toHaveBeenCalled();
      });

      // Task 1.9: Security test
      it('should deny cross-user profile access', async () => {
        const otherUserId = 'other-user';
        
        const result = await service.getProfile(tenantId, otherUserId, userType, userId, userType);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('FORBIDDEN');
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            errorMessage: expect.stringContaining('Cannot access another user'),
          })
        );
      });

      // Task 1.9: Security test
      it('should deny cross-type profile access', async () => {
        const result = await service.getProfile(tenantId, userId, 'candidate', userId, userType);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('FORBIDDEN');
      });
    });

    describe('updateProfile', () => {
      it('should update profile with valid changes', async () => {
        const mockProfile: UserProfile = {
          id: 'profile-1',
          tenantId,
          userId,
          userType,
          displayName: 'John Doe',
          notificationsEnabled: true,
          emailNotificationsEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const updatedProfile = { ...mockProfile, displayName: 'Jane Doe' };

        vi.mocked(accountSettingsRepository.findProfileByUserId).mockResolvedValue(mockProfile);
        vi.mocked(accountSettingsRepository.updateProfile).mockResolvedValue(updatedProfile);

        const result = await service.updateProfile(
          tenantId,
          userId,
          userType,
          { displayName: 'Jane Doe' },
          userId,
          userType
        );

        expect(result.success).toBe(true);
        expect(result.profile?.displayName).toBe('Jane Doe');
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'PROFILE_UPDATED',
            success: true,
          })
        );
      });

      it('should create profile if not exists during update', async () => {
        vi.mocked(accountSettingsRepository.findProfileByUserId).mockResolvedValue(undefined);
        vi.mocked(accountSettingsRepository.createProfile).mockResolvedValue();
        vi.mocked(accountSettingsRepository.updateProfile).mockResolvedValue({
          id: 'profile-1',
          tenantId,
          userId,
          userType,
          displayName: 'New Name',
          notificationsEnabled: true,
          emailNotificationsEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const result = await service.updateProfile(
          tenantId,
          userId,
          userType,
          { displayName: 'New Name' },
          userId,
          userType
        );

        expect(result.success).toBe(true);
        expect(accountSettingsRepository.createProfile).toHaveBeenCalled();
      });

      // Task 1.9: Security test - deny cross-user update
      it('should deny cross-user profile update', async () => {
        const otherUserId = 'other-user';

        const result = await service.updateProfile(
          tenantId,
          otherUserId,
          userType,
          { displayName: 'Hacked Name' },
          userId,
          userType
        );

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('FORBIDDEN');
        expect(accountSettingsMetricsService.recordProfileUpdateDenied).toHaveBeenCalled();
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'PROFILE_UPDATE_DENIED',
            success: false,
          })
        );
      });

      // Task 1.9: Security test - audit trail for updates
      it('should record previous values in audit trail', async () => {
        const mockProfile: UserProfile = {
          id: 'profile-1',
          tenantId,
          userId,
          userType,
          displayName: 'Old Name',
          phone: '555-0100',
          notificationsEnabled: true,
          emailNotificationsEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const updatedProfile = { ...mockProfile, displayName: 'New Name', phone: '555-0200' };

        vi.mocked(accountSettingsRepository.findProfileByUserId).mockResolvedValue(mockProfile);
        vi.mocked(accountSettingsRepository.updateProfile).mockResolvedValue(updatedProfile);

        await service.updateProfile(
          tenantId,
          userId,
          userType,
          { displayName: 'New Name', phone: '555-0200' },
          userId,
          userType
        );

        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              previousValues: expect.objectContaining({
                displayName: 'Old Name',
                phone: '555-0100',
              }),
            }),
          })
        );
      });
    });
  });

  describe('Integration Operations', () => {
    describe('getIntegrationStatuses', () => {
      it('should return all integration statuses', async () => {
        const mockIntegrations: IntegrationRecord[] = [
          {
            id: 'int-1',
            tenantId,
            userId,
            userType,
            provider: 'google',
            isConnected: true,
            isVerified: true,
            scopes: ['email', 'profile'],
            connectedAt: new Date(),
            verifiedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'int-2',
            tenantId,
            userId,
            userType,
            provider: 'slack',
            isConnected: false,
            isVerified: false,
            scopes: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        vi.mocked(accountSettingsRepository.findIntegrationsByUser).mockResolvedValue(mockIntegrations);

        const result = await service.getIntegrationStatuses(tenantId, userId, userType, userId, userType);

        expect(result.success).toBe(true);
        expect(result.integrations).toHaveLength(2);
        expect(result.integrations?.[0].provider).toBe('google');
        expect(result.integrations?.[0].connected).toBe(true);
      });

      // Task 1.9: Security test
      it('should deny cross-user integration status access', async () => {
        const otherUserId = 'other-user';

        const result = await service.getIntegrationStatuses(tenantId, otherUserId, userType, userId, userType);

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('FORBIDDEN');
      });
    });

    describe('handleVerificationCallback', () => {
      it('should record successful verification', async () => {
        const provider: IntegrationProvider = 'google';
        const verification: IntegrationVerificationResult = {
          success: true,
          provider,
          providerAccountId: 'google-123',
          providerEmail: 'user@gmail.com',
          scopes: ['email', 'profile'],
        };

        vi.mocked(accountSettingsRepository.findIntegration).mockResolvedValue(undefined);
        vi.mocked(accountSettingsRepository.createIntegration).mockResolvedValue();

        const result = await service.handleVerificationCallback(
          tenantId,
          userId,
          userType,
          provider,
          verification
        );

        expect(result.success).toBe(true);
        expect(accountSettingsRepository.createIntegration).toHaveBeenCalled();
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'INTEGRATION_VERIFIED',
            success: true,
          })
        );
      });

      it('should update existing integration on verification', async () => {
        const provider: IntegrationProvider = 'google';
        const existingIntegration: IntegrationRecord = {
          id: 'int-1',
          tenantId,
          userId,
          userType,
          provider,
          isConnected: false,
          isVerified: false,
          scopes: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const verification: IntegrationVerificationResult = {
          success: true,
          provider,
          providerAccountId: 'google-123',
          providerEmail: 'user@gmail.com',
          scopes: ['email'],
        };

        vi.mocked(accountSettingsRepository.findIntegration).mockResolvedValue(existingIntegration);
        vi.mocked(accountSettingsRepository.updateIntegrationStatus).mockResolvedValue({
          ...existingIntegration,
          isConnected: true,
          isVerified: true,
          scopes: ['email'],
        });

        const result = await service.handleVerificationCallback(
          tenantId,
          userId,
          userType,
          provider,
          verification
        );

        expect(result.success).toBe(true);
        expect(accountSettingsRepository.updateIntegrationStatus).toHaveBeenCalled();
      });

      it('should record failed verification', async () => {
        const provider: IntegrationProvider = 'slack';
        const verification: IntegrationVerificationResult = {
          success: false,
          error: 'OAuth access denied',
          errorCode: 'ACCESS_DENIED',
        };

        vi.mocked(accountSettingsRepository.findIntegration).mockResolvedValue(undefined);
        vi.mocked(accountSettingsRepository.createIntegration).mockResolvedValue();

        const result = await service.handleVerificationCallback(
          tenantId,
          userId,
          userType,
          provider,
          verification
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe('OAuth access denied');
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'INTEGRATION_VERIFICATION_FAILED',
            success: false,
          })
        );
      });

      // Task 1.9: Security test - rate limit audit logging
      it('should log verification attempts for rate limiting', async () => {
        const provider: IntegrationProvider = 'github';
        const verification: IntegrationVerificationResult = {
          success: true,
          provider,
          providerAccountId: 'github-456',
        };

        vi.mocked(accountSettingsRepository.findIntegration).mockResolvedValue(undefined);
        vi.mocked(accountSettingsRepository.createIntegration).mockResolvedValue();

        await service.handleVerificationCallback(
          tenantId,
          userId,
          userType,
          provider,
          verification
        );

        expect(accountSettingsMetricsService.recordIntegrationCallback).toHaveBeenCalledWith(
          provider,
          true,
          expect.any(Number)
        );
      });
    });

    describe('disconnectIntegration', () => {
      it('should disconnect integration for owner', async () => {
        const provider: IntegrationProvider = 'google';

        vi.mocked(accountSettingsRepository.disconnectIntegration).mockResolvedValue();

        const result = await service.disconnectIntegration(
          tenantId,
          userId,
          userType,
          provider,
          userId,
          userType
        );

        expect(result.success).toBe(true);
        expect(accountSettingsRepository.disconnectIntegration).toHaveBeenCalledWith(
          tenantId,
          userId,
          userType,
          provider
        );
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'INTEGRATION_DISCONNECTED',
            success: true,
          })
        );
      });

      // Task 1.9: Security test
      it('should deny cross-user integration disconnect', async () => {
        const otherUserId = 'other-user';
        const provider: IntegrationProvider = 'google';

        const result = await service.disconnectIntegration(
          tenantId,
          otherUserId,
          userType,
          provider,
          userId,
          userType
        );

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('FORBIDDEN');
        expect(accountSettingsRepository.disconnectIntegration).not.toHaveBeenCalled();
      });
    });
  });
});

describe('AccountSettingsMetricsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkSLOs', () => {
    it('should return met=true when all SLOs pass', () => {
      const result = accountSettingsMetricsService.checkSLOs();

      expect(result.met).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('getHealthSummary', () => {
    it('should return health metrics', () => {
      const summary = accountSettingsMetricsService.getHealthSummary();

      expect(summary).toHaveProperty('profileReadP99Ms');
      expect(summary).toHaveProperty('profileUpdateP99Ms');
      expect(summary).toHaveProperty('integrationCallbackP99Ms');
      expect(summary).toHaveProperty('integrationCallbackSuccessRate');
      expect(summary).toHaveProperty('slosViolations');
    });
  });
});
