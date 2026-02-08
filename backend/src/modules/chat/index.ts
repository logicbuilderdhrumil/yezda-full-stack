/**
 * Chat Module — Composition Root
 */
import { PostgresChatRepository } from './infrastructure/repositories/PostgresChatRepository.js';
import { CreateConversationUseCase } from './application/use-cases/CreateConversationUseCase.js';
import { ListConversationsUseCase } from './application/use-cases/ListConversationsUseCase.js';
import { GetThreadUseCase } from './application/use-cases/GetThreadUseCase.js';
import { SendMessageUseCase } from './application/use-cases/SendMessageUseCase.js';
import { MarkMessageDeliveredUseCase } from './application/use-cases/MarkMessageDeliveredUseCase.js';
import { MarkMessageReadUseCase } from './application/use-cases/MarkMessageReadUseCase.js';
import { ArchiveConversationUseCase } from './application/use-cases/ArchiveConversationUseCase.js';
import { ChatController } from './interface/controllers/chat.controller.js';
import { createChatRoutes } from './interface/routes/chat.routes.js';

import { auditService } from '../../services/audit.service.js';
import { metricsService } from '../../services/metrics.service.js';
import type { IAuditService } from './domain/ports/audit-service.port.js';
import type { IMetricsService } from './domain/ports/metrics-service.port.js';

export function createChatModule() {
  const chatRepo = new PostgresChatRepository();
  const audit = auditService as unknown as IAuditService;
  const metrics = metricsService as unknown as IMetricsService;

  const createConvUC = new CreateConversationUseCase(chatRepo, audit, metrics);
  const listConvsUC = new ListConversationsUseCase(chatRepo, audit, metrics);
  const getThreadUC = new GetThreadUseCase(chatRepo, audit, metrics);
  const sendMessageUC = new SendMessageUseCase(chatRepo, audit, metrics);
  const markDeliveredUC = new MarkMessageDeliveredUseCase(chatRepo, audit, metrics);
  const markReadUC = new MarkMessageReadUseCase(chatRepo, audit, metrics);
  const archiveConvUC = new ArchiveConversationUseCase(chatRepo, audit, metrics);

  const controller = new ChatController(createConvUC, listConvsUC, getThreadUC, sendMessageUC, markDeliveredUC, markReadUC, archiveConvUC);
  const routes = createChatRoutes(controller);

  return { routes, controller, repositories: { chat: chatRepo } };
}
