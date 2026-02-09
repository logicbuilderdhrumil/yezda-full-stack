/**
 * PostgresMfaEnrollmentRepository
 * Postgres persistence for TOTP enrollment — implements IMfaEnrollmentRepository
 */
import { query } from '../../../../shared/infrastructure/database/postgres.js';
import type { MfaEnrollment } from '../../domain/entities/MfaEnrollment.js';
import type { IMfaEnrollmentRepository } from '../../domain/ports/IMfaEnrollmentRepository.js';

type MfaEnrollmentRow = {
  id: string;
  user_id: string;
  user_type: 'user' | 'candidate';
  secret: string;
  verified: boolean;
  created_at: Date;
  verified_at: Date | null;
};

function rowToEnrollment(row: MfaEnrollmentRow): MfaEnrollment {
  return {
    id: row.id,
    userId: row.user_id,
    userType: row.user_type,
    secret: row.secret,
    verified: row.verified,
    createdAt: row.created_at,
    verifiedAt: row.verified_at ?? undefined,
  };
}

export class PostgresMfaEnrollmentRepository implements IMfaEnrollmentRepository {
  async create(enrollment: MfaEnrollment): Promise<void> {
    await query(
      `INSERT INTO mfa_enrollments (id, user_id, user_type, secret, verified, created_at, verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        enrollment.id,
        enrollment.userId,
        enrollment.userType,
        enrollment.secret,
        enrollment.verified,
        enrollment.createdAt,
        enrollment.verifiedAt ?? null,
      ],
    );
  }

  async findById(id: string): Promise<MfaEnrollment | undefined> {
    const result = await query<MfaEnrollmentRow>(
      'SELECT * FROM mfa_enrollments WHERE id = $1',
      [id],
    );
    return result.rows[0] ? rowToEnrollment(result.rows[0]) : undefined;
  }

  async findPendingByUser(
    userId: string,
    userType: 'user' | 'candidate',
  ): Promise<MfaEnrollment | undefined> {
    const result = await query<MfaEnrollmentRow>(
      `SELECT * FROM mfa_enrollments
       WHERE user_id = $1 AND user_type = $2 AND verified = FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [userId, userType],
    );
    return result.rows[0] ? rowToEnrollment(result.rows[0]) : undefined;
  }

  async markVerified(id: string): Promise<void> {
    await query(
      'UPDATE mfa_enrollments SET verified = TRUE, verified_at = NOW() WHERE id = $1',
      [id],
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM mfa_enrollments WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async cleanupUnverified(): Promise<number> {
    // Delete unverified enrollments older than 1 hour
    const result = await query(
      `DELETE FROM mfa_enrollments
       WHERE verified = FALSE AND created_at < NOW() - INTERVAL '1 hour'`,
    );
    return result.rowCount ?? 0;
  }
}
