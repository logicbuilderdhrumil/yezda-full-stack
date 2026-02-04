/**
 * App Application Intake Repository
 * Task 1.2, 1.3, 1.4: Data access for applications and responses
 */

import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../db/postgres.js';
import type {
  Application,
  AssignedApplication,
  FormDefinition,
  FieldResponse,
} from '../models/app-application-intake.model.js';

export class AppApplicationIntakeRepository {
  /**
   * Find all applications assigned to a candidate
   */
  async findAssignedApplications(
    candidateId: string,
    tenantId: string
  ): Promise<AssignedApplication[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        a.id,
        a.candidate_id as "candidateId",
        a.tenant_id as "tenantId",
        a.form_definition_id as "formDefinitionId",
        a.title,
        a.description,
        a.status,
        a.due_date as "dueDate",
        a.submitted_at as "submittedAt",
        a.created_at as "createdAt",
        a.updated_at as "updatedAt",
        fd.title as "formTitle",
        COALESCE(ar.saved_at, NULL) as "lastSavedAt"
      FROM applications a
      LEFT JOIN form_definitions fd ON fd.id = a.form_definition_id
      LEFT JOIN (
        SELECT application_id, MAX(saved_at) as saved_at
        FROM application_responses
        GROUP BY application_id
      ) ar ON ar.application_id = a.id
      WHERE a.candidate_id = $1 AND a.tenant_id = $2
      ORDER BY 
        CASE WHEN a.status = 'pending' THEN 0
             WHEN a.status = 'in_progress' THEN 1
             ELSE 2 END,
        a.due_date ASC NULLS LAST`,
      [candidateId, tenantId]
    );

    return result.rows.map((row) => ({
      ...row,
      completionPercentage: 0, // Will be calculated based on responses
    }));
  }

  /**
   * Find an application by ID with ownership check
   */
  async findApplicationById(
    applicationId: string,
    candidateId: string
  ): Promise<Application | null> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        id,
        candidate_id as "candidateId",
        tenant_id as "tenantId",
        form_definition_id as "formDefinitionId",
        title,
        description,
        status,
        due_date as "dueDate",
        submitted_at as "submittedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM applications
      WHERE id = $1 AND candidate_id = $2`,
      [applicationId, candidateId]
    );

    return result.rows[0] || null;
  }

  /**
   * Find form definition by ID
   */
  async findFormDefinitionById(formDefinitionId: string): Promise<FormDefinition | null> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        id,
        title,
        description,
        sections,
        version,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM form_definitions
      WHERE id = $1`,
      [formDefinitionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      sections: typeof row.sections === 'string' ? JSON.parse(row.sections) : row.sections,
    };
  }

  /**
   * Find saved responses for an application
   */
  async findSavedResponses(
    applicationId: string,
    candidateId: string
  ): Promise<FieldResponse[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT responses, saved_at as "savedAt"
      FROM application_responses
      WHERE application_id = $1 AND candidate_id = $2
      ORDER BY saved_at DESC
      LIMIT 1`,
      [applicationId, candidateId]
    );

    if (result.rows.length === 0) {
      return [];
    }

    const responses = result.rows[0].responses;
    return typeof responses === 'string' ? JSON.parse(responses) : responses;
  }

  /**
   * Save draft responses for an application
   */
  async saveDraftResponses(
    applicationId: string,
    candidateId: string,
    responses: { fieldId: string; value: unknown }[]
  ): Promise<{ savedAt: Date }> {
    const pool = getPool();
    const now = new Date();
    const fieldResponses: FieldResponse[] = responses.map((r) => ({
      fieldId: r.fieldId,
      value: r.value,
      updatedAt: now,
    }));

    // Upsert the draft response
    await pool.query(
      `INSERT INTO application_responses (id, application_id, candidate_id, responses, is_draft, saved_at)
      VALUES ($1, $2, $3, $4, true, $5)
      ON CONFLICT (application_id, candidate_id)
      DO UPDATE SET responses = $4, saved_at = $5, is_draft = true`,
      [uuidv4(), applicationId, candidateId, JSON.stringify(fieldResponses), now]
    );

    // Update application status to in_progress if it was pending
    await pool.query(
      `UPDATE applications 
      SET status = 'in_progress', updated_at = $1
      WHERE id = $2 AND status = 'pending'`,
      [now, applicationId]
    );

    return { savedAt: now };
  }

  /**
   * Submit final responses for an application
   * Uses transaction to ensure data consistency
   */
  async submitFinalResponses(
    applicationId: string,
    candidateId: string,
    responses: { fieldId: string; value: unknown }[]
  ): Promise<{ submittedAt: Date; confirmationNumber: string }> {
    const pool = getPool();
    const client = await pool.connect();
    const now = new Date();
    // Use full UUID for unpredictable confirmation number
    const confirmationNumber = `APP-${uuidv4().toUpperCase()}`;

    const fieldResponses: FieldResponse[] = responses.map((r) => ({
      fieldId: r.fieldId,
      value: r.value,
      updatedAt: now,
    }));

    try {
      await client.query('BEGIN');

      // Save final responses
      await client.query(
        `INSERT INTO application_responses (id, application_id, candidate_id, responses, is_draft, saved_at, submitted_at)
        VALUES ($1, $2, $3, $4, false, $5, $5)
        ON CONFLICT (application_id, candidate_id)
        DO UPDATE SET responses = $4, saved_at = $5, submitted_at = $5, is_draft = false`,
        [uuidv4(), applicationId, candidateId, JSON.stringify(fieldResponses), now]
      );

      // Update application status to submitted
      await client.query(
        `UPDATE applications 
        SET status = 'submitted', submitted_at = $1, updated_at = $1
        WHERE id = $2`,
        [now, applicationId]
      );

      await client.query('COMMIT');
      return { submittedAt: now, confirmationNumber };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get required fields from a form definition
   */
  async getRequiredFields(formDefinitionId: string): Promise<{ id: string; name: string }[]> {
    const formDef = await this.findFormDefinitionById(formDefinitionId);
    if (!formDef) {
      return [];
    }

    const requiredFields: { id: string; name: string }[] = [];
    for (const section of formDef.sections) {
      for (const field of section.fields) {
        if (field.required) {
          requiredFields.push({ id: field.id, name: field.name });
        }
      }
    }
    return requiredFields;
  }

  /**
   * Calculate completion percentage for an application
   */
  async calculateCompletionPercentage(
    applicationId: string,
    candidateId: string,
    formDefinitionId: string
  ): Promise<number> {
    const requiredFields = await this.getRequiredFields(formDefinitionId);
    if (requiredFields.length === 0) {
      return 100;
    }

    const savedResponses = await this.findSavedResponses(applicationId, candidateId);
    const answeredFieldIds = new Set(
      savedResponses
        .filter((r) => r.value !== null && r.value !== undefined && r.value !== '')
        .map((r) => r.fieldId)
    );

    const completedCount = requiredFields.filter((f) => answeredFieldIds.has(f.id)).length;
    return Math.round((completedCount / requiredFields.length) * 100);
  }
}

export const appApplicationIntakeRepository = new AppApplicationIntakeRepository();
