/**
 * Email Module — Domain Types
 */

// ── Invite Types ─────────────────────────────────────────────────────────────

export type InviteType = 'org_member_invite' | 'candidate_invite';

export type InviteTokenStatus = 'pending' | 'consumed' | 'expired' | 'revoked';

// ── Email Message ────────────────────────────────────────────────────────────

export interface EmailMessage {
  to: string;
  subject: string;
  htmlBody?: string;
  textBody?: string;
  templateAlias?: string;
  templateModel?: Record<string, unknown>;
  from?: string;
  tag?: string;
  metadata?: Record<string, string>;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ── Invite Token Data ────────────────────────────────────────────────────────

export interface InviteTokenMetadata {
  role?: string;
  orgId?: string;
  orgName?: string;
  inviterName?: string;
  candidateInfo?: {
    firstName?: string;
    lastName?: string;
    applicationId?: string;
  };
}

export interface InviteTokenData {
  id: string;
  tokenHash: string;
  type: InviteType;
  email: string;
  tenantId: string;
  invitedByUserId: string;
  metadata: InviteTokenMetadata;
  expiresAt: Date;
  createdAt: Date;
}

export interface InviteTokenRecord extends InviteTokenData {
  consumedAt: Date | null;
  status: InviteTokenStatus;
}

// ── Use Case Results ─────────────────────────────────────────────────────────

export type SendInviteResult =
  | { success: true; tokenPlaintext: string; expiresAt: Date }
  | { success: false; error: string; errorCode: string };

export type VerifyInviteResult =
  | {
      valid: true;
      invite: {
        id: string;
        type: InviteType;
        email: string;
        tenantId: string;
        invitedByUserId: string;
        metadata: InviteTokenMetadata;
        expiresAt: Date;
      };
    }
  | { valid: false; reason: string };

export type AcceptInviteResult =
  | { success: true; userId: string; isNewUser: boolean }
  | { success: false; error: string; errorCode: string };

// ── Context ──────────────────────────────────────────────────────────────────

export interface InviteContext {
  actorId: string;
  actorType: 'user' | 'admin';
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}
