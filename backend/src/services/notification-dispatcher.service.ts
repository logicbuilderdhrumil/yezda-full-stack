/**
 * Notification Dispatcher Service
 * Phase 4.12-4.15: Pipeline notification module dispatch system
 *
 * Resolves recipients, loads templates, and routes notifications
 * through the correct channel (email / sms / in_app).
 * Delegates in-app notifications to the existing NotificationService.
 */

import type {
  NotificationChannel,
  NotificationModuleConfig,
  NotificationRecipientType,
  NotificationTriggerOn,
} from '../../../shared/@types/pipeline-modules.js';
import { auditService } from './audit.service.js';
import { metricsService } from './metrics.service.js';
import { notificationService } from './notification.service.js';

// ---------------------------------------------------------------------------
// Supporting Types
// ---------------------------------------------------------------------------

/** Contextual data required to dispatch a pipeline notification */
export interface NotificationContext {
  tenantId: string;
  pipelineId: string;
  assignmentId: string;
  stageId: string;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
  assigneeId?: string;
  assigneeEmail?: string;
  managerEmail?: string;
  pipelineName?: string;
  stageName?: string;
  customRecipient?: string;
}

/** Resolved recipient information */
interface ResolvedRecipient {
  id?: string;
  email?: string;
  phone?: string;
  channel: NotificationChannel;
}

/** Stub template object returned by loadTemplate */
interface NotificationTemplate {
  subject: string;
  body: string;
  channel: NotificationChannel;
}

/** Standard operation result */
interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

// ---------------------------------------------------------------------------
// Metrics constants
// ---------------------------------------------------------------------------

const DISPATCH_METRICS = {
  DISPATCH_TOTAL: 'notification_dispatch_total',
  DISPATCH_LATENCY: 'notification_dispatch_latency_ms',
  CHANNEL_SEND: 'notification_channel_send_total',
  TRIGGER_CHECK: 'notification_trigger_check_total',
} as const;

