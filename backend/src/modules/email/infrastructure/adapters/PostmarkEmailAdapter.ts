/**
 * PostmarkEmailAdapter — Implements EmailPort using Postmark
 *
 * Uses the official `postmark` npm package.
 * Retries transient errors (2 retries, exponential backoff).
 */
import * as postmark from 'postmark';
import type { EmailPort } from '../../domain/ports/EmailPort.js';
import type { EmailMessage, EmailSendResult } from '../../domain/types/email-types.js';

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 500;

export class PostmarkEmailAdapter implements EmailPort {
  private readonly client: postmark.ServerClient;
  private readonly defaultFrom: string;

  constructor(serverToken: string, defaultFrom?: string) {
    this.client = new postmark.ServerClient(serverToken);
    this.defaultFrom = defaultFrom ?? 'noreply@yezda.com';
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    return this.withRetry(async () => {
      const result = await this.client.sendEmail({
        From: message.from ?? this.defaultFrom,
        To: message.to,
        Subject: message.subject,
        HtmlBody: message.htmlBody,
        TextBody: message.textBody,
        Tag: message.tag,
        Metadata: message.metadata,
      });
      return { success: true, messageId: result.MessageID };
    });
  }

  async sendEmailWithTemplate(
    to: string,
    templateAlias: string,
    templateModel: Record<string, unknown>,
    options?: { from?: string; tag?: string; metadata?: Record<string, string> },
  ): Promise<EmailSendResult> {
    return this.withRetry(async () => {
      const result = await this.client.sendEmailWithTemplate({
        From: options?.from ?? this.defaultFrom,
        To: to,
        TemplateAlias: templateAlias,
        TemplateModel: templateModel,
        Tag: options?.tag,
        Metadata: options?.metadata,
      });
      return { success: true, messageId: result.MessageID };
    });
  }

  /** Retry transient errors with exponential backoff. */
  private async withRetry(fn: () => Promise<EmailSendResult>): Promise<EmailSendResult> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (!this.isTransient(err) || attempt === MAX_RETRIES) {
          break;
        }
        await this.delay(BASE_DELAY_MS * Math.pow(2, attempt));
      }
    }
    return {
      success: false,
      error: lastError instanceof Error ? lastError.message : String(lastError),
    };
  }

  private isTransient(err: unknown): boolean {
    if (err instanceof postmark.Errors.InternalServerError) return true;
    if (err instanceof postmark.Errors.UnknownError) return true;
    if (err instanceof postmark.Errors.ApiInputError && (err as { statusCode?: number }).statusCode === 429) return true;
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
