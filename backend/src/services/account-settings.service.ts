/**
 * Account Settings Service
 * Task 1.2, 1.3, 1.5, 1.6: Profile and integration management with RBAC and audit
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  UserProfile,
  ProfileUpdateRequest,
  ProfileResponse,
  IntegrationRecord,
  IntegrationProvider,
  IntegrationStatusResponse,
  IntegrationVerificationResult,
} from '../models/account-settings.model.js';
import { accountSettingsRepository } from '../repositories/account-settings.repository.js';
import { auditService } from './audit.service.js';
import { accountSettingsMetricsService } from './account-settings-metrics.service.js';

export interface ProfileReadResult {
  success: boolean;
  profile?: ProfileResponse;
  error?: string;
  errorCode?: string;
}

export interface ProfileUpdateResult {
  success: boolean;
  profile?: ProfileResponse;
  error?: string;
  errorCode?: string;
}

export interface IntegrationStatusResult {
  success: boolean;
  integrations?: IntegrationStatusResponse[];
  error?: string;
  errorCode?: string;
}

/**
 * Convert internal profile to response
 */
function toProfileResponse(profile: UserProfile): ProfileResponse {
  return {
    id: profile.id,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    phone: profile.phone,
    timezone: profile.timezone,
    locale: profile.locale,
    bio: profile.bio,
    notificationsEnabled: profile.notificationsEnabled,
    emailNotificationsEnabled: profile.emailNotificationsEnabled,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

/**
 * Convert integration record to status response
 */
function toIntegrationStatus(record: IntegrationRecord): IntegrationStatusResponse {
  return {
    provider: record.provider,
    connected: record.isConnected,
    verified: record.isVerified,
    providerEmail: record.providerEmail,
    scopes: record.scopes,
    connectedAt: record.connectedAt,
    verifiedAt: record.verifiedAt,
    hasError: !!record.lastVerificationError,
    errorMessage: record.lastVerificationError,
  };
}

export class AccountSettingsService {
  // ==================== PROFILE OPERATIONS ====================

  /**
   * Get user profile (Task 1.2)
   * Creates default profile if not exists
   */
  async getProfile(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    requesterId: string,
    requesterType: 'user' | 'candidate',
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string
  ): Promise<ProfileReadResult> {
    const startTime = Date.now();

    try {
      // Task 1.5: Enforce tenant scoping - users can only read their own profile
      if (userId !== requesterId || userType !== requesterType) {
        auditService.log({
          eventType: 'PROFILE_UPDATE_DENIED' as any,
          actorId: requesterId,
          actorType: requesterType,
          targetId: userId,
          targetType: userType,
          channel,
          ipAddress,
          metadata: { tenantId, action: 'read', reason: 'Cross-user profile access denied' },
          success: false,
          errorMessage: 'Cannot access another user profile',
        });

        accountSettingsMetricsService.recordProfileOperation('read', false, Date.now() - startTime);
        return {
          success: false,
          error: 'Access denied',
          errorCode: 'FORBIDDEN',
        };
      }

      let profile = await accountSettingsRepository.findProfileByUserId(tenantId, userId, userType);

      // Create default profile if not exists
      if (!profile) {
        const now = new Date();
        profile = {
          id: uuidv4(),
          tenantId,
          userId,
          userType,
          notificationsEnabled: true,
          emailNotificationsEnabled: true,
          createdAt: now,
          updatedAt: now,
        };
        await accountSettingsRepository.createProfile(profile);
      }

      // Task 1.6: Audit logging
      auditService.log({
        eventType: 'PROFILE_READ' as any,
        actorId: requesterId,
        actorType: requesterType,
        targetId: userId,
        targetType: userType,
        channel,
        ipAddress,
        metadata: { tenantId },
        success: true,
      });

      accountSettingsMetricsService.recordProfileOperation('read', true, Date.now() - startTime);

      return {
        success: true,
        profile: toProfileResponse(profile),
      };
    } catch (error) {
      console.error('[AccountSettingsService] Error reading profile:', error);
      accountSettingsMetricsService.recordProfileOperation('read', false, Date.now() - startTime);
      return {
        success: false,
        error: 'Failed to read profile',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Update user profile (Task 1.2, 1.5)
   */
  async updateProfile(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    updates: ProfileUpdateRequest,
    requesterId: string,
    requesterType: 'user' | 'candidate',
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string,
    userAgent?: string
  ): Promise<ProfileUpdateResult> {
    const startTime = Date.now();

    try {
      // Task 1.5: Enforce tenant scoping and RBAC - users can only update their own profile
      if (userId !== requesterId || userType !== requesterType) {
        auditService.log({
          eventType: 'PROFILE_UPDATE_DENIED' as any,
          actorId: requesterId,
          actorType: requesterType,
          targetId: userId,
          targetType: userType,
          channel,
          ipAddress,
          userAgent,
          metadata: { tenantId, updates: Object.keys(updates), reason: 'Cross-user profile update denied' },
          success: false,
          errorMessage: 'Cannot update another user profile',
        });

        accountSettingsMetricsService.recordProfileOperation('update', false, Date.now() - startTime);
        accountSettingsMetricsService.recordProfileUpdateDenied(tenantId, userId);
        return {
          success: false,
          error: 'Access denied',
          errorCode: 'FORBIDDEN',
        };
      }

      // Check if profile exists, create if not
      let profile = await accountSettingsRepository.findProfileByUserId(tenantId, userId, userType);
      if (!profile) {
        const now = new Date();
        profile = {
          id: uuidv4(),
          tenantId,
          userId,
          userType,
          notificationsEnabled: true,
          emailNotificationsEnabled: true,
          createdAt: now,
          updatedAt: now,
        };
        await accountSettingsRepository.createProfile(profile);
      }

      // Capture previous values for audit
      const previousValues: Record<string, unknown> = {};
      if (updates.displayName !== undefined) previousValues.displayName = profile.displayName;
      if (updates.avatarUrl !== undefined) previousValues.avatarUrl = profile.avatarUrl;
      if (updates.phone !== undefined) previousValues.phone = profile.phone;
      if (updates.timezone !== undefined) previousValues.timezone = profile.timezone;
      if (updates.locale !== undefined) previousValues.locale = profile.locale;
      if (updates.bio !== undefined) previousValues.bio = profile.bio;
      if (updates.notificationsEnabled !== undefined) previousValues.notificationsEnabled = profile.notificationsEnabled;
      if (updates.emailNotificationsEnabled !== undefined) previousValues.emailNotificationsEnabled = profile.emailNotificationsEnabled;

      // Update profile
      const updatedProfile = await accountSettingsRepository.updateProfile(
        tenantId,
        userId,
        userType,
        updates
      );

      if (!updatedProfile) {
        return {
          success: false,
          error: 'Profile not found',
          errorCode: 'NOT_FOUND',
        };
      }

      // Task 1.6: Audit logging with previous values
      auditService.log({
        eventType: 'PROFILE_UPDATED' as any,
        actorId: requesterId,
        actorType: requesterType,
        targetId: userId,
        targetType: userType,
        channel,
        ipAddress,
        userAgent,
        metadata: {
          tenantId,
          changes: updates,
          previousValues,
        },
        success: true,
      });

      accountSettingsMetricsService.recordProfileOperation('update', true, Date.now() - startTime);

      return {
        success: true,
        profile: toProfileResponse(updatedProfile),
      };
    } catch (error) {
      console.error('[AccountSettingsService] Error updating profile:', error);
      accountSettingsMetricsService.recordProfileOperation('update', false, Date.now() - startTime);
      return {
        success: false,
        error: 'Failed to update profile',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  // ==================== INTEGRATION OPERATIONS ====================

  /**
   * Get all integration statuses for user (Task 1.3)
   */
  async getIntegrationStatuses(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    requesterId: string,
    requesterType: 'user' | 'candidate',
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string
  ): Promise<IntegrationStatusResult> {
    const startTime = Date.now();

    try {
      // Task 1.5: Enforce access control
      if (userId !== requesterId || userType !== requesterType) {
        auditService.log({
          eventType: 'INTEGRATION_ACCESS_DENIED' as any,
          actorId: requesterId,
          actorType: requesterType,
          targetId: userId,
          targetType: userType,
          channel,
          ipAddress,
          metadata: { tenantId, action: 'list_integrations' },
          success: false,
          errorMessage: 'Cannot access integration statuses for another user',
        });

        accountSettingsMetricsService.recordIntegrationOperation('status_read', false, Date.now() - startTime);
        return {
          success: false,
          error: 'Access denied',
          errorCode: 'FORBIDDEN',
        };
      }

      const records = await accountSettingsRepository.findIntegrationsByUser(tenantId, userId, userType);

      // Task 1.6: Audit logging
      auditService.log({
        eventType: 'INTEGRATION_STATUS_READ' as any,
        actorId: requesterId,
        actorType: requesterType,
        channel,
        ipAddress,
        metadata: { tenantId, integrationCount: records.length },
        success: true,
      });

      accountSettingsMetricsService.recordIntegrationOperation('status_read', true, Date.now() - startTime);

      return {
        success: true,
        integrations: records.map(toIntegrationStatus),
      };
    } catch (error) {
      console.error('[AccountSettingsService] Error reading integration statuses:', error);
      accountSettingsMetricsService.recordIntegrationOperation('status_read', false, Date.now() - startTime);
      return {
        success: false,
        error: 'Failed to read integration statuses',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Get single integration status (Task 1.3)
   */
  async getIntegrationStatus(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    provider: IntegrationProvider,
    requesterId: string,
    requesterType: 'user' | 'candidate',
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string
  ): Promise<{ success: boolean; integration?: IntegrationStatusResponse; error?: string; errorCode?: string }> {
    const startTime = Date.now();

    try {
      // Task 1.5: Enforce access control
      if (userId !== requesterId || userType !== requesterType) {
        auditService.log({
          eventType: 'INTEGRATION_ACCESS_DENIED' as any,
          actorId: requesterId,
          actorType: requesterType,
          targetId: userId,
          targetType: userType,
          channel,
          ipAddress,
          metadata: { tenantId, provider, action: 'get_integration' },
          success: false,
          errorMessage: 'Cannot access integration status for another user',
        });

        accountSettingsMetricsService.recordIntegrationOperation('status_read', false, Date.now() - startTime);
        return {
          success: false,
          error: 'Access denied',
          errorCode: 'FORBIDDEN',
        };
      }

      const record = await accountSettingsRepository.findIntegration(tenantId, userId, userType, provider);

      accountSettingsMetricsService.recordIntegrationOperation('status_read', true, Date.now() - startTime);

      if (!record) {
        return {
          success: true,
          integration: {
            provider,
            connected: false,
            verified: false,
            scopes: [],
            hasError: false,
          },
        };
      }

      return {
        success: true,
        integration: toIntegrationStatus(record),
      };
    } catch (error) {
      console.error('[AccountSettingsService] Error reading integration status:', error);
      accountSettingsMetricsService.recordIntegrationOperation('status_read', false, Date.now() - startTime);
      return {
        success: false,
        error: 'Failed to read integration status',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Handle integration verification callback (Task 1.3)
   * Called after OAuth flow completes
   */
  async handleVerificationCallback(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    provider: IntegrationProvider,
    verification: IntegrationVerificationResult,
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; integration?: IntegrationStatusResponse; error?: string; errorCode?: string }> {
    const startTime = Date.now();

    try {
      const now = new Date();

      if (!verification.success) {
        // Record failed verification
        let record = await accountSettingsRepository.findIntegration(tenantId, userId, userType, provider);
        
        if (record) {
          await accountSettingsRepository.updateIntegrationStatus(
            tenantId,
            userId,
            userType,
            provider,
            {
              isVerified: false,
              lastVerificationError: verification.error || 'Verification failed',
            }
          );
        } else {
          record = {
            id: uuidv4(),
            tenantId,
            userId,
            userType,
            provider,
            isConnected: false,
            isVerified: false,
            scopes: [],
            lastVerificationError: verification.error || 'Verification failed',
            createdAt: now,
            updatedAt: now,
          };
          await accountSettingsRepository.createIntegration(record);
        }

        // Task 1.6: Audit logging
        auditService.log({
          eventType: 'INTEGRATION_VERIFICATION_FAILED' as any,
          actorId: userId,
          actorType: userType,
          channel,
          ipAddress,
          userAgent,
          metadata: {
            tenantId,
            provider,
            error: verification.error,
            errorCode: verification.errorCode,
          },
          success: false,
          errorMessage: verification.error,
        });

        accountSettingsMetricsService.recordIntegrationCallback(provider, false, Date.now() - startTime);

        return {
          success: false,
          error: verification.error || 'Verification failed',
          errorCode: verification.errorCode || 'VERIFICATION_FAILED',
        };
      }

      // Record successful verification
      let record = await accountSettingsRepository.findIntegration(tenantId, userId, userType, provider);

      if (record) {
        record = await accountSettingsRepository.updateIntegrationStatus(
          tenantId,
          userId,
          userType,
          provider,
          {
            isConnected: true,
            isVerified: true,
            providerAccountId: verification.providerAccountId,
            providerEmail: verification.providerEmail,
            scopes: verification.scopes || [],
            connectedAt: record.connectedAt || now,
            verifiedAt: now,
            lastVerificationError: undefined,
          }
        );
      } else {
        const newRecord: IntegrationRecord = {
          id: uuidv4(),
          tenantId,
          userId,
          userType,
          provider,
          providerAccountId: verification.providerAccountId,
          providerEmail: verification.providerEmail,
          isConnected: true,
          isVerified: true,
          scopes: verification.scopes || [],
          connectedAt: now,
          verifiedAt: now,
          createdAt: now,
          updatedAt: now,
        };
        await accountSettingsRepository.createIntegration(newRecord);
        record = newRecord;
      }

      // Task 1.6: Audit logging
      auditService.log({
        eventType: 'INTEGRATION_VERIFIED' as any,
        actorId: userId,
        actorType: userType,
        channel,
        ipAddress,
        userAgent,
        metadata: {
          tenantId,
          provider,
          providerAccountId: verification.providerAccountId,
          providerEmail: verification.providerEmail,
          scopes: verification.scopes,
        },
        success: true,
      });

      accountSettingsMetricsService.recordIntegrationCallback(provider, true, Date.now() - startTime);

      return {
        success: true,
        integration: record ? toIntegrationStatus(record) : undefined,
      };
    } catch (error) {
      console.error('[AccountSettingsService] Error handling verification callback:', error);
      accountSettingsMetricsService.recordIntegrationCallback(provider, false, Date.now() - startTime);
      return {
        success: false,
        error: 'Failed to process verification callback',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Disconnect an integration (Task 1.3)
   */
  async disconnectIntegration(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    provider: IntegrationProvider,
    requesterId: string,
    requesterType: 'user' | 'candidate',
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean; error?: string; errorCode?: string }> {
    try {
      // Task 1.5: Enforce access control
      if (userId !== requesterId || userType !== requesterType) {
        auditService.log({
          eventType: 'INTEGRATION_ACCESS_DENIED' as any,
          actorId: requesterId,
          actorType: requesterType,
          targetId: userId,
          targetType: userType,
          channel,
          ipAddress,
          metadata: { tenantId, provider, action: 'disconnect' },
          success: false,
          errorMessage: 'Cannot disconnect integration for another user',
        });

        return {
          success: false,
          error: 'Access denied',
          errorCode: 'FORBIDDEN',
        };
      }

      await accountSettingsRepository.disconnectIntegration(tenantId, userId, userType, provider);

      // Task 1.6: Audit logging
      auditService.log({
        eventType: 'INTEGRATION_DISCONNECTED' as any,
        actorId: requesterId,
        actorType: requesterType,
        channel,
        ipAddress,
        userAgent,
        metadata: { tenantId, provider },
        success: true,
      });

      return { success: true };
    } catch (error) {
      console.error('[AccountSettingsService] Error disconnecting integration:', error);
      return {
        success: false,
        error: 'Failed to disconnect integration',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }
}

export const accountSettingsService = new AccountSettingsService();
