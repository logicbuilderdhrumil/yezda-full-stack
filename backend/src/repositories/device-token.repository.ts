/**
 * Device Token Repository
 * Task 1.2: Device token storage and retrieval
 */

import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import type { DeviceToken } from '../models/firebase.model.js';

// In-memory store (replace with database in production)
const deviceTokens = new Map<string, DeviceToken>();

/**
 * Hash a device token for secure storage
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export class DeviceTokenRepository {
  /**
   * Create or update a device token registration
   */
  async upsert(params: {
    userId: string;
    userType: 'user' | 'candidate';
    tenantId: string;
    token: string;
    platform: 'ios' | 'android' | 'web';
    deviceId?: string;
    deviceName?: string;
    appVersion?: string;
  }): Promise<DeviceToken> {
    const tokenHash = hashToken(params.token);
    const existingByHash = await this.findByTokenHash(tokenHash);

    if (existingByHash) {
      // Update existing token
      const updated: DeviceToken = {
        ...existingByHash,
        userId: params.userId,
        userType: params.userType,
        tenantId: params.tenantId,
        platform: params.platform,
        deviceId: params.deviceId,
        deviceName: params.deviceName,
        appVersion: params.appVersion,
        active: true,
        updatedAt: new Date(),
      };
      deviceTokens.set(existingByHash.id, updated);
      return updated;
    }

    // Create new token registration
    const now = new Date();
    const entry: DeviceToken = {
      id: uuidv4(),
      userId: params.userId,
      userType: params.userType,
      tenantId: params.tenantId,
      token: params.token,
      tokenHash,
      platform: params.platform,
      deviceId: params.deviceId,
      deviceName: params.deviceName,
      appVersion: params.appVersion,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    deviceTokens.set(entry.id, entry);
    return entry;
  }

  /**
   * Find a device token by hash
   */
  async findByTokenHash(tokenHash: string): Promise<DeviceToken | undefined> {
    for (const token of deviceTokens.values()) {
      if (token.tokenHash === tokenHash) {
        return token;
      }
    }
    return undefined;
  }

  /**
   * Find a device token by raw token value
   */
  async findByToken(token: string): Promise<DeviceToken | undefined> {
    const tokenHash = hashToken(token);
    return this.findByTokenHash(tokenHash);
  }

  /**
   * Find all active tokens for a user
   */
  async findActiveByUser(
    userId: string,
    userType: 'user' | 'candidate',
    tenantId: string
  ): Promise<DeviceToken[]> {
    const results: DeviceToken[] = [];
    for (const token of deviceTokens.values()) {
      if (
        token.userId === userId &&
        token.userType === userType &&
        token.tenantId === tenantId &&
        token.active
      ) {
        results.push(token);
      }
    }
    return results;
  }

  /**
   * Find all active tokens for a tenant
   */
  async findActiveByTenant(tenantId: string): Promise<DeviceToken[]> {
    const results: DeviceToken[] = [];
    for (const token of deviceTokens.values()) {
      if (token.tenantId === tenantId && token.active) {
        results.push(token);
      }
    }
    return results;
  }

  /**
   * Deactivate a device token
   */
  async deactivate(id: string): Promise<boolean> {
    const token = deviceTokens.get(id);
    if (!token) return false;

    token.active = false;
    token.updatedAt = new Date();
    return true;
  }

  /**
   * Deactivate a device token by token value
   */
  async deactivateByToken(token: string): Promise<boolean> {
    const entry = await this.findByToken(token);
    if (!entry) return false;
    return this.deactivate(entry.id);
  }

  /**
   * Deactivate all tokens for a user
   */
  async deactivateAllForUser(
    userId: string,
    userType: 'user' | 'candidate',
    tenantId: string
  ): Promise<number> {
    let count = 0;
    for (const token of deviceTokens.values()) {
      if (
        token.userId === userId &&
        token.userType === userType &&
        token.tenantId === tenantId &&
        token.active
      ) {
        token.active = false;
        token.updatedAt = new Date();
        count++;
      }
    }
    return count;
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed(id: string): Promise<void> {
    const token = deviceTokens.get(id);
    if (token) {
      token.lastUsedAt = new Date();
    }
  }

  /**
   * Verify tenant ownership of a token registration
   */
  async verifyTenantOwnership(tokenId: string, tenantId: string): Promise<boolean> {
    const token = deviceTokens.get(tokenId);
    return token?.tenantId === tenantId;
  }

  /**
   * Cleanup inactive tokens older than retention period
   */
  async cleanupInactive(retentionMs = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    const cutoff = new Date(Date.now() - retentionMs);
    let count = 0;
    for (const [id, token] of deviceTokens.entries()) {
      if (!token.active && token.updatedAt < cutoff) {
        deviceTokens.delete(id);
        count++;
      }
    }
    return count;
  }
}

export const deviceTokenRepository = new DeviceTokenRepository();
