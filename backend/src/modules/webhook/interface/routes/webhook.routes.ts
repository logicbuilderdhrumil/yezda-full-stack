import { Router } from 'express';
import type { WebhookController } from '../controllers/webhook.controller.js';
export function createWebhookRoutes(ctrl: WebhookController): Router { const r = Router(); r.post('/pipeline/:stageId', ctrl.pipelineWebhook); return r; }
