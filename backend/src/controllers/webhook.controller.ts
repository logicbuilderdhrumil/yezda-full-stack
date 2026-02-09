/**
 * Webhook Controller
 *
 * Handles incoming webhook callbacks from external services used by the
 * pipeline builder's external-service module type.
 */

import type { Request, Response } from 'express';
import { externalServiceAdapterService } from '../services/external-service-adapter.service.js';

/**
 * POST /api/v1/webhooks/pipeline/:stageId
 *
 * External service webhook callback.  No auth required — webhooks use
 * signature validation handled inside the adapter layer.
 */
export async function handlePipelineWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  const { stageId } = req.params;

  if (!stageId) {
    res.status(400).json({ error: 'Missing stageId parameter' });
    return;
  }

  try {
    const result = await externalServiceAdapterService.handleWebhookResponse(
      stageId,
      req.headers as Record<string, string | string[] | undefined>,
      req.body,
    );

    if (result.success) {
      res.status(200).json({ received: true, data: result.data });
    } else {
      res.status(400).json({
        received: true,
        error: result.error,
        errorCode: result.errorCode,
      });
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal webhook processing error';
    console.error(
      `[WebhookController] handlePipelineWebhook failed for stage ${stageId}: ${message}`,
    );
    res.status(500).json({ error: 'Internal server error' });
  }
}
