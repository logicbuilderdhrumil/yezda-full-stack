/**
 * Review Task controller.
 */
import type { Request, Response } from 'express';
import type {
  ListReviewTasks,
  GetMyQueue,
  GetReviewTask,
  CreateReviewTask,
  AssignReviewTask,
  SubmitDecision,
} from '../../application/index.js';

export class ReviewTaskController {
  constructor(
    private listReviewTasksUC: ListReviewTasks,
    private getMyQueueUC: GetMyQueue,
    private getReviewTaskUC: GetReviewTask,
    private createReviewTaskUC: CreateReviewTask,
    private assignReviewTaskUC: AssignReviewTask,
    private submitDecisionUC: SubmitDecision,
  ) {}

  listReviewTasks = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const tasks = await this.listReviewTasksUC.execute(tenantId, req.query as any);
    res.json({ success: true, data: tasks });
  };

  getMyQueue = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const userId = (req as any).user?.id ?? '';
    const tasks = await this.getMyQueueUC.execute(tenantId, userId);
    res.json({ success: true, data: tasks });
  };

  getReviewTask = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const task = await this.getReviewTaskUC.execute(tenantId, req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: task });
  };

  createReviewTask = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const task = await this.createReviewTaskUC.execute(tenantId, req.body);
    res.status(201).json({ success: true, data: task });
  };

  assignReviewTask = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const task = await this.assignReviewTaskUC.execute(tenantId, req.params.id, req.body.assigneeId);
    if (!task) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: task });
  };

  submitDecision = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const userId = (req as any).user?.id ?? '';
    const task = await this.submitDecisionUC.execute(tenantId, req.params.id, userId, req.body);
    if (!task) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: task });
  };
}
