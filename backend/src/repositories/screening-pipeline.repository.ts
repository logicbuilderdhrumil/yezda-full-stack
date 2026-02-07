/**
 * Screening Pipeline Repository
 * In-memory persistence layer for screening pipelines with tenant isolation.
 */

import type {
  ScreeningPipeline,
  PipelineAssignment,
  PipelineStatus,
  StageStatus,
} from '../models/screening-pipeline.model.js';

// In-memory stores
const pipelines: Map<string, ScreeningPipeline> = new Map();
const assignments: Map<string, PipelineAssignment> = new Map();

export class ScreeningPipelineRepository {
  /**
   * Find all pipelines for a tenant
   */
  async findAll(tenantId: string): Promise<ScreeningPipeline[]> {
    return Array.from(pipelines.values()).filter((p) => p.tenantId === tenantId);
  }

  /**
   * Find pipeline by ID
   */
  async findById(id: string): Promise<ScreeningPipeline | undefined> {
    return pipelines.get(id);
  }

  /**
   * Find pipeline by ID with tenant scoping
   */
  async findByIdAndTenant(id: string, tenantId: string): Promise<ScreeningPipeline | undefined> {
    const pipeline = pipelines.get(id);
    if (pipeline && pipeline.tenantId === tenantId) {
      return pipeline;
    }
    return undefined;
  }

  /**
   * Create a new pipeline
   */
  async create(pipeline: ScreeningPipeline): Promise<ScreeningPipeline> {
    pipelines.set(pipeline.id, pipeline);
    return pipeline;
  }

  /**
   * Update a pipeline
   */
  async update(
    id: string,
    data: Partial<Omit<ScreeningPipeline, 'id' | 'tenantId' | 'createdAt' | 'createdBy'>>
  ): Promise<ScreeningPipeline | undefined> {
    const existing = pipelines.get(id);
    if (!existing) return undefined;

    const updated: ScreeningPipeline = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    pipelines.set(id, updated);
    return updated;
  }

  /**
   * Update pipeline status
   */
  async updateStatus(id: string, status: PipelineStatus): Promise<ScreeningPipeline | undefined> {
    return this.update(id, { status });
  }

  /**
   * Delete a pipeline
   */
  async delete(id: string): Promise<boolean> {
    return pipelines.delete(id);
  }

  /**
   * Check if pipeline name exists in tenant
   */
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

  // Assignment operations

  /**
   * Find assignments by pipeline ID
   */
  async findAssignmentsByPipeline(pipelineId: string): Promise<PipelineAssignment[]> {
    return Array.from(assignments.values()).filter((a) => a.pipelineId === pipelineId);
  }

  /**
   * Find assignments by candidate ID
   */
  async findAssignmentsByCandidate(candidateId: string): Promise<PipelineAssignment[]> {
    return Array.from(assignments.values()).filter((a) => a.candidateId === candidateId);
  }

  /**
   * Find assignments by candidate ID with tenant scoping
   */
  async findAssignmentsByCandidateAndTenant(
    candidateId: string,
    tenantId: string
  ): Promise<PipelineAssignment[]> {
    return Array.from(assignments.values()).filter(
      (a) => a.candidateId === candidateId && a.tenantId === tenantId
    );
  }

  /**
   * Find assignment by ID
   */
  async findAssignmentById(id: string): Promise<PipelineAssignment | undefined> {
    return assignments.get(id);
  }

  /**
   * Find assignment by ID with tenant scoping
   */
  async findAssignmentByIdAndTenant(
    id: string,
    tenantId: string
  ): Promise<PipelineAssignment | undefined> {
    const assignment = assignments.get(id);
    if (assignment && assignment.tenantId === tenantId) {
      return assignment;
    }
    return undefined;
  }

  /**
   * Check if assignment already exists for candidate and pipeline
   */
  async assignmentExists(candidateId: string, pipelineId: string): Promise<boolean> {
    for (const assignment of assignments.values()) {
      if (
        assignment.candidateId === candidateId &&
        assignment.pipelineId === pipelineId &&
        assignment.status !== 'cancelled'
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Create an assignment
   */
  async createAssignment(assignment: PipelineAssignment): Promise<PipelineAssignment> {
    assignments.set(assignment.id, assignment);
    return assignment;
  }

  /**
   * Update an assignment
   */
  async updateAssignment(
    id: string,
    data: Partial<Omit<PipelineAssignment, 'id' | 'tenantId' | 'pipelineId' | 'candidateId' | 'createdAt' | 'assignedBy' | 'assignedAt'>>
  ): Promise<PipelineAssignment | undefined> {
    const existing = assignments.get(id);
    if (!existing) return undefined;

    const updated: PipelineAssignment = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    assignments.set(id, updated);
    return updated;
  }

  /**
   * Update stage status within an assignment
   */
  async updateStageStatus(
    assignmentId: string,
    stageId: string,
    status: StageStatus
  ): Promise<PipelineAssignment | undefined> {
    const existing = assignments.get(assignmentId);
    if (!existing) return undefined;

    const updatedStageStatuses = {
      ...existing.stageStatuses,
      [stageId]: status,
    };

    return this.updateAssignment(assignmentId, { stageStatuses: updatedStageStatuses });
  }

  /**
   * Delete an assignment
   */
  async deleteAssignment(id: string): Promise<boolean> {
    return assignments.delete(id);
  }

  /**
   * Clear all data (for testing)
   */
  async clear(): Promise<void> {
    pipelines.clear();
    assignments.clear();
  }

  /**
   * Get pipeline count for tenant (for testing/metrics)
   */
  async countByTenant(tenantId: string): Promise<number> {
    let count = 0;
    for (const pipeline of pipelines.values()) {
      if (pipeline.tenantId === tenantId) count++;
    }
    return count;
  }

  /**
   * Get assignment count for pipeline (for testing/metrics)
   */
  async countAssignmentsByPipeline(pipelineId: string): Promise<number> {
    let count = 0;
    for (const assignment of assignments.values()) {
      if (assignment.pipelineId === pipelineId) count++;
    }
    return count;
  }
}

export const screeningPipelineRepository = new ScreeningPipelineRepository();