const LOG_PREFIX = '[NotificationDispatcher]';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class NotificationDispatcherService {
  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Main dispatch entry-point.
   *
   * 1. Resolves recipient from `recipientType` + context
   * 2. Loads template by `templateId`
   * 3. Interpolates template placeholders with context values
   * 4. Routes to the appropriate channel handler
   * 5. Logs audit + metrics
   */
  async dispatchNotification(
    config: NotificationModuleConfig,
    context: NotificationContext,
  ): Promise<OperationResult> {
    const start = Date.now();

    try {
      // 1. Resolve recipient
      const recipient = this.resolveRecipient(config.recipientType, config.channel, context);

      if (!recipient.email && !recipient.id && !recipient.phone) {
        const msg = `Unable to resolve recipient for type "${config.recipientType}"`;
        console.error(`${LOG_PREFIX} ${msg}`, { config, context });

        this.recordDispatchMetrics(false, Date.now() - start, config.channel);
        return { success: false, error: msg, errorCode: 'RECIPIENT_RESOLVE_ERROR' };
      }

      // 2. Load template
      const template = this.loadTemplate(config.templateId, config.channel);

      // 3. Interpolate
      const subject = this.interpolate(template.subject, context);
      const body = this.interpolate(template.body, context);

      // 4. Route to channel
      let result: OperationResult;

      switch (config.channel) {
        case 'email':
          result = await this.sendEmail(recipient.email ?? '', subject, body);
          break;
        case 'sms':
          result = await this.sendSms(recipient.phone ?? recipient.email ?? '', body);
          break;
        case 'in_app':
          result = await this.sendInApp(
            recipient.id ?? context.candidateId,
            context.tenantId,
            subject,
            body,
          );
          break;
        default: {
          const _exhaustive: never = config.channel;
          result = {
            success: false,
            error: `Unsupported channel: ${_exhaustive}`,
            errorCode: 'UNSUPPORTED_CHANNEL',
          };
        }
      }

      // 5. Audit + metrics
      const durationMs = Date.now() - start;

      auditService.log({
        eventType: 'NOTIFICATION_CREATED',
        actorId: 'system',
        actorType: 'system',
        targetId: context.assignmentId,
        targetType: 'pipeline_notification',
        channel: 'api',
        metadata: {
          tenantId: context.tenantId,
          pipelineId: context.pipelineId,
          stageId: context.stageId,
          notificationChannel: config.channel,
          recipientType: config.recipientType,
          templateId: config.templateId,
          triggerOn: config.triggerOn,
          dispatchSuccess: result.success,
        },
        success: result.success,
        errorMessage: result.error,
      });

      this.recordDispatchMetrics(result.success, durationMs, config.channel);

      if (result.success) {
        console.log(
          `${LOG_PREFIX} Dispatched ${config.channel} notification for assignment=${context.assignmentId} stage=${context.stageId}`,
        );
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown dispatch error';
      console.error(`${LOG_PREFIX} Dispatch failed:`, errorMessage);

      this.recordDispatchMetrics(false, Date.now() - start, config.channel);

      return {
        success: false,
        error: errorMessage,
        errorCode: 'NOTIFICATION_DISPATCH_ERROR',
      };
    }
  }

  /**
   * Given a trigger event, filters matching configs and dispatches each.
   *
   * Returns an aggregate result: success is true only when every dispatch
   * succeeds.
   */
  async checkTrigger(
    triggerEvent: NotificationTriggerOn,
    stageNotificationConfigs: NotificationModuleConfig[],
    context: NotificationContext,
  ): Promise<OperationResult<{ dispatched: number; failed: number }>> {
    metricsService.incrementCounter(DISPATCH_METRICS.TRIGGER_CHECK, {
      event: triggerEvent,
    });

    const matching = stageNotificationConfigs.filter((c) => c.triggerOn === triggerEvent);

    if (matching.length === 0) {
      return { success: true, data: { dispatched: 0, failed: 0 } };
    }

    console.log(
      `${LOG_PREFIX} Trigger "${triggerEvent}" matched ${matching.length} notification config(s)`,
    );

    let dispatched = 0;
    let failed = 0;

    for (const config of matching) {
      const result = await this.dispatchNotification(config, context);
      if (result.success) {
        dispatched++;
      } else {
        failed++;
      }
    }

    return {
      success: failed === 0,
      data: { dispatched, failed },
    };
  }

  // -------------------------------------------------------------------------
  // Recipient Resolution
  // -------------------------------------------------------------------------

  /**
   * Resolves recipient information from the notification context based on
   * the configured `recipientType`.
   */
  resolveRecipient(
    recipientType: NotificationRecipientType,
    channel: NotificationChannel,
    context: NotificationContext,
  ): ResolvedRecipient {
    switch (recipientType) {
      case 'candidate':
        return {
          id: context.candidateId,
          email: context.candidateEmail,
          channel,
        };
      case 'assignee':
        return {
          id: context.assigneeId,
          email: context.assigneeEmail,
          channel,
        };
      case 'manager':
        return {
          email: context.managerEmail,
          channel,
        };
      case 'custom':
        return {
          email: context.customRecipient,
          channel,
        };
      default: {
        const _exhaustive: never = recipientType;
        console.error(`${LOG_PREFIX} Unknown recipientType: ${_exhaustive}`);
        return { channel };
      }
    }
  }

  // -------------------------------------------------------------------------
  // Template Loading (stub)
  // -------------------------------------------------------------------------

  /**
   * Stub template loader.
   *
   * In production this would query a templates table keyed by `templateId`.
   * For now it returns a generic template with interpolation placeholders.
   */
  loadTemplate(templateId: string, channel: NotificationChannel): NotificationTemplate {
    // Default template with common placeholders
    return {
      subject: `Screening Update — {{stageName}}`,
      body: [
        `Hello {{candidateName}},`,
        '',
        `Your screening stage "{{stageName}}" in pipeline "{{pipelineName}}" has been updated.`,
        '',
        `Template: ${templateId}`,
        `Channel: ${channel}`,
      ].join('\n'),
      channel,
    };
  }

  // -------------------------------------------------------------------------
  // Channel Handlers (private)
  // -------------------------------------------------------------------------

  /**
   * Send an email notification (stub).
   *
   * Logs the intent and returns success. Replace with a real email provider
   * (e.g. SendGrid, SES) in production.
   */
  private async sendEmail(
    recipient: string,
    subject: string,
    body: string,
  ): Promise<OperationResult> {
    console.log(`${LOG_PREFIX} [email] To: ${recipient} | Subject: ${subject}`);

    metricsService.incrementCounter(DISPATCH_METRICS.CHANNEL_SEND, { channel: 'email' });

    // Stub — always succeeds
    return { success: true, data: { channel: 'email', recipient, subject, bodyLength: body.length } };
  }

  /**
   * Send an SMS notification (stub).
   */
  private async sendSms(
    recipient: string,
    message: string,
  ): Promise<OperationResult> {
    console.log(`${LOG_PREFIX} [sms] To: ${recipient} | Length: ${message.length}`);

    metricsService.incrementCounter(DISPATCH_METRICS.CHANNEL_SEND, { channel: 'sms' });

    // Stub — always succeeds
    return { success: true, data: { channel: 'sms', recipient, messageLength: message.length } };
  }

  /**
   * Send an in-app notification by delegating to the existing
   * NotificationService.
   */
  private async sendInApp(
    userId: string,
    tenantId: string,
    title: string,
    body: string,
  ): Promise<OperationResult> {
    console.log(`${LOG_PREFIX} [in_app] User: ${userId} | Title: ${title}`);

    metricsService.incrementCounter(DISPATCH_METRICS.CHANNEL_SEND, { channel: 'in_app' });

    const result = await notificationService.create(
      {
        tenantId,
        userId,
        userType: 'candidate',
        type: 'SCREENING',
        title,
        body,
      },
      { channel: 'api' },
    );

    return {
      success: result.success,
      data: result.data,
      error: result.error,
      errorCode: result.errorCode,
    };
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /**
   * Interpolate `{{placeholder}}` tokens in a template string with values
   * from the notification context.
   */
  private interpolate(template: string, context: NotificationContext): string {
    const replacements: Record<string, string> = {
      candidateName: context.candidateName ?? 'Candidate',
      candidateEmail: context.candidateEmail ?? '',
      pipelineName: context.pipelineName ?? 'Pipeline',
      stageName: context.stageName ?? 'Stage',
      pipelineId: context.pipelineId,
      stageId: context.stageId,
      assignmentId: context.assignmentId,
      candidateId: context.candidateId,
    };

    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => replacements[key] ?? '');
  }

  /**
   * Record dispatch metrics (latency + counter).
   */
  private recordDispatchMetrics(
    success: boolean,
    durationMs: number,
    channel: string,
  ): void {
    metricsService.incrementCounter(DISPATCH_METRICS.DISPATCH_TOTAL, {
      success: String(success),
      channel,
    });
    metricsService.recordLatency(DISPATCH_METRICS.DISPATCH_LATENCY, durationMs, {
      channel,
    });
  }
}

export const notificationDispatcherService = new NotificationDispatcherService();
