/**
 * Job controller.
 */
import type { Request, Response } from 'express';
import type { ListJobs, GetJobStatus, CancelJob } from '../../application/index.js';

export class JobController {
  constructor(
    private listJobsUC: ListJobs,
    private getJobStatusUC: GetJobStatus,
    private cancelJobUC: CancelJob,
  ) {}

  listJobs = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id') ?? 'default';
    const result = await this.listJobsUC.execute({ tenantId, ...req.query } as any);
    res.json({ success: true, data: result });
  };

  getJobStatus = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id') ?? 'default';
    const job = await this.getJobStatusUC.execute(tenantId, req.params.jobId);
    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }
    res.json({ success: true, data: job });
  };

  cancelJob = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id') ?? 'default';
    const job = await this.cancelJobUC.execute(tenantId, req.params.jobId);
    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }
    res.json({ success: true, data: job });
  };
}
