import type { Router } from 'express';
import { InMemoryWebhookRepository } from './infrastructure/repositories/InMemoryWebhookRepository.js';
import { HandlePipelineWebhookUseCase } from './application/use-cases/handle-pipeline-webhook.js';
import { WebhookController } from './interface/controllers/webhook.controller.js';
import { createWebhookRoutes } from './interface/routes/webhook.routes.js';
export interface WebhookModule { router: Router; }
export function createWebhookModule(): WebhookModule {
  const repo = new InMemoryWebhookRepository();
  return { router: createWebhookRoutes(new WebhookController(new HandlePipelineWebhookUseCase(repo))) };
}
