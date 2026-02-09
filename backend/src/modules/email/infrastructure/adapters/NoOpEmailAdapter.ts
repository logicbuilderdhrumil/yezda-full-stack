/**
 * NoOpEmailAdapter — Test/Dev adapter that logs instead of sending
 *
 * Used when POSTMARK_SERVER_TOKEN is not configured (development/test).
 */
import type { EmailPort } from '../../domain/ports/EmailPort.js';
import type { EmailMessage, EmailSendResult } from '../../domain/types/email-types.js';

export class NoOpEmailAdapter implements EmailPort {
  private readonly sentEmails: Array<{ type: 'direct' | 'template'; payload: unknown; timestamp: Date }> = [];

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    const entry = { type: 'direct' as const, payload: message, timestamp: new Date() };
    this.sentEmails.push(entry);
    console.log('[NoOpEmailAdapter] sendEmail:', JSON.stringify({ to: message.to, subject: message.subject, tag: message.tag }));
    return { success: true, messageId: `noop-${Date.now()}` };
  }

  async sendEmailWithTemplate(
    to: string,
    templateAlias: string,
    templateModel: Record<string, unknown>,
    options?: { from?: string; tag?: string; metadata?: Record<string, string> },
  ): Promise<EmailSendResult> {
    const entry = { type: 'template' as const, payload: { to, templateAlias, templateModel, options }, timestamp: new Date() };
    this.sentEmails.push(entry);
    console.log('[NoOpEmailAdapter] sendEmailWithTemplate:', JSON.stringify({ to, templateAlias, tag: options?.tag }));
    return { success: true, messageId: `noop-${Date.now()}` };
  }

  /** Get all emails that were "sent" (for test assertions). */
  getSentEmails() {
    return [...this.sentEmails];
  }

  /** Clear the sent emails log. */
  clear() {
    this.sentEmails.length = 0;
  }
}
