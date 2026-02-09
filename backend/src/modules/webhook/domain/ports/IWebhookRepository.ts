import type { WebhookPayload, WebhookResult } from '../entities/webhook.entity.js';
export interface IWebhookRepository { handlePipelineWebhook(payload: WebhookPayload): Promise<WebhookResult>; }
