/**
 * Mock API Service
 * Provides mock responses for development and serves as the business logic layer
 * for mock mode operations. Includes audit logging for all mock mode changes.
 */

import { isMockModeEnabled, canEnableMockMode, getMockModeBlockedReason } from '../config/mock.config.js';
import { auditService } from './audit.service.js';
import {
  mockUsers,
  getMockAuthResponse,
  findMockUserByEmail,
  findMockUserById,
} from '../fixtures/auth.fixtures.js';
import { findMockUserProfileById, findMockUserProfilesByTenant } from '../fixtures/users.fixtures.js';
import {
  findMockNotificationsForUser,
  findMockNotificationById,
  getMockUnreadCount,
} from '../fixtures/notifications.fixtures.js';
import {
  findMockStateEntriesForUser,
  findMockStateEntryByKey,
} from '../fixtures/state-store.fixtures.js';
import {
  findMockShellConfigByTenant,
  getMockNavigationForRoles,
} from '../fixtures/shell.fixtures.js';
import { getFixtureManifest } from '../fixtures/index.js';

export interface MockModeStatus {
  enabled: boolean;
  environment: string;
  canEnable: boolean;
  blockedReason: string | null;
}

export interface MockEndpointContext {
  endpoint: string;
  method: string;
  actorId?: string;
  actorType?: 'user' | 'candidate' | 'system';
  ipAddress?: string;
  userAgent?: string;
}

export class MockApiService {
  /**
   * Get current mock mode status
   */
  getStatus(): MockModeStatus {
    return {
      enabled: isMockModeEnabled(),
      environment: process.env.NODE_ENV || 'development',
      canEnable: canEnableMockMode(),
      blockedReason: getMockModeBlockedReason(),
    };
  }

  /**
   * Check if mock mode is enabled
   */
  isEnabled(): boolean {
    return isMockModeEnabled();
  }

  /**
   * Log mock mode blocked attempt (e.g., in production)
   */
  logMockModeBlocked(context: {
    reason: string;
    actorId?: string;
    actorType?: 'user' | 'candidate' | 'system';
    ipAddress?: string;
    userAgent?: string;
  }): void {
    auditService.log({
      eventType: 'MOCK_MODE_BLOCKED',
      actorId: context.actorId,
      actorType: context.actorType,
      channel: 'api',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { reason: context.reason },
      success: false,
      errorMessage: context.reason,
    });
  }

  /**
   * Log fixture access for audit trail
   */
  logFixtureAccess(context: MockEndpointContext & { fixtureName: string }): void {
    auditService.log({
      eventType: 'MOCK_FIXTURE_ACCESSED',
      actorId: context.actorId,
      actorType: context.actorType,
      channel: 'api',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        endpoint: context.endpoint,
        method: context.method,
        fixtureName: context.fixtureName,
      },
      success: true,
    });
  }

  /**
   * Log mock endpoint call for audit trail
   */
  logEndpointCall(context: MockEndpointContext): void {
    auditService.log({
      eventType: 'MOCK_ENDPOINT_CALLED',
      actorId: context.actorId,
      actorType: context.actorType,
      channel: 'api',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        endpoint: context.endpoint,
        method: context.method,
      },
      success: true,
    });
  }

  /**
   * Get fixture manifest for debugging
   */
  getFixtureManifest() {
    return getFixtureManifest();
  }

  // ============ Auth Fixtures ============

  /**
   * Get mock authentication response
   */
  getMockAuthResponse(userId: string) {
    return getMockAuthResponse(userId);
  }

  /**
   * Find mock user by email
   */
  findUserByEmail(email: string) {
    return findMockUserByEmail(email);
  }

  /**
   * Find mock user by ID
   */
  findUserById(userId: string) {
    return findMockUserById(userId);
  }

  /**
   * Get all mock users (without password hashes)
   */
  getAllUsers() {
    return mockUsers.map(({ passwordHash: _, ...user }) => user);
  }

  // ============ Profile Fixtures ============

  /**
   * Get mock user profile
   */
  getUserProfile(userId: string) {
    return findMockUserProfileById(userId);
  }

  /**
   * Get mock user profiles by tenant
   */
  getUsersByTenant(tenantId: string) {
    return findMockUserProfilesByTenant(tenantId);
  }

  // ============ Notification Fixtures ============

  /**
   * Get notifications for a user
   */
  getNotificationsForUser(userId: string, userType: 'user' | 'candidate') {
    return findMockNotificationsForUser(userId, userType);
  }

  /**
   * Get notification by ID
   */
  getNotificationById(id: string) {
    return findMockNotificationById(id);
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(userId: string, userType: 'user' | 'candidate') {
    return getMockUnreadCount(userId, userType);
  }

  // ============ State Store Fixtures ============

  /**
   * Get state entries for a user
   */
  getStateEntriesForUser(
    userId: string,
    userType: 'user' | 'candidate',
    tenantId: string
  ) {
    return findMockStateEntriesForUser(userId, userType, tenantId);
  }

  /**
   * Get state entry by key
   */
  getStateEntryByKey(
    userId: string,
    userType: 'user' | 'candidate',
    tenantId: string,
    key: string
  ) {
    return findMockStateEntryByKey(userId, userType, tenantId, key);
  }

  // ============ Shell Fixtures ============

  /**
   * Get shell config for a tenant
   */
  getShellConfig(tenantId: string) {
    return findMockShellConfigByTenant(tenantId);
  }

  /**
   * Get navigation items for a user
   */
  getNavigationForRoles(tenantId: string, roles: string[]) {
    return getMockNavigationForRoles(tenantId, roles);
  }
}

export const mockApiService = new MockApiService();
