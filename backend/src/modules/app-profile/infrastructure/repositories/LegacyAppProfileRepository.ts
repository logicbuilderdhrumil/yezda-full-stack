/**
 * Legacy App Profile Repository Adapter
 * Directly wraps SQL queries from legacy controller into repository pattern
 */

import type { IAppProfileRepository } from '../../domain/ports/IAppProfileRepository.js';
import type { CandidateProfile, ProfileUpdateInput } from '../../domain/entities/app-profile.entity.js';
import { query } from '../../../../db/postgres.js';

interface CandidateProfileRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  status: string;
  tenant_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

function toProfile(row: CandidateProfileRow): CandidateProfile {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone ?? undefined,
    status: row.status,
    tenantId: row.tenant_id ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class LegacyAppProfileRepository implements IAppProfileRepository {
  async getProfile(candidateId: string): Promise<CandidateProfile | null> {
    const result = await query<CandidateProfileRow>(
      `SELECT id, email, first_name, last_name, phone, status, tenant_id, metadata, created_at, updated_at
       FROM candidates WHERE id = $1`,
      [candidateId]
    );

    return result.rows[0] ? toProfile(result.rows[0]) : null;
  }

  async updateProfile(candidateId: string, input: ProfileUpdateInput): Promise<CandidateProfile | null> {
    const result = await query<CandidateProfileRow>(
      `UPDATE candidates
       SET first_name = COALESCE($2, first_name),
           last_name  = COALESCE($3, last_name),
           phone      = COALESCE($4, phone),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, first_name, last_name, phone, status, tenant_id, metadata, created_at, updated_at`,
      [candidateId, input.firstName ?? null, input.lastName ?? null, input.phone ?? null]
    );

    return result.rows[0] ? toProfile(result.rows[0]) : null;
  }
}
