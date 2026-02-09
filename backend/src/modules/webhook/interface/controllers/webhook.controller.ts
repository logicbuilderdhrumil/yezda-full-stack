import type { Request, Response } from 'express';
import type { HandlePipelineWebhookUseCase } from '../../application/use-cases/handle-pipeline-webhook.js';
export class WebhookController {
  constructor(private readonly handleWebhook: HandlePipelineWebhookUseCase) {}
  pipelineWebhook = async (req: Request, res: Response) => { const result = await this.handleWebhook.execute(req.params.stageId, req.body); if (!result.success) { res.status(500).json({ error: result.error }); return; } res.json(result); };
}
