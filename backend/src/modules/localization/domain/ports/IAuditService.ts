import type { RequestContext } from '../entities/localization.entity.js';
export interface IAuditService { log(event: string, context: RequestContext, details?: Record<string, unknown>): void; }
