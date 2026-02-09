/**
 * Email Module — Composition Root
 *
 * Wires all email module dependencies using manual constructor injection.
 * Uses Postmark adapter when POSTMARK_SERVER_TOKEN is set, otherwise
 * falls back to NoOpEmailAdapter (logs to console).
 */
import { PostmarkEmailAdapter } from './infrastructure/adapters/PostmarkEmailAdapter.js';
import { NoOpEmailAdapter } from './infrastructure/adapters/NoOpEmailAdapter.js';
import { PostgresInviteTokenRepository } from './infrastructure/repositories/PostgresInviteTokenRepository.js';

import { SendOrgMemberInviteUseCase } from './application/use-cases/SendOrgMemberInviteUseCase.js';
import { SendCandidateInviteUseCase } from './application/use-cases/SendCandidateInviteUseCase.js';
import { VerifyInviteTokenUseCase } from './application/use-cases/VerifyInviteTokenUseCase.js';
import { AcceptInviteUseCase } from './application/use-cases/AcceptInviteUseCase.js';

import { InviteController } from './interface/controllers/invite.controller.js';
import { createInviteRoutes } from './interface/routes/invite.routes.js';

import type { EmailPort } from './domain/ports/EmailPort.js';

function createEmailAdapter(): EmailPort {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const defaultFrom = process.env.POSTMARK_FROM_ADDRESS ?? 'noreply@yezda.com';

  if (token) {
    console.log('[EmailModule] Using PostmarkEmailAdapter');
    return new PostmarkEmailAdapter(token, defaultFrom);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('[EmailModule] POSTMARK_SERVER_TOKEN is required in production');
  }

  console.log('[EmailModule] Using NoOpEmailAdapter (no POSTMARK_SERVER_TOKEN set)');
  return new NoOpEmailAdapter();
}

export function createEmailModule() {
  // ── Infrastructure ──────────────────────────────────────────────────────
  const emailAdapter = createEmailAdapter();
  const tokenRepo = new PostgresInviteTokenRepository();

  // ── Config ──────────────────────────────────────────────────────────────
  const baseInviteUrl = process.env.INVITE_BASE_URL ?? 'http://localhost:5173/invite';

  // ── Use Cases ───────────────────────────────────────────────────────────
  const sendOrgMemberInviteUC = new SendOrgMemberInviteUseCase(emailAdapter, tokenRepo, baseInviteUrl);
  const sendCandidateInviteUC = new SendCandidateInviteUseCase(emailAdapter, tokenRepo, baseInviteUrl);
  const verifyInviteTokenUC = new VerifyInviteTokenUseCase(tokenRepo);
  const acceptInviteUC = new AcceptInviteUseCase(tokenRepo);

  // ── Interface ───────────────────────────────────────────────────────────
  const controller = new InviteController(
    sendOrgMemberInviteUC,
    sendCandidateInviteUC,
    verifyInviteTokenUC,
    acceptInviteUC,
  );

  const routes = createInviteRoutes(controller);

  return {
    routes,
    controller,
    // Expose for inter-module integration
    useCases: {
      sendOrgMemberInvite: sendOrgMemberInviteUC,
      sendCandidateInvite: sendCandidateInviteUC,
      verifyInviteToken: verifyInviteTokenUC,
      acceptInvite: acceptInviteUC,
    },
    repositories: {
      inviteToken: tokenRepo,
    },
  };
}
