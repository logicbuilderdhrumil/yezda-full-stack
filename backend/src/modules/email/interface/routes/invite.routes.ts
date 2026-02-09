/**
 * Invite Routes — Express router for invite endpoints
 */
import { Router } from 'express';
import type { InviteController } from '../controllers/invite.controller.js';
import { requireAuthGuard, validateBody, validateParams } from '../../../../shared/infrastructure/middleware/index.js';
import { sendOrgMemberInviteSchema, sendCandidateInviteSchema, tokenParamSchema } from '../validators/invite.validators.js';

export function createInviteRoutes(controller: InviteController): Router {
  const router = Router();

  // ── Authenticated endpoints (send invites) ─────────────────────────────
  router.post(
    '/orgs/members',
    requireAuthGuard,
    validateBody(sendOrgMemberInviteSchema),
    controller.sendOrgMemberInvite,
  );

  router.post(
    '/orgs/candidates',
    requireAuthGuard,
    validateBody(sendCandidateInviteSchema),
    controller.sendCandidateInvite,
  );

  // ── Public endpoints (verify and accept invites) ───────────────────────
  router.get(
    '/:token/verify',
    validateParams(tokenParamSchema),
    controller.verifyInviteToken,
  );

  router.post(
    '/:token/accept',
    validateParams(tokenParamSchema),
    controller.acceptInvite,
  );

  return router;
}
