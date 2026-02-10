/**
 * Screening Pipeline Repository Port
 */
import type {
  ScreeningPipeline,
  PipelineAssignment,
  PipelineStatus,
} from '../entities/screening-pipeline.entity.js';

export interface IScreeningPipelineRepository {
  findAll(tenantId: string): Promise<ScreeningPipeline[]>;
  findById(id: string): Promise<ScreeningPipeline | undefined>;
  findByIdAndTenant(id: string, tenantId: string): Promise<ScreeningPipeline | undefined>;
  create(pipeline: ScreeningPipeline): Promise<ScreeningPipeline>;
  update(id: string, data: Partial<ScreeningPipeline>): Promise<ScreeningPipeline | undefined>;
  updateStatus(id: string, status: PipelineStatus): Promise<ScreeningPipeline | undefined>;
  delete(id: string): Promise<boolean>;
  nameExists(name: string, tenantId: string, excludeId?: string): Promise<boolean>;
  countAssignmentsByPipeline(pipelineId: string): Promise<number>;
  createAssignment(assignment: PipelineAssignment): Promise<PipelineAssignment>;
  findAssignmentByIdAndTenant(id: string, tenantId: string): Promise<PipelineAssignment | undefined>;
  updateAssignment(id: string, data: Partial<PipelineAssignment>): Promise<PipelineAssignment | undefined>;
  assignmentExists(candidateId: string, pipelineId: string): Promise<boolean>;
  findAssignmentsByCandidateAndTenant(candidateId: string, tenantId: string): Promise<PipelineAssignment[]>;
}
