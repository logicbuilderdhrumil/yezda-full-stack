/**
 * Review Task module composition root.
 */
import { InMemoryReviewTaskRepository } from './infrastructure/index.js';
import {
  ListReviewTasks,
  GetMyQueue,
  GetReviewTask,
  CreateReviewTask,
  AssignReviewTask,
  SubmitDecision,
} from './application/index.js';
import { ReviewTaskController, createReviewTaskRoutes } from './interface/index.js';

export function createReviewTaskModule() {
  const repo = new InMemoryReviewTaskRepository();

  const listReviewTasksUC = new ListReviewTasks(repo);
  const getMyQueueUC = new GetMyQueue(repo);
  const getReviewTaskUC = new GetReviewTask(repo);
  const createReviewTaskUC = new CreateReviewTask(repo);
  const assignReviewTaskUC = new AssignReviewTask(repo);
  const submitDecisionUC = new SubmitDecision(repo);

  const controller = new ReviewTaskController(
    listReviewTasksUC,
    getMyQueueUC,
    getReviewTaskUC,
    createReviewTaskUC,
    assignReviewTaskUC,
    submitDecisionUC,
  );

  return { router: createReviewTaskRoutes(controller) };
}
