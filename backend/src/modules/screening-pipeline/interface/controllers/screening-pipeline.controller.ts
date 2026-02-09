/**
 * Screening Pipeline Controller
 * HTTP handlers delegating to use cases via dependency injection.
 */

import type { Response } from 'express';
import type { AuthenticatedRoleRequest } from '../../../../shared/infrastructure/middleware/index.js';
import { getClientIp } from '../../../../shared/infrastructure/utils/index.js';
import type { PipelineContext } from '../../domain/entities/screening-pipeline.entity.js';
import type {
  ListPipelinesUseCase,
  GetPipelineUseCase,
  CreatePipelineUseCase,
  UpdatePipelineUseCase,
  ActivatePipelineUseCase,
  ArchivePipelineUseCase,
  DeletePipelineUseCase,
  AssignPipelineUseCase,
  GetAssignmentProgressUseCase,
  GetCandidateAssignmentsUseCase,
  CompleteStageUseCase,
} from '../../application/index.js';

export interface ScreeningPipelineUseCases {
  listPipelines: ListPipelinesUseCase;
  getPipeline: GetPipelineUseCase;
  createPipeline: CreatePipelineUseCase;
  updatePipeline: UpdatePipelineUseCase;
  activatePipeline: ActivatePipelineUseCase;
  archivePipeline: ArchivePipelineUseCase;
  deletePipeline: DeletePipelineUseCase;
  assignPipeline: AssignPipelineUseCase;
  getAssignmentProgress: GetAssignmentProgressUseCase;
  getCandidateAssignments: GetCandidateAssignmentsUseCase;
  completeStage: CompleteStageUseCase;
}

function getPipelineContext(req: AuthenticatedRoleRequest): PipelineContext {
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  const tenantId = req.user?.tenantId || (req.headers['x-tenant-id'] as string) || '';

  return {
    actorId: req.user?.sub || '',
    actorType: (req.user?.type || 'user') as 'user' | 'candidate',
    actorRoles: (req.user?.roles || []) as string[],
    tenantId,
    ipAddress: ip,
    userAgent,
    channel: 'api' as const,
  };
}

function errorStatus(code?: string): number {
  switch (code) {
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
    case 'PIPELINE_NOT_FOUND':
    case 'STAGE_NOT_FOUND':
      return 404;
    case 'NAME_EXISTS':
    case 'ALREADY_ACTIVE':
    case 'ALREADY_ARCHIVED':
    case 'ALREADY_ASSIGNED':
      return 409;
    case 'NOT_EDITABLE':
    case 'NOT_DELETABLE':
    case 'HAS_ASSIGNMENTS':
    case 'NO_STAGES':
    case 'ARCHIVED':
    case 'NOT_ACTIVE':
    case 'NOT_IN_PROGRESS':
    case 'STAGE_NOT_IN_PROGRESS':
      return 422;
    default:
      return 500;
  }
}

export class ScreeningPipelineController {
  constructor(private readonly useCases: ScreeningPipelineUseCases) {}

  listPipelines = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    const ctx = getPipelineContext(req);
    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }
    const result = await this.useCases.listPipelines.execute(ctx);
    if (!result.success) {
      res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };

  createPipeline = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    const ctx = getPipelineContext(req);
    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }
    const { name, description, stages, graph } = req.body;
    const result = await this.useCases.createPipeline.execute({ name, description, stages, graph }, ctx);
    if (!result.success) {
      res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(201).json(result.data);
  };

  getPipeline = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    const ctx = getPipelineContext(req);
    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }
    const result = await this.useCases.getPipeline.execute(req.params.id, ctx);
    if (!result.success) {
      res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };

  updatePipeline = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    const ctx = getPipelineContext(req);
    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }
    const { name, description, stages, graph } = req.body;
    const result = await this.useCases.updatePipeline.execute(req.params.id, { name, description, stages, graph }, ctx);
    if (!result.success) {
      res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };

  activatePipeline = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    const ctx = getPipelineContext(req);
    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }
    const result = await this.useCases.activatePipeline.execute(req.params.id, ctx);
    if (!result.success) {
      res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };

  archivePipeline = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    const ctx = getPipelineContext(req);
    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }
    const result = await this.useCases.archivePipeline.execute(req.params.id, ctx);
    if (!result.success) {
      res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };

  deletePipeline = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    const ctx = getPipelineContext(req);
    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }
    const result = await this.useCases.deletePipeline.execute(req.params.id, ctx);
    if (!result.success) {
      res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(204).send();
  };

  assignPipeline = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    const ctx = getPipelineContext(req);
    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }
    const result = await this.useCases.assignPipeline.execute(req.params.id, req.body.candidateId, ctx);
    if (!result.success) {
      res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(201).json(result.data);
  };

  getAssignmentProgress = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    const ctx = getPipelineContext(req);
    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }
    const result = await this.useCases.getAssignmentProgress.execute(req.params.id, ctx);
    if (!result.success) {
      res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };

  getCandidateAssignments = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    const ctx = getPipelineContext(req);
    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }
    const result = await this.useCases.getCandidateAssignments.execute(req.params.candidateId, ctx);
    if (!result.success) {
      res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };

  completeStage = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    const ctx = getPipelineContext(req);
    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }
    const result = await this.useCases.completeStage.execute(req.params.assignmentId, req.params.stageId, ctx);
    if (!result.success) {
      res.status(errorStatus(result.errorCode)).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };
}
