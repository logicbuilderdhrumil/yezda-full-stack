/**
 * Invite flow types for the frontend.
 * Covers member invites, candidate invites, and admin candidate invites.
 */

/** Invite status values. */
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

/** Invite type discriminator. */
export type InviteType = 'member' | 'candidate';

/** Base invite record. */
export interface Invite {
  id: string;
  email: string;
  type: InviteType;
  status: InviteStatus;
  organizationId: string;
  organizationName?: string;
  invitedBy: string;
  invitedByName?: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Payload for inviting a member to an organization. */
export interface InviteMemberPayload {
  email: string;
  role: 'admin' | 'manager' | 'user';
  orgName: string;
  inviterName: string;
}

/** Payload for inviting a candidate (from org context). */
export interface InviteCandidatePayload {
  email: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  phone?: string | undefined;
  dateOfBirth?: string | undefined;
  nationalInsuranceNumber?: string | undefined;
  organizationId?: string | undefined;
}

/** Payload for admin inviting a candidate to a specific organization. */
export interface AdminInviteCandidatePayload {
  email: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  phone?: string | undefined;
  dateOfBirth?: string | undefined;
  nationalInsuranceNumber?: string | undefined;
  organizationId: string;
}

/** Response from global identity lookup. */
export interface GlobalIdentityLookupResult {
  exists: boolean;
  candidateId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

/** Response from sending an invite. */
export interface InviteResponse {
  invite: Invite;
  message: string;
}

/** Accept invite token payload. */
export interface AcceptInvitePayload {
  token: string;
}

/** Accept invite response. */
export interface AcceptInviteResponse {
  success: boolean;
  type: InviteType;
  organizationName: string;
  redirectUrl: string;
}

/** Invite validation result (for token-based accept flow). */
export interface InviteValidation {
  valid: boolean;
  type: InviteType;
  email: string;
  organizationName: string;
  expiresAt: string;
  error?: 'expired' | 'already_accepted' | 'revoked' | 'invalid';
}
