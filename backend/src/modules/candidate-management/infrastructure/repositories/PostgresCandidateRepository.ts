/**
 * Postgres Candidate Repository
 * Infrastructure implementation of ICandidateRepository.
 */

import { query } from '../../../../shared/infrastructure/database/index.js';
import type { ICandidateRepository } from '../../domain/ports/candidate-repository.port.js';
import type {
  ManagedCandidate,
  CreateCandidateInput,
  UpdateCandidateInput,
  CandidateSearchParams,
  CandidateListResult,
  CandidateStatus,
} from '../../domain/entities/candidate.entity.js';

type CandidateRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  status: CandidateStatus;
  tenant_id: string;
  application_date: Date;
  certified_at: Date | null;
  certified_by: string | null;
  archived_at: Date | null;
  archived_by: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
};

function rowToCandidate(row: CandidateRow): ManagedCandidate {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone ?? undefined,
    status: row.status,
    tenantId: row.tenant_id,
    applicationDate: row.application_date,
    certifiedAt: row.certified_at ?? undefined,
    certifiedBy: row.certified_by ?? undefined,
    archivedAt: row.archived_at ?? undefined,
    archivedBy: row.archived_by ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
  };
}

export class PostgresCandidateRepository implements ICandidateRepository {
  async create(input: CreateCandidateInput & { id: string; createdBy?: string }): Promise<ManagedCandidate> {
    const now = new Date();
    const result = await query<CandidateRow>(
      `INSERT INTO candidates 
       (id, email, first_name, last_name, phone, status, tenant_id, application_date, metadata, created_at, updated_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        input.id,
        input.email.toLowerCase(),
        input.firstName,
        input.lastName,
        input.phone ?? null,
        input.status ?? 'pending',
        input.tenantId,
        now,
        input.metadata ? JSON.stringify(input.metadata) : null,
        now,
        now,
        input.createdBy ?? null,
      ],
    );

    return rowToCandidate(result.rows[0]);
  }

  async bulkCreate(
    candidates: Array<CreateCandidateInput & { id: string; createdBy?: string }>,
  ): Promise<ManagedCandidate[]> {
    if (candidates.length === 0) return [];

    const now = new Date();
    const values: unknown[] = [];
    const placeholders: string[] = [];

    candidates.forEach((c, idx) => {
      const offset = idx * 12;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12})`,
      );
      values.push(
        c.id,
        c.email.toLowerCase(),
        c.firstName,
        c.lastName,
        c.phone ?? null,
        c.status ?? 'pending',
        c.tenantId,
        now,
        c.metadata ? JSON.stringify(c.metadata) : null,
        now,
        now,
        c.createdBy ?? null,
      );
    });

    const result = await query<CandidateRow>(
      `INSERT INTO candidates 
       (id, email, first_name, last_name, phone, status, tenant_id, application_date, metadata, created_at, updated_at, created_by)
       VALUES ${placeholders.join(', ')}
       RETURNING *`,
      values,
    );

    return result.rows.map(rowToCandidate);
  }

  async findById(id: string, tenantId: string): Promise<ManagedCandidate | undefined> {
    const result = await query<CandidateRow>(
      'SELECT * FROM candidates WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
    return result.rows[0] ? rowToCandidate(result.rows[0]) : undefined;
  }

  async findByEmail(email: string, tenantId: string): Promise<ManagedCandidate | undefined> {
    const result = await query<CandidateRow>(
      'SELECT * FROM candidates WHERE LOWER(email) = LOWER($1) AND tenant_id = $2',
      [email, tenantId],
    );
    return result.rows[0] ? rowToCandidate(result.rows[0]) : undefined;
  }

  async emailExists(email: string, tenantId: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM candidates WHERE LOWER(email) = LOWER($1) AND tenant_id = $2) as exists',
      [email, tenantId],
    );
    return result.rows[0]?.exists ?? false;
  }

  async update(
    id: string,
    tenantId: string,
    input: UpdateCandidateInput & { updatedBy?: string },
  ): Promise<ManagedCandidate | undefined> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.firstName !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(input.firstName);
    }
    if (input.lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(input.lastName);
    }
    if (input.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(input.phone);
    }
    if (input.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(input.status);
    }
    if (input.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(input.metadata));
    }

    updates.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    if (input.updatedBy !== undefined) {
      updates.push(`updated_by = $${paramIndex++}`);
      values.push(input.updatedBy);
    }

    values.push(id, tenantId);

    const result = await query<CandidateRow>(
      `UPDATE candidates SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}
       RETURNING *`,
      values,
    );

    return result.rows[0] ? rowToCandidate(result.rows[0]) : undefined;
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: CandidateStatus,
    updatedBy?: string,
  ): Promise<ManagedCandidate | undefined> {
    if (status === 'certified') {
      return this.certify(id, tenantId, updatedBy);
    }
    if (status === 'archived') {
      return this.archive(id, tenantId, updatedBy);
    }

    return this.update(id, tenantId, { status, updatedBy });
  }

  async search(params: CandidateSearchParams): Promise<CandidateListResult> {
    const {
      tenantId,
      query: searchQuery,
      status,
      certified,
      archived,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const conditions: string[] = ['tenant_id = $1'];
    const values: unknown[] = [tenantId];
    let paramIndex = 2;

    if (searchQuery) {
      conditions.push(
        `(LOWER(email) LIKE $${paramIndex} OR LOWER(first_name) LIKE $${paramIndex} OR LOWER(last_name) LIKE $${paramIndex})`,
      );
      values.push(`%${searchQuery.toLowerCase()}%`);
      paramIndex++;
    }

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (certified === true) {
      conditions.push(`status = 'certified'`);
    } else if (certified === false) {
      conditions.push(`status != 'certified'`);
    }

    if (archived === true) {
      conditions.push(`status = 'archived'`);
    } else if (archived === false) {
      conditions.push(`status != 'archived'`);
    }

    const whereClause = conditions.join(' AND ');

    const sortColumnMap: Record<string, string> = {
      email: 'email',
      firstName: 'first_name',
      lastName: 'last_name',
      applicationDate: 'application_date',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    };
    const sortColumn = sortColumnMap[sortBy] || 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM candidates WHERE ${whereClause}`,
      values,
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query<CandidateRow>(
      `SELECT * FROM candidates 
       WHERE ${whereClause}
       ORDER BY ${sortColumn} ${order}
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      values,
    );

    return {
      candidates: result.rows.map(rowToCandidate),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM candidates WHERE id = $1 AND tenant_id = $2',
      [id, tenantId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async tenantExists(tenantId: string): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM organizations WHERE id = $1) as exists',
      [tenantId],
    );
    return result.rows[0]?.exists ?? false;
  }

  private async certify(id: string, tenantId: string, certifiedBy?: string): Promise<ManagedCandidate | undefined> {
    const now = new Date();
    const result = await query<CandidateRow>(
      `UPDATE candidates SET 
        status = 'certified', 
        certified_at = $1, 
        certified_by = $2, 
        updated_at = $3, 
        updated_by = $4
       WHERE id = $5 AND tenant_id = $6
       RETURNING *`,
      [now, certifiedBy ?? null, now, certifiedBy ?? null, id, tenantId],
    );
    return result.rows[0] ? rowToCandidate(result.rows[0]) : undefined;
  }

  private async archive(id: string, tenantId: string, archivedBy?: string): Promise<ManagedCandidate | undefined> {
    const now = new Date();
    const result = await query<CandidateRow>(
      `UPDATE candidates SET 
        status = 'archived', 
        archived_at = $1, 
        archived_by = $2, 
        updated_at = $3, 
        updated_by = $4
       WHERE id = $5 AND tenant_id = $6
       RETURNING *`,
      [now, archivedBy ?? null, now, archivedBy ?? null, id, tenantId],
    );
    return result.rows[0] ? rowToCandidate(result.rows[0]) : undefined;
  }
}
