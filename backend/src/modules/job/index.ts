/**
 * Job module composition root.
 */
import { InMemoryJobRepository } from './infrastructure/index.js';
import { ListJobs, GetJobStatus, CancelJob } from './application/index.js';
import { JobController, createJobRoutes } from './interface/index.js';

export function createJobModule() {
  const repo = new InMemoryJobRepository();

  const listJobsUC = new ListJobs(repo);
  const getJobStatusUC = new GetJobStatus(repo);
  const cancelJobUC = new CancelJob(repo);

  const controller = new JobController(listJobsUC, getJobStatusUC, cancelJobUC);

  return { router: createJobRoutes(controller) };
}
