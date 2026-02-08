/**
 * App Profile Controller
 * HTTP handlers for candidate profile endpoints (mobile app)
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { query } from '../db/postgres.js';

/** Row shape returned by SELECT on candidates table */
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

/**
 * GET /api/v1/app/profile
 * Return authenticated candidate's profile
 */
export async function getProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user || req.user.type !== 'candidate') {
    res.status(403).json({ error: 'Candidate access required', code: 'FORBIDDEN' });
    return;
  }

  const result = await query<CandidateProfileRow>(
    `SELECT id, email, first_name, last_name, phone, status, tenant_id, metadata, created_at, updated_at
     FROM candidates WHERE id = $1`,
    [req.user.sub]
  );

  if (!result.rows[0]) {
    res.status(404).json({ error: 'Profile not found', code: 'NOT_FOUND' });
    return;
  }

  const row = result.rows[0];

  res.status(200).json({
    profile: {
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
    },
  });
}

/**
 * PUT /api/v1/app/profile
 * Update authenticated candidate's profile (limited fields)
 */
export async function updateProfile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user || req.user.type !== 'candidate') {
    res.status(403).json({ error: 'Candidate access required', code: 'FORBIDDEN' });
    return;
  }

  const { firstName, lastName, phone } = req.body;

  const result = await query<CandidateProfileRow>(
    `UPDATE candidates
     SET first_name = COALESCE($2, first_name),
         last_name  = COALESCE($3, last_name),
         phone      = COALESCE($4, phone),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, email, first_name, last_name, phone, status, tenant_id, metadata, created_at, updated_at`,
    [req.user.sub, firstName ?? null, lastName ?? null, phone ?? null]
  );

  if (!result.rows[0]) {
    res.status(404).json({ error: 'Profile not found', code: 'NOT_FOUND' });
    return;
  }

  const row = result.rows[0];

  res.status(200).json({
    profile: {
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
    },
  });
}
