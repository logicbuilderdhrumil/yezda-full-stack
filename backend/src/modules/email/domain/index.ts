/**
 * Email Module — Domain Barrel Export
 */

// Types
export type {
  InviteType,
  InviteTokenStatus,
  EmailMessage,
  EmailSendResult,
  InviteTokenMetadata,
  InviteTokenData,
  InviteTokenRecord,
  SendInviteResult,
  VerifyInviteResult,
  AcceptInviteResult,
  InviteContext,
} from './types/email-types.js';

// Ports
export type { EmailPort } from './ports/EmailPort.js';
export type { IInviteTokenRepository } from './ports/InviteTokenRepository.port.js';

// Entities
export { InviteToken } from './entities/InviteToken.js';
