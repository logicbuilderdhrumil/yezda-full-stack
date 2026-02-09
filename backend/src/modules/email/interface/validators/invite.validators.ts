/**
 * Invite Validators — Zod schemas for invite endpoints
 */
import { z } from 'zod';

export const sendOrgMemberInviteSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  role: z.string().min(1, 'Role is required').max(100),
  orgName: z.string().min(1, 'Organization name is required').max(255),
  inviterName: z.string().min(1, 'Inviter name is required').max(255),
});

export const sendCandidateInviteSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  orgName: z.string().min(1, 'Organization name is required').max(255),
  inviterName: z.string().min(1, 'Inviter name is required').max(255),
  candidateInfo: z
    .object({
      firstName: z.string().max(100).optional(),
      lastName: z.string().max(100).optional(),
      applicationId: z.string().uuid().optional(),
    })
    .optional(),
});

export const tokenParamSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, 'Invalid token format'),
});
