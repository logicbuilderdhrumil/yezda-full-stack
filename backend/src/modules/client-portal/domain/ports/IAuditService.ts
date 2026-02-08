/**
 * Client Portal Domain Port — Audit Service Interface
 */
import type { RequestContext } from '../entities/client-portal.entity.js';

export interface IAuditService {
  log(event: string, context: RequestContext, details?: Record<string, unknown>): void;
}
