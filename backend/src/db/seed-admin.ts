/**
 * Seed default admin user for local/dev environments.
 */

import { v4 as uuidv4 } from 'uuid';
import { userRepository } from '../repositories/user.repository.js';
import { userManagementRepository } from '../repositories/user-management.repository.js';
import { passwordService } from '../services/password.service.js';
import { closePool } from './postgres.js';

const adminEmail = process.env.ADMIN_SEED_EMAIL ?? 'admin@yezda.com';
const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? 'DataWyse26!';
const adminTenantId = process.env.ADMIN_SEED_TENANT_ID ?? 'tenant-1';
const adminDisplayName = process.env.ADMIN_SEED_DISPLAY_NAME ?? 'Yezda Admin';

async function seedAdmin(): Promise<void> {
  // Check if admin exists in users table (auth)
  const existsInUsers = await userRepository.emailExistsForUser(adminEmail);
  if (existsInUsers) {
    console.info(`[seed-admin] Admin user already exists in users table for ${adminEmail}.`);
    return;
  }

  const passwordHash = await passwordService.hash(adminPassword);
  const adminId = uuidv4();
  const now = new Date();

  // Insert into users table for auth to work
  await userRepository.createUser({
    id: adminId,
    email: adminEmail.toLowerCase(),
    passwordHash,
    mfaEnabled: false,
    failedAttempts: 0,
    createdAt: now,
    updatedAt: now,
  });

  // Also insert into managed_users for user management features
  const existsInManaged = await userManagementRepository.emailExists(adminEmail, adminTenantId);
  if (!existsInManaged) {
    await userManagementRepository.create({
      id: adminId,
      email: adminEmail,
      tenantId: adminTenantId,
      roles: ['admin'],
      status: 'active',
      displayName: adminDisplayName,
      createdBy: undefined,
      passwordHash,
    });
    console.info(`[seed-admin] Created admin in managed_users ${adminEmail}.`);
  }

  console.info(`[seed-admin] Created admin user ${adminEmail} (${adminId}).`);
}

seedAdmin()
  .catch((error) => {
    console.error('[seed-admin] Failed to seed admin user:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
