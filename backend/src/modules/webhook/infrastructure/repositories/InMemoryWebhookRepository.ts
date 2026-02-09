import type { IWebhookRepository } from '../../domain/ports/IWebhookRepository.js';
import type { WebhookPayload, WebhookResult } from '../../domain/entities/webhook.entity.js';
export class InMemoryWebhookRepository implements IWebhookRepository {
  async handlePipelineWebhook(payload: WebhookPayload): Promise<WebhookResult> { console.log(`[Webhook] Pipeline stage ${payload.stageId}: ${payload.status}`); return { success: true }; }
}
