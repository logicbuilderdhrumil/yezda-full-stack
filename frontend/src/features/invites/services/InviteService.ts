/**
 * Invite service for API interactions.
 * Handles member invites, candidate invites, and admin candidate invites.
 */
import { ApiService } from '@/services/ApiService';
import type {
  InviteMemberPayload,
  InviteCandidatePayload,
  AdminInviteCandidatePayload,
  InviteResponse,
  AcceptInvitePayload,
  AcceptInviteResponse,
  InviteValidation,
  GlobalIdentityLookupResult,
  Invite,
} from '@/@types/invite';

/**
 * InviteService provides methods for invite flow operations.
 */
export const InviteService = {
  /**
   * Sends a member invite to join an organization.
   * @param payload - Member invite data
   * @returns Invite response with status
   */
  async sendMemberInvite(payload: InviteMemberPayload): Promise<InviteResponse> {
    const response = await ApiService.post<InviteResponse, InviteMemberPayload>(
      'invites.sendMember',
      payload,
    );
    return response.data;
  },

  /**
   * Sends a candidate invite from org context.
   * @param payload - Candidate invite data
   * @returns Invite response with status
   */
  async sendCandidateInvite(payload: InviteCandidatePayload): Promise<InviteResponse> {
    const response = await ApiService.post<InviteResponse, InviteCandidatePayload>(
      'invites.sendCandidate',
      payload,
    );
    return response.data;
  },

  /**
   * Admin sends a candidate invite to a specific organization.
   * @param payload - Admin candidate invite data
   * @returns Invite response with status
   */
  async sendAdminCandidateInvite(payload: AdminInviteCandidatePayload): Promise<InviteResponse> {
    const response = await ApiService.post<InviteResponse, AdminInviteCandidatePayload>(
      'invites.sendAdminCandidate',
      payload,
    );
    return response.data;
  },

  /**
   * Validates an invite token (for the accept-invite page).
   * @param token - Invite token
   * @returns Validation result
   */
  async validateToken(token: string): Promise<InviteValidation> {
    const response = await ApiService.get<InviteValidation>('invites.validate', {
      pathParams: { token },
    });
    return response.data;
  },

  /**
   * Accepts an invite using its token.
   * @param token - Invite token
   * @returns Accept result with redirect URL
   */
  async acceptInvite(token: string): Promise<AcceptInviteResponse> {
    const response = await ApiService.post<AcceptInviteResponse, AcceptInvitePayload>(
      'invites.accept',
      { token },
      { pathParams: { token } },
    );
    return response.data;
  },

  /**
   * Looks up a global candidate identity by email.
   * Used in admin invite flow to check if candidate already exists.
   * @param email - Email to look up
   * @returns Lookup result indicating if identity exists
   */
  async lookupGlobalIdentity(email: string): Promise<GlobalIdentityLookupResult> {
    const response = await ApiService.get<GlobalIdentityLookupResult>(
      'invites.lookupIdentity',
      { params: { email } },
    );
    return response.data;
  },

  /**
   * Lists invites for a specific organization.
   * @param organizationId - Organization ID
   * @returns List of invites
   */
  async listByOrganization(organizationId: string): Promise<Invite[]> {
    const response = await ApiService.get<Invite[]>('invites.listByOrg', {
      pathParams: { organizationId },
    });
    return response.data;
  },

  /**
   * Revokes a pending invite.
   * @param id - Invite ID
   */
  async revoke(id: string): Promise<void> {
    await ApiService.post('invites.revoke', undefined, {
      pathParams: { id },
    });
  },

  /**
   * Resends an invite email.
   * @param id - Invite ID
   */
  async resend(id: string): Promise<void> {
    await ApiService.post('invites.resend', undefined, {
      pathParams: { id },
    });
  },
};
