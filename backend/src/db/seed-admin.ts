/**
 * Seed default admin user for local/dev environments.
 */

import { v4 as uuidv4 } from 'uuid';
import { userRepository } from '../repositories/user.repository.js';
import { userManagementRepository } from '../repositories/user-management.repository.js';
import { passwordService } from '../services/password.service.js';
import { closePool } from './postgres.js';
import type { UserRole } from '../middleware/route-guards.middleware.js';

const adminEmail = process.env.ADMIN_SEED_EMAIL ?? 'admin@yezda.com';
const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? 'DataWyse26!';
const adminTenantId = process.env.ADMIN_SEED_TENANT_ID ?? 'tenant-1';
const adminDisplayName = process.env.ADMIN_SEED_DISPLAY_NAME ?? 'Yezda Admin';

async function seedAdmin(): Promise<void> {
  const passwordHash = await passwordService.hash(adminPassword);
  const now = new Date();

  // Check if admin exists in users table (auth)
  const existsInUsers = await userRepository.emailExistsForUser(adminEmail);
  let adminId: string;

  if (existsInUsers) {
    console.info(`[seed-admin] Admin user already exists in users table for ${adminEmail}.`);
    // Need to get existing user ID for managed_users upsert
    const existingUser = await userRepository.findUserByEmail(adminEmail);
    adminId = existingUser?.id ?? uuidv4();
  } else {
    adminId = uuidv4();
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
    console.info(`[seed-admin] Created admin user ${adminEmail} (${adminId}).`);
  }

  // Upsert admin role in managed_users
  const existingManaged = await userManagementRepository.findByEmail(adminEmail, adminTenantId);
  if (!existingManaged) {
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
  } else if (!existingManaged.roles.includes('admin')) {
    // Ensure admin role is present
    const updatedRoles: UserRole[] = [...existingManaged.roles, 'admin'];
    await userManagementRepository.updateRoles(existingManaged.id, adminTenantId, updatedRoles);
    console.info(`[seed-admin] Added 'admin' role to existing user ${adminEmail}.`);
  } else {
    console.info(`[seed-admin] User ${adminEmail} already has 'admin' role.`);
  }
}

seedAdmin()
  .catch((error) => {
    console.error('[seed-admin] Failed to seed admin user:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
