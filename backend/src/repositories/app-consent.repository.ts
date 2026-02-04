/**
 * App Consent Repository
 * Task 1.2: Consent storage with scope and versioning
 */

import { v4 as uuidv4 } from 'uuid';
import type { ConsentDecision, ConsentScope } from '../models/app-consent.model.js';

// In-memory storage for development (would be PostgreSQL in production)
const consentStore = new Map<string, ConsentDecision>();

/**
 * Generate storage key for consent records
 */
function getConsentKey(tenantId: string, candidateId: string): string {
  return `${tenantId}:${candidateId}`;
}

export const appConsentRepository = {
  /**
   * Find the most recent consent for a candidate
   */
  async findByCandidateId(
    tenantId: string,
    candidateId: string
  ): Promise<ConsentDecision | undefined> {
    const key = getConsentKey(tenantId, candidateId);
    return consentStore.get(key);
  },

  /**
   * Find consent by ID
   */
  async findById(id: string): Promise<ConsentDecision | undefined> {
    for (const consent of consentStore.values()) {
      if (consent.id === id) {
        return consent;
      }
    }
    return undefined;
  },

  /**
   * Create a new consent record
   */
  async create(params: {
    tenantId: string;
    candidateId: string;
    screeningId?: string;
    scopes: ConsentScope[];
    expiresAt?: Date;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ConsentDecision> {
    const key = getConsentKey(params.tenantId, params.candidateId);
    const existing = consentStore.get(key);
    const version = existing ? existing.version + 1 : 1;

    const now = new Date();
    const consent: ConsentDecision = {
      id: uuidv4(),
      tenantId: params.tenantId,
      candidateId: params.candidateId,
      screeningId: params.screeningId,
      scopes: params.scopes,
      status: 'granted',
      version,
      consentedAt: now,
      expiresAt: params.expiresAt,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
      createdAt: now,
      updatedAt: now,
    };

    consentStore.set(key, consent);
    return consent;
  },

  /**
   * Update consent scopes (creates new version)
   */
  async updateScopes(
    tenantId: string,
    candidateId: string,
    scopes: ConsentScope[],
    expiresAt?: Date,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ConsentDecision | undefined> {
    const key = getConsentKey(tenantId, candidateId);
    const existing = consentStore.get(key);

    if (!existing) {
      return undefined;
    }

    const now = new Date();
    const updated: ConsentDecision = {
      ...existing,
      scopes,
      expiresAt: expiresAt ?? existing.expiresAt,
      version: existing.version + 1,
      consentedAt: now, // Reset consent timestamp on update
      ipAddress,
      userAgent,
      updatedAt: now,
    };

    consentStore.set(key, updated);
    return updated;
  },

  /**
   * Withdraw consent
   */
  async withdraw(
    tenantId: string,
    candidateId: string,
    reason?: string
  ): Promise<ConsentDecision | undefined> {
    const key = getConsentKey(tenantId, candidateId);
    const existing = consentStore.get(key);

    if (!existing) {
      return undefined;
    }

    const now = new Date();
    const updated: ConsentDecision = {
      ...existing,
      status: 'withdrawn',
      withdrawnAt: now,
      metadata: {
        ...existing.metadata,
        withdrawalReason: reason,
      },
      updatedAt: now,
    };

    consentStore.set(key, updated);
    return updated;
  },

  /**
   * Mark consent as expired
   */
  async markExpired(
    tenantId: string,
    candidateId: string
  ): Promise<ConsentDecision | undefined> {
    const key = getConsentKey(tenantId, candidateId);
    const existing = consentStore.get(key);

    if (!existing) {
      return undefined;
    }

    const now = new Date();
    const updated: ConsentDecision = {
      ...existing,
      status: 'expired',
      updatedAt: now,
    };

    consentStore.set(key, updated);
    return updated;
  },

  /**
   * Find all consents for a tenant (admin use)
   */
  async findByTenant(tenantId: string, limit = 100): Promise<ConsentDecision[]> {
    const results: ConsentDecision[] = [];

    for (const consent of consentStore.values()) {
      if (consent.tenantId === tenantId) {
        results.push(consent);
        if (results.length >= limit) break;
      }
    }

    return results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  },

  /**
   * Delete consent record (for testing)
   */
  async delete(tenantId: string, candidateId: string): Promise<boolean> {
    const key = getConsentKey(tenantId, candidateId);
    return consentStore.delete(key);
  },

  /**
   * Clear all records (for testing)
   */
  async clear(): Promise<void> {
    consentStore.clear();
  },
};
