/**
 * EmailPort — Email sending abstraction
 *
 * Allows swapping email providers (Postmark, SendGrid, etc.)
 * without touching business logic.
 */
import type { EmailMessage, EmailSendResult } from '../types/email-types.js';

export interface EmailPort {
  /**
   * Send an email with explicit subject/body.
   */
  sendEmail(message: EmailMessage): Promise<EmailSendResult>;

  /**
   * Send an email using a pre-configured template (e.g. Postmark template alias).
   */
  sendEmailWithTemplate(
    to: string,
    templateAlias: string,
    templateModel: Record<string, unknown>,
    options?: {
      from?: string;
      tag?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<EmailSendResult>;
}
