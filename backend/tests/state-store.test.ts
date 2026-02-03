/**
 * State Store Tests
 * Task 1.3: Tests for state persistence across sessions
 * Task 1.4: Tests for tenant scoping and encryption
 * Task 1.5: Tests for audit logging
 * Task 1.6: Tests for rate limiting
 * Task 1.7: Tests for SLO metrics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { stateStoreService } from '../src/services/state-store.service.js';
import { stateStoreRepository } from '../src/repositories/state-store.repository.js';
import { stateStoreMetricsService, STATE_STORE_METRICS } from '../src/services/state-store-metrics.service.js';
import { encrypt, decrypt } from '../src/services/crypto.service.js';
import type { UserPreferences, SessionState } from '../src/models/state-store.model.js';

// Test context
const testContext = {
  ipAddress: '127.0.0.1',
  channel: 'api' as const,
};

describe('State Store Persistence', () => {
  describe('Preference Storage', () => {
    it('should store and retrieve user preferences', async () => {
      const preferences: Partial<UserPreferences> = {
        theme: 'dark',
        locale: 'en-US',
        presence: 'online',
      };

      await stateStoreService.updatePreferences(
        'tenant-1',
        'user-1',
        'user',
        preferences,
        testContext
      );

      const result = await stateStoreService.getPreferences(
        'tenant-1',
        'user-1',
        'user',
        testContext
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(preferences);
    });

    it('should merge preferences on partial update', async () => {
      // Set initial preferences
      await stateStoreService.updatePreferences(
        'tenant-1',
        'user-merge',
        'user',
        { theme: 'light', locale: 'en-US' },
        testContext
      );

      // Update only theme
      await stateStoreService.updatePreferences(
        'tenant-1',
        'user-merge',
        'user',
        { theme: 'dark' },
        testContext
      );

      const result = await stateStoreService.getPreferences(
        'tenant-1',
        'user-merge',
        'user',
        testContext
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ theme: 'dark', locale: 'en-US' });
    });

    it('should validate preference values', async () => {
      const result = await stateStoreService.updatePreferences(
        'tenant-1',
        'user-validate',
        'user',
        { theme: 'invalid-theme' as any },
        testContext
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_PREFERENCE');
    });

    it('should validate presence values', async () => {
      const result = await stateStoreService.updatePreferences(
        'tenant-1',
        'user-validate-presence',
        'user',
        { presence: 'invisible' as any },
        testContext
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_PREFERENCE');
    });

    it('should update single preference', async () => {
      await stateStoreService.updatePreference(
        'tenant-1',
        'user-single',
        'user',
        'theme',
        'dark',
        testContext
      );

      const result = await stateStoreService.getPreferences(
        'tenant-1',
        'user-single',
        'user',
        testContext
      );

      expect(result.success).toBe(true);
      expect((result.data as UserPreferences).theme).toBe('dark');
    });
  });

  describe('Session State Storage', () => {
    it('should store and retrieve session state', async () => {
      const sessionState: Partial<SessionState> = {
        currentView: '/dashboard',
        unsavedChanges: false,
      };

      await stateStoreService.updateSessionState(
        'tenant-1',
        'user-session',
        'user',
        sessionState,
        testContext
      );

      const result = await stateStoreService.getSessionState(
        'tenant-1',
        'user-session',
        'user',
        testContext
      );

      expect(result.success).toBe(true);
      expect((result.data as SessionState).currentView).toBe('/dashboard');
      expect((result.data as SessionState).lastActivity).toBeDefined();
    });

    it('should persist session state with custom data', async () => {
      const sessionState: Partial<SessionState> = {
        customData: { formId: 'form-123', step: 2 },
      };

      await stateStoreService.updateSessionState(
        'tenant-1',
        'user-custom',
        'user',
        sessionState,
        testContext
      );

      const result = await stateStoreService.getSessionState(
        'tenant-1',
        'user-custom',
        'user',
        testContext
      );

      expect(result.success).toBe(true);
      expect((result.data as SessionState).customData).toEqual({ formId: 'form-123', step: 2 });
    });
  });

  describe('User State Aggregation', () => {
    it('should retrieve all user state at once', async () => {
      await stateStoreService.updatePreferences(
        'tenant-1',
        'user-all',
        'user',
        { theme: 'dark' },
        testContext
      );

      await stateStoreService.updateSessionState(
        'tenant-1',
        'user-all',
        'user',
        { currentView: '/settings' },
        testContext
      );

      const result = await stateStoreService.getUserState(
        'tenant-1',
        'user-all',
        'user',
        testContext
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('preferences');
      expect(result.data).toHaveProperty('sessionState');
    });

    it('should clear all user state', async () => {
      await stateStoreService.updatePreferences(
        'tenant-1',
        'user-clear',
        'user',
        { theme: 'dark' },
        testContext
      );

      const clearResult = await stateStoreService.clearUserState(
        'tenant-1',
        'user-clear',
        'user',
        testContext
      );

      expect(clearResult.success).toBe(true);

      const getResult = await stateStoreService.getPreferences(
        'tenant-1',
        'user-clear',
        'user',
        testContext
      );

      expect(getResult.success).toBe(true);
      expect(getResult.data).toEqual({});
    });
  });
});

describe('State Store Tenant Validation', () => {
  it('should require tenant ID header for all operations', async () => {
    // This test verifies controller behavior - getTenantId returns null
    // when x-tenant-id header is missing, and endpoints return 400
    // Testing at service level: verifyTenantAccess enforces tenant matching
    const isAllowed = await stateStoreService.verifyTenantAccess(
      '', // empty tenant ID
      'tenant-1',
      'user-1',
      'user',
      testContext
    );
    expect(isAllowed).toBe(false);
  });

  it('should reject operations with empty tenant ID', async () => {
    const isAllowed = await stateStoreService.verifyTenantAccess(
      '   ', // whitespace-only tenant ID  
      'tenant-1',
      'user-1',
      'user',
      testContext
    );
    expect(isAllowed).toBe(false);
  });
});

describe('State Store Tenant Isolation', () => {
  it('should isolate state between tenants', async () => {
    // Set preferences for tenant-1
    await stateStoreService.updatePreferences(
      'tenant-1',
      'user-isolated',
      'user',
      { theme: 'dark' },
      testContext
    );

    // Set preferences for tenant-2 (same user ID)
    await stateStoreService.updatePreferences(
      'tenant-2',
      'user-isolated',
      'user',
      { theme: 'light' },
      testContext
    );

    // Verify tenant-1 state
    const tenant1Result = await stateStoreService.getPreferences(
      'tenant-1',
      'user-isolated',
      'user',
      testContext
    );

    // Verify tenant-2 state
    const tenant2Result = await stateStoreService.getPreferences(
      'tenant-2',
      'user-isolated',
      'user',
      testContext
    );

    expect((tenant1Result.data as UserPreferences).theme).toBe('dark');
    expect((tenant2Result.data as UserPreferences).theme).toBe('light');
  });

  it('should deny cross-tenant access', async () => {
    const isAllowed = await stateStoreService.verifyTenantAccess(
      'tenant-1',
      'tenant-2',
      'user-1',
      'user',
      testContext
    );

    expect(isAllowed).toBe(false);
  });
});

describe('State Store Encryption', () => {
  it('should encrypt stored values', async () => {
    const plaintext = JSON.stringify({ theme: 'dark' });
    const encrypted = encrypt(plaintext);

    // Encrypted value should be different from plaintext
    expect(encrypted).not.toBe(plaintext);

    // Should be decryptable
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should store encrypted preferences in repository', async () => {
    const upsertSpy = vi.spyOn(stateStoreRepository, 'upsert');

    await stateStoreService.updatePreferences(
      'tenant-encrypt',
      'user-encrypt',
      'user',
      { theme: 'dark' },
      testContext
    );

    // Verify upsert was called with encrypted value
    expect(upsertSpy).toHaveBeenCalled();
    const call = upsertSpy.mock.calls[0][0];
    
    // Value should be encrypted (contains colons for salt:iv:tag:ciphertext format)
    expect(call.value).toContain(':');
    expect(call.value).not.toContain('theme');
  });
});

describe('State Store Metrics', () => {
  beforeEach(() => {
    // Clear metrics state
    stateStoreMetricsService.cleanup(0);
  });

  it('should record read operations', async () => {
    await stateStoreService.getPreferences(
      'tenant-metrics',
      'user-metrics',
      'user',
      testContext
    );

    const metrics = stateStoreMetricsService.getMetrics();
    const readMetrics = metrics.filter(m => 
      m.name === STATE_STORE_METRICS.READ_SUCCESS || 
      m.name === STATE_STORE_METRICS.READ_LATENCY
    );

    expect(readMetrics.length).toBeGreaterThan(0);
  });

  it('should record write operations', async () => {
    await stateStoreService.updatePreferences(
      'tenant-metrics',
      'user-metrics',
      'user',
      { theme: 'dark' },
      testContext
    );

    const metrics = stateStoreMetricsService.getMetrics();
    const writeMetrics = metrics.filter(m => 
      m.name === STATE_STORE_METRICS.WRITE_SUCCESS || 
      m.name === STATE_STORE_METRICS.WRITE_LATENCY
    );

    expect(writeMetrics.length).toBeGreaterThan(0);
  });

  it('should calculate SLO status', () => {
    // Record some successful operations
    stateStoreMetricsService.recordRead(true, 50);
    stateStoreMetricsService.recordRead(true, 60);
    stateStoreMetricsService.recordWrite(true, 100);

    const sloStatus = stateStoreMetricsService.checkSLOs();

    expect(sloStatus.met).toBe(true);
    expect(sloStatus.violations).toHaveLength(0);
  });

  it('should report SLO violations for slow operations', () => {
    // Record operations that exceed SLO thresholds
    for (let i = 0; i < 100; i++) {
      stateStoreMetricsService.recordRead(true, 150); // Exceeds 100ms P99
    }

    const sloStatus = stateStoreMetricsService.checkSLOs();

    expect(sloStatus.met).toBe(false);
    expect(sloStatus.violations.some(v => v.includes('read P99 latency'))).toBe(true);
  });

  it('should report SLO violations for failures', () => {
    // Record mostly failures
    stateStoreMetricsService.recordRead(false, 50);
    stateStoreMetricsService.recordRead(false, 50);
    stateStoreMetricsService.recordRead(true, 50);

    const successRate = stateStoreMetricsService.getReadSuccessRate();

    // 1 success out of 3 = 33.33%
    expect(successRate).toBeLessThan(99.9);
  });

  it('should provide health summary', () => {
    stateStoreMetricsService.recordRead(true, 50);
    stateStoreMetricsService.recordWrite(true, 100);

    const health = stateStoreMetricsService.getHealthSummary();

    expect(health).toHaveProperty('readSuccessRate');
    expect(health).toHaveProperty('writeSuccessRate');
    expect(health).toHaveProperty('readP99Latency');
    expect(health).toHaveProperty('writeP99Latency');
    expect(health).toHaveProperty('sloStatus');
  });
});

describe('State Store Persistence Across Sessions', () => {
  it('should persist preferences after session ends', async () => {
    // Simulate first session - set preferences
    await stateStoreService.updatePreferences(
      'tenant-persist',
      'user-persist',
      'user',
      { theme: 'dark', locale: 'fr-FR' },
      testContext
    );

    // Simulate new session - retrieve preferences
    const result = await stateStoreService.getPreferences(
      'tenant-persist',
      'user-persist',
      'user',
      testContext
    );

    expect(result.success).toBe(true);
    expect((result.data as UserPreferences).theme).toBe('dark');
    expect((result.data as UserPreferences).locale).toBe('fr-FR');
  });

  it('should restore session state for returning user', async () => {
    // First session - set state
    await stateStoreService.updateSessionState(
      'tenant-restore',
      'user-restore',
      'user',
      { currentView: '/workflow/step-3', unsavedChanges: true },
      testContext
    );

    // New session - state should be restored
    const result = await stateStoreService.getSessionState(
      'tenant-restore',
      'user-restore',
      'user',
      testContext
    );

    expect(result.success).toBe(true);
    expect((result.data as SessionState).currentView).toBe('/workflow/step-3');
  });
});

describe('State Store Repository', () => {
  it('should upsert state entries', async () => {
    const entry = await stateStoreRepository.upsert({
      tenantId: 'tenant-repo',
      userId: 'user-repo',
      userType: 'user',
      key: 'test-key',
      value: encrypt(JSON.stringify({ test: true })),
    });

    expect(entry.id).toBeDefined();
    expect(entry.tenantId).toBe('tenant-repo');
    expect(entry.key).toBe('test-key');
  });

  it('should find entry by key', async () => {
    await stateStoreRepository.upsert({
      tenantId: 'tenant-find',
      userId: 'user-find',
      userType: 'user',
      key: 'find-key',
      value: encrypt(JSON.stringify({ found: true })),
    });

    const entry = await stateStoreRepository.findByKey(
      'tenant-find',
      'user-find',
      'user',
      'find-key'
    );

    expect(entry).toBeDefined();
    expect(entry?.key).toBe('find-key');
  });

  it('should delete entry', async () => {
    await stateStoreRepository.upsert({
      tenantId: 'tenant-del',
      userId: 'user-del',
      userType: 'user',
      key: 'delete-key',
      value: encrypt(JSON.stringify({ toDelete: true })),
    });

    const deleted = await stateStoreRepository.delete(
      'tenant-del',
      'user-del',
      'user',
      'delete-key'
    );

    expect(deleted).toBe(true);

    const entry = await stateStoreRepository.findByKey(
      'tenant-del',
      'user-del',
      'user',
      'delete-key'
    );

    expect(entry).toBeUndefined();
  });
});
