/**
 * IInviteTokenRepository — Persistence port for invite tokens
 */
import type { InviteType, InviteTokenData, InviteTokenRecord } from '../types/email-types.js';

export interface IInviteTokenRepository {
  /** Persist a new invite token. */
  create(token: InviteTokenData): Promise<void>;

  /** Look up a token by its SHA-256 hash. Returns null if not found. */
  findByHash(tokenHash: string): Promise<InviteTokenRecord | null>;

  /** Mark a token as consumed (single-use). */
  markConsumed(id: string, consumedAt: Date): Promise<void>;

  /** Find all pending (unconsumed, unexpired) tokens for an email + type + tenant. */
  findPendingByEmail(email: string, type: InviteType, tenantId: string): Promise<InviteTokenRecord[]>;

  /** Count tokens sent to an email since a given date (rate limiting). */
  countRecentByEmail(email: string, sinceDate: Date): Promise<number>;

  /** Revoke (invalidate) all pending tokens for an email + type + tenant. Returns revoked count. */
  revokeByEmail(email: string, type: InviteType, tenantId: string): Promise<number>;

  /** List all invite tokens for a tenant, ordered by most recent first. */
  listByTenantId(tenantId: string): Promise<InviteTokenRecord[]>;
}
