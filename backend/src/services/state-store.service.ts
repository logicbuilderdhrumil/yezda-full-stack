/**
 * State Store Service
 * Task 1.2: Implement state store read/write endpoints
 * Task 1.4: Enforce tenant scoping and encryption
 * Task 1.5: Add audit logging for state access
 * Task 1.7: Add metrics for SLO monitoring
 */

import { stateStoreRepository } from '../repositories/state-store.repository.js';
import { encrypt, decrypt } from './crypto.service.js';
import { auditService } from './audit.service.js';
import { stateStoreMetricsService } from './state-store-metrics.service.js';
import type {
  StateOperationResult,
  UserPreferences,
  SessionState,
  PreferenceKey,
} from '../models/state-store.model.js';

/** Keys for different state categories */
const STATE_KEYS = {
  PREFERENCES: 'preferences',
  SESSION_STATE: 'session_state',
} as const;

/** Default TTL for session state (24 hours) */
const SESSION_STATE_TTL_MS = 24 * 60 * 60 * 1000;

export class StateStoreService {
  /**
   * Get user preferences
   */
  async getPreferences(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api' }
  ): Promise<StateOperationResult> {
    const start = Date.now();
    
    try {
      const entry = await stateStoreRepository.findByKey(
        tenantId,
        userId,
        userType,
        STATE_KEYS.PREFERENCES
      );

      let preferences: UserPreferences = {};
      
      if (entry) {
        try {
          const decrypted = decrypt(entry.value);
          preferences = JSON.parse(decrypted) as UserPreferences;
        } catch (error) {
          console.error('[StateStore] Failed to decrypt preferences:', error);
          // Return empty preferences on decryption failure
        }
      }

      // Log read access
      this.logStateAccess('STATE_READ', {
        tenantId,
        userId,
        userType,
        key: STATE_KEYS.PREFERENCES,
        success: true,
        ...requestContext,
      });

      stateStoreMetricsService.recordRead(true, Date.now() - start);

      return { success: true, data: preferences };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logStateAccess('STATE_READ', {
        tenantId,
        userId,
        userType,
        key: STATE_KEYS.PREFERENCES,
        success: false,
        errorMessage,
        ...requestContext,
      });

      stateStoreMetricsService.recordRead(false, Date.now() - start);

      return { success: false, error: 'Failed to read preferences', errorCode: 'STATE_READ_ERROR' };
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    preferences: Partial<UserPreferences>,
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api' }
  ): Promise<StateOperationResult> {
    const start = Date.now();

    try {
      // Get existing preferences to merge
      const existingEntry = await stateStoreRepository.findByKey(
        tenantId,
        userId,
        userType,
        STATE_KEYS.PREFERENCES
      );

      let existingPreferences: UserPreferences = {};
      if (existingEntry) {
        try {
          const decrypted = decrypt(existingEntry.value);
          existingPreferences = JSON.parse(decrypted) as UserPreferences;
        } catch {
          // Start fresh on decryption failure
        }
      }

      // Merge preferences
      const mergedPreferences: UserPreferences = {
        ...existingPreferences,
        ...preferences,
      };

      // Validate preference values
      if (mergedPreferences.theme && !['light', 'dark', 'system'].includes(mergedPreferences.theme)) {
        return { success: false, error: 'Invalid theme value', errorCode: 'INVALID_PREFERENCE' };
      }
      if (mergedPreferences.presence && !['online', 'away', 'busy', 'offline'].includes(mergedPreferences.presence)) {
        return { success: false, error: 'Invalid presence value', errorCode: 'INVALID_PREFERENCE' };
      }

      // Encrypt and store
      const encrypted = encrypt(JSON.stringify(mergedPreferences));
      await stateStoreRepository.upsert({
        tenantId,
        userId,
        userType,
        key: STATE_KEYS.PREFERENCES,
        value: encrypted,
      });

      this.logStateAccess('STATE_WRITE', {
        tenantId,
        userId,
        userType,
        key: STATE_KEYS.PREFERENCES,
        success: true,
        metadata: { updatedKeys: Object.keys(preferences) },
        ...requestContext,
      });

      stateStoreMetricsService.recordWrite(true, Date.now() - start);

      return { success: true, data: mergedPreferences };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logStateAccess('STATE_WRITE', {
        tenantId,
        userId,
        userType,
        key: STATE_KEYS.PREFERENCES,
        success: false,
        errorMessage,
        ...requestContext,
      });

      stateStoreMetricsService.recordWrite(false, Date.now() - start);

      return { success: false, error: 'Failed to update preferences', errorCode: 'STATE_WRITE_ERROR' };
    }
  }

  /**
   * Update a single preference
   */
  async updatePreference(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    key: PreferenceKey,
    value: string,
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api' }
  ): Promise<StateOperationResult> {
    const update: Partial<UserPreferences> = { [key]: value };
    return this.updatePreferences(tenantId, userId, userType, update, requestContext);
  }

  /**
   * Get session state
   */
  async getSessionState(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api' }
  ): Promise<StateOperationResult> {
    const start = Date.now();

    try {
      const entry = await stateStoreRepository.findByKey(
        tenantId,
        userId,
        userType,
        STATE_KEYS.SESSION_STATE
      );

      let sessionState: SessionState = {};

      if (entry) {
        try {
          const decrypted = decrypt(entry.value);
          sessionState = JSON.parse(decrypted) as SessionState;
        } catch (error) {
          console.error('[StateStore] Failed to decrypt session state:', error);
        }
      }

      this.logStateAccess('STATE_READ', {
        tenantId,
        userId,
        userType,
        key: STATE_KEYS.SESSION_STATE,
        success: true,
        ...requestContext,
      });

      stateStoreMetricsService.recordRead(true, Date.now() - start);

      return { success: true, data: sessionState };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logStateAccess('STATE_READ', {
        tenantId,
        userId,
        userType,
        key: STATE_KEYS.SESSION_STATE,
        success: false,
        errorMessage,
        ...requestContext,
      });

      stateStoreMetricsService.recordRead(false, Date.now() - start);

      return { success: false, error: 'Failed to read session state', errorCode: 'STATE_READ_ERROR' };
    }
  }

  /**
   * Update session state
   */
  async updateSessionState(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    sessionState: Partial<SessionState>,
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api' }
  ): Promise<StateOperationResult> {
    const start = Date.now();

    try {
      // Get existing session state to merge
      const existingEntry = await stateStoreRepository.findByKey(
        tenantId,
        userId,
        userType,
        STATE_KEYS.SESSION_STATE
      );

      let existingState: SessionState = {};
      if (existingEntry) {
        try {
          const decrypted = decrypt(existingEntry.value);
          existingState = JSON.parse(decrypted) as SessionState;
        } catch {
          // Start fresh on decryption failure
        }
      }

      // Merge session state
      const mergedState: SessionState = {
        ...existingState,
        ...sessionState,
        lastActivity: new Date(),
      };

      // Encrypt and store with TTL
      const encrypted = encrypt(JSON.stringify(mergedState));
      const expiresAt = new Date(Date.now() + SESSION_STATE_TTL_MS);
      
      await stateStoreRepository.upsert({
        tenantId,
        userId,
        userType,
        key: STATE_KEYS.SESSION_STATE,
        value: encrypted,
        expiresAt,
      });

      this.logStateAccess('STATE_WRITE', {
        tenantId,
        userId,
        userType,
        key: STATE_KEYS.SESSION_STATE,
        success: true,
        metadata: { updatedKeys: Object.keys(sessionState) },
        ...requestContext,
      });

      stateStoreMetricsService.recordWrite(true, Date.now() - start);

      return { success: true, data: mergedState };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logStateAccess('STATE_WRITE', {
        tenantId,
        userId,
        userType,
        key: STATE_KEYS.SESSION_STATE,
        success: false,
        errorMessage,
        ...requestContext,
      });

      stateStoreMetricsService.recordWrite(false, Date.now() - start);

      return { success: false, error: 'Failed to update session state', errorCode: 'STATE_WRITE_ERROR' };
    }
  }

  /**
   * Get all state for a user (preferences + session state)
   */
  async getUserState(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api' }
  ): Promise<StateOperationResult> {
    const [preferencesResult, sessionStateResult] = await Promise.all([
      this.getPreferences(tenantId, userId, userType, requestContext),
      this.getSessionState(tenantId, userId, userType, requestContext),
    ]);

    if (!preferencesResult.success || !sessionStateResult.success) {
      return {
        success: false,
        error: 'Failed to retrieve user state',
        errorCode: 'STATE_READ_ERROR',
      };
    }

    return {
      success: true,
      data: {
        preferences: preferencesResult.data,
        sessionState: sessionStateResult.data,
      },
    };
  }

  /**
   * Clear all state for a user
   */
  async clearUserState(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api' }
  ): Promise<StateOperationResult> {
    const start = Date.now();

    try {
      const deleted = await stateStoreRepository.deleteAllByUser(tenantId, userId, userType);

      this.logStateAccess('STATE_DELETE', {
        tenantId,
        userId,
        userType,
        key: 'all',
        success: true,
        metadata: { deletedCount: deleted },
        ...requestContext,
      });

      stateStoreMetricsService.recordWrite(true, Date.now() - start);

      return { success: true, data: { deletedCount: deleted } };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logStateAccess('STATE_DELETE', {
        tenantId,
        userId,
        userType,
        key: 'all',
        success: false,
        errorMessage,
        ...requestContext,
      });

      stateStoreMetricsService.recordWrite(false, Date.now() - start);

      return { success: false, error: 'Failed to clear user state', errorCode: 'STATE_DELETE_ERROR' };
    }
  }

  /**
   * Verify tenant access and log denied access
   */
  async verifyTenantAccess(
    requestTenantId: string,
    targetTenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    requestContext: { ipAddress?: string; channel: 'web' | 'mobile' | 'api' }
  ): Promise<boolean> {
    if (requestTenantId !== targetTenantId) {
      this.logStateAccess('STATE_ACCESS_DENIED', {
        tenantId: targetTenantId,
        userId,
        userType,
        key: 'cross_tenant_access',
        success: false,
        errorMessage: `Tenant ${requestTenantId} attempted to access tenant ${targetTenantId}`,
        ...requestContext,
      });

      stateStoreMetricsService.recordAccessDenied();
      return false;
    }
    return true;
  }

  /**
   * Cleanup expired state entries
   */
  async cleanupExpired(): Promise<number> {
    try {
      const cleaned = await stateStoreRepository.cleanupExpired();
      console.log(`[StateStore] Cleaned up ${cleaned} expired entries`);
      return cleaned;
    } catch (error) {
      console.error('[StateStore] Failed to cleanup expired entries:', error);
      return 0;
    }
  }

  /**
   * Log state access for audit trail
   */
  private logStateAccess(
    eventType: 'STATE_READ' | 'STATE_WRITE' | 'STATE_DELETE' | 'STATE_ACCESS_DENIED',
    params: {
      tenantId: string;
      userId: string;
      userType: 'user' | 'candidate';
      key: string;
      success: boolean;
      errorMessage?: string;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
      channel: 'web' | 'mobile' | 'api';
    }
  ): void {
    // Use the general-purpose log method for state events
    // Note: StateEventTypes are not in the base AuditEventType, so we log as metadata
    auditService.log({
      eventType: params.success ? 'AUTH_TOKEN_REFRESH' : 'AUTH_ANOMALY_DETECTED', // Using existing types for compatibility
      actorId: params.userId,
      actorType: params.userType,
      channel: params.channel,
      ipAddress: params.ipAddress,
      metadata: {
        stateEventType: eventType,
        tenantId: params.tenantId,
        stateKey: params.key,
        ...params.metadata,
      },
      success: params.success,
      errorMessage: params.errorMessage,
    });
  }
}

export const stateStoreService = new StateStoreService();
