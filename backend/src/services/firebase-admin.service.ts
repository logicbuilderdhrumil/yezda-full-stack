/**
 * Firebase Admin Service
 * Task 1.1: Firebase Admin SDK initialization and core functions
 * Task 1.3: Firebase notification dispatch helpers
 */

import { firebaseConfig } from '../config/firebase.config.js';
import { auditService } from './audit.service.js';
import { metricsService } from './metrics.service.js';

/**
 * Firebase message payload structure
 */
export interface FirebaseMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

/**
 * Notification dispatch result
 */
export interface DispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Batch notification dispatch result
 */
export interface BatchDispatchResult {
  successCount: number;
  failureCount: number;
  results: Array<{
    token: string;
    result: DispatchResult;
  }>;
}

/**
 * Firebase Admin Service
 * Encapsulates Firebase Admin SDK operations
 */
export class FirebaseAdminService {
  private initialized = false;
  private mockMode = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Firebase Admin SDK
   * Uses mock mode in development/test if credentials are not configured
   */
  private initialize(): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const hasCredentials =
      firebaseConfig.projectId !== 'dev-project-id' &&
      firebaseConfig.clientEmail !== 'dev@example.com' &&
      firebaseConfig.privateKey !== 'dev-private-key';

    if (!hasCredentials) {
      if (isProduction) {
        throw new Error('Firebase credentials are required in production');
      }
      console.warn('[Firebase] Running in mock mode - notifications will be logged but not sent');
      this.mockMode = true;
    }

    this.initialized = true;
    console.log(`[Firebase] Initialized (mock mode: ${this.mockMode})`);
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if running in mock mode
   */
  isMockMode(): boolean {
    return this.mockMode;
  }

  /**
   * Validate a device token format
   * Firebase FCM tokens are typically 100-200+ characters
   */
  validateTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }
    // FCM tokens are base64-like strings, typically 150+ characters
    // They should only contain alphanumeric chars, underscores, colons, and hyphens
    const tokenPattern = /^[a-zA-Z0-9_:.-]{100,300}$/;
    return tokenPattern.test(token);
  }

  /**
   * Send a notification to a single device
   */
  async sendToDevice(
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
    const startTime = Date.now();

    try {
      if (!this.validateTokenFormat(deviceToken)) {
        return {
          success: false,
          error: 'Invalid device token format',
          errorCode: 'INVALID_TOKEN_FORMAT',
        };
      }

      if (this.mockMode) {
        // In mock mode, simulate successful send
        const mockMessageId = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        
        console.log('[Firebase Mock] Would send notification:', {
          token: deviceToken.substring(0, 20) + '...',
          title: message.title,
          body: message.body,
          messageId: mockMessageId,
        });

        // Log audit event for mock dispatch
        auditService.logFirebaseNotificationDispatched({
          actorId: context.actorId,
          actorType: context.actorType || 'system',
          tenantId: context.tenantId,
          deviceToken: deviceToken.substring(0, 20) + '...',
          messageId: mockMessageId,
          notificationType: message.data?.type || 'general',
          channel: context.channel || 'api',
          ipAddress: context.ipAddress,
          success: true,
        });

        metricsService.recordFirebaseDispatch(true, Date.now() - startTime);

        return {
          success: true,
          messageId: mockMessageId,
        };
      }

      // In production mode, actual Firebase SDK calls would go here
      // For now, we return an error indicating production mode needs SDK
      return {
        success: false,
        error: 'Firebase SDK not configured for production',
        errorCode: 'SDK_NOT_CONFIGURED',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      auditService.logFirebaseNotificationFailed({
        actorId: context.actorId,
        actorType: context.actorType || 'system',
        tenantId: context.tenantId,
        deviceToken: deviceToken.substring(0, 20) + '...',
        notificationType: message.data?.type || 'general',
        errorMessage,
        channel: context.channel || 'api',
        ipAddress: context.ipAddress,
      });

      metricsService.recordFirebaseDispatch(false, Date.now() - startTime);

      return {
        success: false,
        error: errorMessage,
        errorCode: 'DISPATCH_ERROR',
      };
    }
  }

  /**
   * Send notifications to multiple devices
   */
  async sendToDevices(
    deviceTokens: string[],
    message: FirebaseMessage,
    context: {
      actorId?: string;
      actorType?: 'user' | 'candidate' | 'system';
      tenantId?: string;
      channel?: 'web' | 'mobile' | 'api';
      ipAddress?: string;
    } = {}
  ): Promise<BatchDispatchResult> {
    const results: BatchDispatchResult['results'] = [];
    let successCount = 0;
    let failureCount = 0;

    // Process tokens in parallel (but respect rate limits)
    const batchSize = 10;
    for (let i = 0; i < deviceTokens.length; i += batchSize) {
      const batch = deviceTokens.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (token) => {
          const result = await this.sendToDevice(token, message, context);
          return { token, result };
        })
      );

      for (const r of batchResults) {
        results.push(r);
        if (r.result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      }
    }

    return {
      successCount,
      failureCount,
      results,
    };
  }

  /**
   * Verify a Firebase ID token (for authentication)
   * Returns decoded token claims or null if invalid
   */
  async verifyIdToken(_idToken: string): Promise<{
    uid: string;
    email?: string;
    emailVerified?: boolean;
    [key: string]: unknown;
  } | null> {
    try {
      if (this.mockMode) {
        // In mock mode, decode the token as if it were valid
        // This is only for development/testing
        // Note: _idToken would be verified via Firebase Admin SDK in production
        console.warn('[Firebase Mock] Token verification in mock mode - returning mock claims');
        return {
          uid: `mock-uid-${Date.now()}`,
          email: 'mock@example.com',
          emailVerified: true,
        };
      }

      // In production, actual Firebase SDK verification would go here
      // firebase.auth().verifyIdToken(_idToken)
      return null;
    } catch (error) {
      console.error('[Firebase] Token verification failed:', error);
      return null;
    }
  }
}

export const firebaseAdminService = new FirebaseAdminService();
