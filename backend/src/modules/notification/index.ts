/**
 * Notification Module — Composition Root
 */
import { PostgresNotificationRepository } from './infrastructure/repositories/PostgresNotificationRepository.js';
import { ListNotificationsUseCase } from './application/use-cases/ListNotificationsUseCase.js';
import { GetNotificationUseCase } from './application/use-cases/GetNotificationUseCase.js';
import { MarkAsReadUseCase } from './application/use-cases/MarkAsReadUseCase.js';
import { MarkAsUnreadUseCase } from './application/use-cases/MarkAsUnreadUseCase.js';
import { MarkManyAsReadUseCase } from './application/use-cases/MarkManyAsReadUseCase.js';
import { GetUnreadCountUseCase } from './application/use-cases/GetUnreadCountUseCase.js';
import { NotificationController } from './interface/controllers/notification.controller.js';
import { createNotificationRoutes } from './interface/routes/notification.routes.js';

import { auditService } from '../../services/audit.service.js';
import { metricsService } from '../../services/metrics.service.js';
import type { IAuditService } from './domain/ports/audit-service.port.js';
import type { IMetricsService } from './domain/ports/metrics-service.port.js';

export function createNotificationModule() {
  const repo = new PostgresNotificationRepository();
  const audit = auditService as unknown as IAuditService;
  const metrics = metricsService as unknown as IMetricsService;

  const listUC = new ListNotificationsUseCase(repo, audit, metrics);
  const getUC = new GetNotificationUseCase(repo, audit, metrics);
  const markReadUC = new MarkAsReadUseCase(repo, audit, metrics);
  const markUnreadUC = new MarkAsUnreadUseCase(repo, audit, metrics);
  const markManyReadUC = new MarkManyAsReadUseCase(repo, audit, metrics);
  const unreadCountUC = new GetUnreadCountUseCase(repo, metrics);

  const controller = new NotificationController(listUC, getUC, markReadUC, markUnreadUC, markManyReadUC, unreadCountUC);
  const routes = createNotificationRoutes(controller);

  return { routes, controller, repositories: { notification: repo } };
}
