/**
 * Asset Management Domain Port — Audit Service Interface
 */
import type { AssetEventType, RequestContext } from '../entities/asset.entity.js';

export interface IAuditService {
  log(event: AssetEventType, context: RequestContext, details?: Record<string, unknown>): void;
}
