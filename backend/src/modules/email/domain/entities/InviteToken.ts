/**
 * InviteToken — Domain Entity
 *
 * Represents a secure, time-limited invite token.
 * Token is hashed (SHA-256) before storage; plaintext is sent once in the email.
 */
import { randomBytes, createHash, randomUUID } from 'node:crypto';
import type { InviteType, InviteTokenMetadata, InviteTokenData, InviteTokenRecord, InviteTokenStatus } from '../types/email-types.js';

/** Default expiry in days per invite type */
const DEFAULT_EXPIRY_DAYS: Record<InviteType, number> = {
  org_member_invite: 7,
  candidate_invite: 14,
};

export class InviteToken {
  readonly id: string;
  readonly tokenHash: string;
  readonly type: InviteType;
  readonly email: string;
  readonly tenantId: string;
  readonly invitedByUserId: string;
  readonly metadata: InviteTokenMetadata;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  private _consumedAt: Date | null;
  private _status: InviteTokenStatus;

  private constructor(data: InviteTokenRecord) {
    this.id = data.id;
    this.tokenHash = data.tokenHash;
    this.type = data.type;
    this.email = data.email;
    this.tenantId = data.tenantId;
    this.invitedByUserId = data.invitedByUserId;
    this.metadata = data.metadata;
    this.expiresAt = data.expiresAt;
    this.createdAt = data.createdAt;
    this._consumedAt = data.consumedAt;
    this._status = data.status;
  }

  // ── Factories ────────────────────────────────────────────────────────────

  /**
   * Create a new invite token with a cryptographically random plaintext.
   * Returns both the entity (with hashed token) and the plaintext for email delivery.
   */
  static create(params: {
    type: InviteType;
    email: string;
    tenantId: string;
    invitedByUserId: string;
    metadata: InviteTokenMetadata;
    expiresInDays?: number;
  }): { entity: InviteToken; plaintextToken: string } {
    const plaintext = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(plaintext).digest('hex');
    const expiryDays = params.expiresInDays ?? DEFAULT_EXPIRY_DAYS[params.type];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

    const entity = new InviteToken({
      id: randomUUID(),
      tokenHash: hash,
      type: params.type,
      email: params.email.toLowerCase().trim(),
      tenantId: params.tenantId,
      invitedByUserId: params.invitedByUserId,
      metadata: params.metadata,
      expiresAt,
      createdAt: now,
      consumedAt: null,
      status: 'pending',
    });

    return { entity, plaintextToken: plaintext };
  }

  /** Reconstruct an entity from a persistence record. */
  static fromRecord(record: InviteTokenRecord): InviteToken {
    return new InviteToken(record);
  }

  // ── Accessors ────────────────────────────────────────────────────────────

  get consumedAt(): Date | null {
    return this._consumedAt;
  }

  get status(): InviteTokenStatus {
    if (this._status === 'pending' && this.isExpired()) {
      return 'expired';
    }
    return this._status;
  }

  // ── Business Logic ───────────────────────────────────────────────────────

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isConsumed(): boolean {
    return this._consumedAt !== null;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isConsumed() && this._status === 'pending';
  }

  /** Mark the token as consumed (single-use). Throws if already consumed or expired. */
  consume(): void {
    if (this.isConsumed()) {
      throw new Error('Invite token has already been consumed');
    }
    if (this.isExpired()) {
      throw new Error('Invite token has expired');
    }
    this._consumedAt = new Date();
    this._status = 'consumed';
  }

  // ── Serialization ────────────────────────────────────────────────────────

  /** Convert to persistence-ready data (without status — status is derived). */
  toData(): InviteTokenData {
    return {
      id: this.id,
      tokenHash: this.tokenHash,
      type: this.type,
      email: this.email,
      tenantId: this.tenantId,
      invitedByUserId: this.invitedByUserId,
      metadata: this.metadata,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
    };
  }
}
