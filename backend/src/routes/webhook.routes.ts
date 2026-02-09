/**
 * Webhook Routes
 *
 * Routes for external service webhook callbacks used by the pipeline builder.
 */

import { Router } from 'express';
import * as webhookController from '../controllers/webhook.controller.js';

const router = Router();

// POST /api/v1/webhooks/pipeline/:stageId — External service webhook callback
router.post('/pipeline/:stageId', webhookController.handlePipelineWebhook);

export default router;
