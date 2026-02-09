/**
 * In-Memory Screening Pipeline Repository
 * Infrastructure implementation of IScreeningPipelineRepository.
 */

import type { IScreeningPipelineRepository } from '../../domain/ports/screening-pipeline-repository.port.js';
import type {
  ScreeningPipeline,
  PipelineAssignment,
  PipelineStatus,
} from '../../domain/entities/screening-pipeline.entity.js';

const pipelines: Map<string, ScreeningPipeline> = new Map();
const assignments: Map<string, PipelineAssignment> = new Map();

export class InMemoryScreeningPipelineRepository implements IScreeningPipelineRepository {
  async findAll(tenantId: string): Promise<ScreeningPipeline[]> {
    return Array.from(pipelines.values()).filter((p) => p.tenantId === tenantId);
  }

  async findById(id: string): Promise<ScreeningPipeline | undefined> {
    return pipelines.get(id);
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<ScreeningPipeline | undefined> {
    const pipeline = pipelines.get(id);
    return pipeline && pipeline.tenantId === tenantId ? pipeline : undefined;
  }

  async create(pipeline: ScreeningPipeline): Promise<ScreeningPipeline> {
    pipelines.set(pipeline.id, pipeline);
    return pipeline;
  }

  async update(
    id: string,
    data: Partial<ScreeningPipeline>,
  ): Promise<ScreeningPipeline | undefined> {
    const existing = pipelines.get(id);
    if (!existing) return undefined;
    const updated: ScreeningPipeline = { ...existing, ...data, updatedAt: new Date() };
    pipelines.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: PipelineStatus): Promise<ScreeningPipeline | undefined> {
    return this.update(id, { status });
  }

  async delete(id: string): Promise<boolean> {
    return pipelines.delete(id);
  }

  async nameExists(name: string, tenantId: string, excludeId?: string): Promise<boolean> {
    for (const pipeline of pipelines.values()) {
      if (
        pipeline.tenantId === tenantId &&
        pipeline.name.toLowerCase() === name.toLowerCase() &&
        pipeline.id !== excludeId
      ) {
        return true;
      }
    }
    return false;
  }

  async countAssignmentsByPipeline(pipelineId: string): Promise<number> {
    let count = 0;
    for (const a of assignments.values()) {
      if (a.pipelineId === pipelineId) count++;
    }
    return count;
  }

  async createAssignment(assignment: PipelineAssignment): Promise<PipelineAssignment> {
    assignments.set(assignment.id, assignment);
    return assignment;
  }

  async findAssignmentByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<PipelineAssignment | undefined> {
    const assignment = assignments.get(id);
    return assignment && assignment.tenantId === tenantId ? assignment : undefined;
  }

  async updateAssignment(
    id: string,
    data: Partial<PipelineAssignment>,
  ): Promise<PipelineAssignment | undefined> {
    const existing = assignments.get(id);
    if (!existing) return undefined;
    const updated: PipelineAssignment = { ...existing, ...data, updatedAt: new Date() };
    assignments.set(id, updated);
    return updated;
  }

  async assignmentExists(candidateId: string, pipelineId: string): Promise<boolean> {
    for (const a of assignments.values()) {
      if (
        a.candidateId === candidateId &&
        a.pipelineId === pipelineId &&
        a.status !== 'cancelled'
      ) {
        return true;
      }
    }
    return false;
  }

  async findAssignmentsByCandidateAndTenant(
    candidateId: string,
    tenantId: string,
  ): Promise<PipelineAssignment[]> {
    return Array.from(assignments.values()).filter(
      (a) => a.candidateId === candidateId && a.tenantId === tenantId,
    );
  }

  /** Clear all data (testing) */
  async clear(): Promise<void> {
    pipelines.clear();
    assignments.clear();
  }
}
