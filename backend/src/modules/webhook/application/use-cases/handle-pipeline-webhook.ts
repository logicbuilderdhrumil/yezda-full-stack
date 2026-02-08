import type { IWebhookRepository } from '../../domain/ports/IWebhookRepository.js';
import type { WebhookResult } from '../../domain/entities/webhook.entity.js';
export class HandlePipelineWebhookUseCase {
  constructor(private readonly repo: IWebhookRepository) {}
  async execute(stageId: string, body: Record<string, unknown>): Promise<WebhookResult> { return this.repo.handlePipelineWebhook({ stageId, status: (body.status as string) ?? 'unknown', data: body, timestamp: new Date() }); }
}
