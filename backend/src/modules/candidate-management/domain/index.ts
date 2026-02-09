/**
 * Domain Layer Barrel Export
 */
export * from './entities/candidate.entity.js';
export type { ICandidateRepository } from './ports/candidate-repository.port.js';
export type { IAuditService, AuditLogEntry } from './ports/audit-service.port.js';
export type { IMetricsService } from './ports/metrics-service.port.js';
export type { IGlobalCandidateIdentityService } from './ports/global-candidate-identity-service.port.js';
