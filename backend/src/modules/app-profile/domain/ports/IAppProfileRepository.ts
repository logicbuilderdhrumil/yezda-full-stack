/**
 * App Profile Repository Port
 */

import type { CandidateProfile, ProfileUpdateInput } from '../entities/app-profile.entity.js';

export interface IAppProfileRepository {
  getProfile(candidateId: string): Promise<CandidateProfile | null>;
  updateProfile(candidateId: string, input: ProfileUpdateInput): Promise<CandidateProfile | null>;
}
