/**
 * Firebase Device Token Service
 * Task 1.2: Device token registration and management
 * Task 1.3: Notification dispatch helpers
 * Task 1.5: Tenant scoping and token validation
 * Task 1.6: Audit logging for token operations
 */

import { deviceTokenRepository } from '../repositories/device-token.repository.js';
import { firebaseAdminService, type FirebaseMessage, type DispatchResult, type BatchDispatchResult } from './firebase-admin.service.js';
import { auditService } from './audit.service.js';
import { metricsService } from './metrics.service.js';
import type { DeviceToken, DeviceTokenRegistration, NotificationEvent } from '../models/firebase.model.js';

export interface TokenRegistrationResult {
  success: boolean;
  tokenId?: string;
  error?: string;
  errorCode?: string;
}

export interface TokenUnregistrationResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

export class FirebaseDeviceTokenService {
  /**
   * Register a device token for push notifications
   * Enforces tenant scoping and validates token format
   */
  async registerToken(
    params: DeviceTokenRegistration & {
      userId: string;
      userType: 'user' | 'candidate';
      tenantId: string;
    },
    context: {
      channel: 'web' | 'mobile' | 'api';
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<TokenRegistrationResult> {
    try {
      // Validate token format
      if (!firebaseAdminService.validateTokenFormat(params.token)) {
        metricsService.recordFirebaseTokenRegistration(false);
        return {
          success: false,
          error: 'Invalid device token format',
          errorCode: 'INVALID_TOKEN_FORMAT',
        };
      }

      // Check if token is already registered to another tenant
      const existing = await deviceTokenRepository.findByToken(params.token);
      if (existing && existing.tenantId !== params.tenantId) {
        // Cross-tenant token registration attempt
        auditService.logFirebaseTokenRegistrationDenied({
          userId: params.userId,
          userType: params.userType,
          attemptedTenantId: params.tenantId,
          actualTenantId: existing.tenantId,
          reason: 'Token already registered to another tenant',
          channel: context.channel,
          ipAddress: context.ipAddress,
        });

        metricsService.recordFirebaseTokenRegistration(false);

        return {
          success: false,
          error: 'Token registration denied',
          errorCode: 'CROSS_TENANT_REGISTRATION',
        };
      }

      // Register or update the token
      const deviceToken = await deviceTokenRepository.upsert({
        userId: params.userId,
        userType: params.userType,
        tenantId: params.tenantId,
        token: params.token,
        platform: params.platform,
        deviceId: params.deviceId,
        deviceName: params.deviceName,
        appVersion: params.appVersion,
      });

      // Audit log the registration
      auditService.logFirebaseTokenRegistered({
        userId: params.userId,
        userType: params.userType,
        tenantId: params.tenantId,
        deviceToken: params.token.substring(0, 20) + '...',
        platform: params.platform,
        deviceId: params.deviceId,
        channel: context.channel,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      metricsService.recordFirebaseTokenRegistration(true);

      return {
        success: true,
        tokenId: deviceToken.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      metricsService.recordFirebaseTokenRegistration(false);
      return {
        success: false,
        error: errorMessage,
        errorCode: 'REGISTRATION_ERROR',
      };
    }
  }

  /**
   * Unregister a device token
   */
  async unregisterToken(
    token: string,
    params: {
      userId: string;
      userType: 'user' | 'candidate';
      tenantId: string;
    },
    context: {
      channel: 'web' | 'mobile' | 'api';
      ipAddress?: string;
    }
  ): Promise<TokenUnregistrationResult> {
    try {
      // Find the token registration
      const existing = await deviceTokenRepository.findByToken(token);

      if (!existing) {
        return {
          success: false,
          error: 'Token not found',
          errorCode: 'TOKEN_NOT_FOUND',
        };
      }

      // Verify tenant ownership
      if (existing.tenantId !== params.tenantId) {
        auditService.logFirebaseTokenRegistrationDenied({
          userId: params.userId,
          userType: params.userType,
          attemptedTenantId: params.tenantId,
          actualTenantId: existing.tenantId,
          reason: 'Cannot unregister token from another tenant',
          channel: context.channel,
          ipAddress: context.ipAddress,
        });

        return {
          success: false,
          error: 'Token unregistration denied',
          errorCode: 'CROSS_TENANT_UNREGISTRATION',
        };
      }

      // Verify user ownership
      if (existing.userId !== params.userId || existing.userType !== params.userType) {
        return {
          success: false,
          error: 'Token does not belong to user',
          errorCode: 'TOKEN_OWNERSHIP_MISMATCH',
        };
      }

      // Deactivate the token
      await deviceTokenRepository.deactivate(existing.id);

      // Audit log the unregistration
      auditService.logFirebaseTokenUnregistered({
        userId: params.userId,
        userType: params.userType,
        tenantId: params.tenantId,
        deviceToken: token.substring(0, 20) + '...',
        channel: context.channel,
        ipAddress: context.ipAddress,
      });

      metricsService.recordFirebaseTokenUnregistration();

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
        errorCode: 'UNREGISTRATION_ERROR',
      };
    }
  }

  /**
   * Unregister all tokens for a user
   */
  async unregisterAllForUser(
    params: {
      userId: string;
      userType: 'user' | 'candidate';
      tenantId: string;
    },
    context: {
      channel: 'web' | 'mobile' | 'api';
      ipAddress?: string;
    }
  ): Promise<{ success: boolean; count: number }> {
    const count = await deviceTokenRepository.deactivateAllForUser(
      params.userId,
      params.userType,
      params.tenantId
    );

    if (count > 0) {
      auditService.logFirebaseTokenUnregistered({
        userId: params.userId,
        userType: params.userType,
        tenantId: params.tenantId,
        deviceToken: `all (${count} tokens)`,
        channel: context.channel,
        ipAddress: context.ipAddress,
      });
    }

    return { success: true, count };
  }

  /**
   * Get all active tokens for a user
   */
  async getActiveTokens(
    userId: string,
    userType: 'user' | 'candidate',
    tenantId: string
  ): Promise<DeviceToken[]> {
    return deviceTokenRepository.findActiveByUser(userId, userType, tenantId);
  }

  /**
   * Dispatch a notification to a user's devices
   */
  async dispatchToUser(
    event: NotificationEvent,
    context: {
      actorId?: string;
      actorType?: 'user' | 'candidate' | 'system';
      channel?: 'web' | 'mobile' | 'api';
      ipAddress?: string;
    } = {}
  ): Promise<BatchDispatchResult> {
    // Get all active tokens for the recipient
    const tokens = await deviceTokenRepository.findActiveByUser(
      event.recipientId,
      event.recipientType,
      event.tenantId
    );

    if (tokens.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        results: [],
      };
    }

    const message: FirebaseMessage = {
      title: event.payload.title,
      body: event.payload.body,
      data: {
        ...event.payload.data,
        type: event.type,
      },
      imageUrl: event.payload.imageUrl,
    };

    // Decrypt tokens for FCM dispatch (raw tokens never stored, only encrypted form)
    const decryptedTokens = tokens.map((t) => ({
      id: t.id,
      rawToken: deviceTokenRepository.decryptToken(t),
    }));
    const deviceTokens = decryptedTokens.map((t) => t.rawToken);
    const result = await firebaseAdminService.sendToDevices(deviceTokens, message, {
      actorId: context.actorId,
      actorType: context.actorType || 'system',
      tenantId: event.tenantId,
      channel: context.channel || 'api',
      ipAddress: context.ipAddress,
    });

    // Update last used timestamp for successful sends
    for (const r of result.results) {
      if (r.result.success) {
        // Match by decrypted token to find the corresponding stored record
        const tokenRecord = decryptedTokens.find((t) => t.rawToken === r.token);
        if (tokenRecord) {
          await deviceTokenRepository.updateLastUsed(tokenRecord.id);
        }
      }
    }

    return result;
  }

  /**
   * Dispatch a notification to a single device
   */
  async dispatchToDevice(
    deviceToken: string,
    message: FirebaseMessage,
    context: {
      actorId?: string;
      actorType?: 'user' | 'candidate' | 'system';
      tenantId?: string;
      channel?: 'web' | 'mobile' | 'api';
      ipAddress?: string;
    } = {}
  ): Promise<DispatchResult> {
    return firebaseAdminService.sendToDevice(deviceToken, message, context);
  }
}

export const firebaseDeviceTokenService = new FirebaseDeviceTokenService();
