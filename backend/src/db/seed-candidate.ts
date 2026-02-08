/**
 * Seed default candidate user for local/dev environments.
 * Used for testing the Expo mobile/web app authentication.
 */

import { v4 as uuidv4 } from 'uuid';
import { userRepository } from '../repositories/user.repository.js';
import { passwordService } from '../services/password.service.js';
import { closePool } from './postgres.js';

const candidateEmail = process.env.CANDIDATE_SEED_EMAIL ?? 'candidate@yezda.com';
const candidatePassword = process.env.CANDIDATE_SEED_PASSWORD ?? 'DataWyse26!';

async function seedCandidate(): Promise<void> {
  const passwordHash = await passwordService.hash(candidatePassword);
  const now = new Date();

  // Check if candidate exists
  const exists = await userRepository.emailExistsForCandidate(candidateEmail);

  if (exists) {
    console.info(`[seed-candidate] Candidate already exists: ${candidateEmail}.`);
    return;
  }

  const candidateId = uuidv4();
  await userRepository.createCandidate({
    id: candidateId,
    email: candidateEmail.toLowerCase(),
    passwordHash,
    mfaEnabled: false,
    failedAttempts: 0,
    tenantId: process.env.ADMIN_SEED_TENANT_ID ?? '00000000-0000-0000-0000-000000000001',
    createdAt: now,
    updatedAt: now,
  });

  console.info(`[seed-candidate] Created candidate ${candidateEmail} (${candidateId}).`);
}

seedCandidate()
  .catch((error) => {
    console.error('[seed-candidate] Failed to seed candidate:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
