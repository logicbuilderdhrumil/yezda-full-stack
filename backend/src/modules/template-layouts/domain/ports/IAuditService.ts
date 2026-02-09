import type { RequestContext } from '../entities/template-layout.entity.js';
export interface IAuditService { log(event: string, context: RequestContext, details?: Record<string, unknown>): void; }
