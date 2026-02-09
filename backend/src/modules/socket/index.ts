/**
 * Socket Module — Composition Root
 * Wires domain ports to infrastructure implementations.
 * Unlike Express-based modules, this returns an initialize/shutdown pair.
 */
import type { Server as HttpServer } from 'http';
import type { Server } from 'socket.io';
import { SocketService } from './application/SocketService.js';
import { SocketMetricsService } from './infrastructure/services/SocketMetricsService.js';
import { auditService } from '../../services/audit.service.js';
import { tokenService } from '../../services/token.service.js';
import type { IAuditService } from './domain/ports/IAuditService.js';
import type { ITokenService } from './domain/ports/ITokenService.js';

export interface SocketModule {
  /** Attach Socket.IO to the HTTP server and return the Server instance */
  initialize(httpServer: HttpServer): Server;
  /** Graceful shutdown of all socket connections */
  shutdown(): Promise<void>;
  /** Access the underlying SocketService for emitToUser / emitToTenant */
  service: SocketService;
}

export function createSocketModule(): SocketModule {
  const metricsService = new SocketMetricsService();
  const audit = auditService as unknown as IAuditService;
  const token = tokenService as unknown as ITokenService;

  const service = new SocketService(audit, token, metricsService);

  return {
    initialize: (httpServer) => service.initialize(httpServer),
    shutdown: () => service.shutdown(),
    service,
  };
}
