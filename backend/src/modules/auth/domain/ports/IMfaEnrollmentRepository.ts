/**
 * MFA enrollment repository port — defines persistence contract for TOTP enrollments
 */
import type { MfaEnrollment } from '../entities/MfaEnrollment.js';

export interface IMfaEnrollmentRepository {
  create(enrollment: MfaEnrollment): Promise<void>;
  findById(id: string): Promise<MfaEnrollment | undefined>;
  findPendingByUser(userId: string, userType: 'user' | 'candidate'): Promise<MfaEnrollment | undefined>;
  markVerified(id: string): Promise<void>;
  delete(id: string): Promise<boolean>;
  cleanupUnverified(): Promise<number>;
}
