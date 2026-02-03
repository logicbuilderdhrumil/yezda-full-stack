/**
 * Test Setup
 * Mocks database connections for unit tests
 */

import { vi, beforeAll, beforeEach, afterAll } from 'vitest';

// In-memory stores for mocking repositories
const users = new Map<string, unknown>();
const candidates = new Map<string, unknown>();
const sessions = new Map<string, unknown>();
const passwordResetTokens = new Map<string, unknown>();
const mfaEnrollments = new Map<string, unknown>();
const backupCodes = new Map<string, unknown>();
const stateStore = new Map<string, unknown>();
const themePreferences = new Map<string, unknown>();
const auditLogs: unknown[] = [];

// Mock Postgres module for transactions
vi.mock('../src/db/postgres.js', () => {
  // Create a mock client for transaction support
  const createMockClient = () => ({
    query: vi.fn(async (text: string, params?: unknown[]) => {
      // Handle transaction commands
      if (text === 'BEGIN' || text === 'COMMIT' || text === 'ROLLBACK') {
        return { rows: [], rowCount: 0 };
      }
      
      // Handle password update in transaction
      if (text.includes('UPDATE') && text.includes('password_hash')) {
        const userId = params?.[1] as string;
        const passwordHash = params?.[0] as string;
        const isUser = text.includes('UPDATE users');
        const store = isUser ? users : candidates;
        const entity = store.get(userId) as Record<string, unknown> | undefined;
        if (entity) {
          entity.passwordHash = passwordHash;
          entity.updatedAt = new Date();
          entity.failedAttempts = 0;
          entity.lockedUntil = undefined;
        }
        return { rows: [], rowCount: 1 };
      }
      
      // Handle password reset token deletion
      if (text.includes('DELETE FROM password_reset_tokens')) {
        const id = params?.[0] as string;
        for (const [hash, token] of passwordResetTokens.entries()) {
          if ((token as { id: string }).id === id) {
            passwordResetTokens.delete(hash);
            break;
          }
        }
        return { rows: [], rowCount: 1 };
      }
      
      return { rows: [], rowCount: 0 };
    }),
    release: vi.fn(),
  });

  return {
    getPool: vi.fn(() => ({
      query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      connect: vi.fn().mockResolvedValue(createMockClient()),
      end: vi.fn().mockResolvedValue(undefined),
    })),
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    getClient: vi.fn().mockImplementation(async () => createMockClient()),
    closePool: vi.fn().mockResolvedValue(undefined),
    healthCheck: vi.fn().mockResolvedValue(true),
  };
});

// Mock Redis module
vi.mock('../src/db/redis.js', () => {
  const mfaSessions = new Map<string, { userId: string; userType: string; expiresAt: number }>();
  const cache = new Map<string, { value: unknown; expiresAt: number }>();
  const rateLimits = new Map<string, number[]>();

  return {
    getRedis: vi.fn(() => ({
      ping: vi.fn().mockResolvedValue('PONG'),
      quit: vi.fn().mockResolvedValue(undefined),
    })),
    closeRedis: vi.fn().mockResolvedValue(undefined),
    healthCheck: vi.fn().mockResolvedValue(true),
    
    checkRateLimit: vi.fn(async (key: string, limit: number, windowMs: number) => {
      const now = Date.now();
      const timestamps = rateLimits.get(key) || [];
      const validTimestamps = timestamps.filter(t => t > now - windowMs);
      validTimestamps.push(now);
      rateLimits.set(key, validTimestamps);
      
      const allowed = validTimestamps.length <= limit;
      return {
        allowed,
        remaining: Math.max(0, limit - validTimestamps.length),
        resetAt: now + windowMs,
      };
    }),
    
    clearRateLimit: vi.fn(async (key: string) => {
      rateLimits.delete(key);
    }),

    cacheGet: vi.fn(async <T>(key: string): Promise<T | null> => {
      const entry = cache.get(key);
      if (!entry || entry.expiresAt < Date.now()) {
        cache.delete(key);
        return null;
      }
      return entry.value as T;
    }),

    cacheSet: vi.fn(async (key: string, value: unknown, ttlMs: number) => {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
    }),

    cacheDel: vi.fn(async (key: string) => {
      cache.delete(key);
    }),

    storeMfaSession: vi.fn(async (token: string, session: { userId: string; userType: string; expiresAt: number }) => {
      mfaSessions.set(token, session);
    }),

    consumeMfaSession: vi.fn(async (token: string) => {
      const session = mfaSessions.get(token);
      if (session) {
        mfaSessions.delete(token);
      }
      return session || null;
    }),

    // Test helpers
    _clearAll: () => {
      mfaSessions.clear();
      cache.clear();
      rateLimits.clear();
    },
  };
});

// Mock User Repository
vi.mock('../src/repositories/user.repository.js', () => ({
  userRepository: {
    createUser: vi.fn(async (user: { id: string; email: string }) => {
      users.set(user.id, user);
    }),
    createCandidate: vi.fn(async (candidate: { id: string; email: string }) => {
      candidates.set(candidate.id, candidate);
    }),
    findUserById: vi.fn(async (id: string) => users.get(id)),
    findUserByEmail: vi.fn(async (email: string) => {
      for (const user of users.values()) {
        if ((user as { email: string }).email.toLowerCase() === email.toLowerCase()) {
          return user;
        }
      }
      return undefined;
    }),
    findCandidateById: vi.fn(async (id: string) => candidates.get(id)),
    findCandidateByEmail: vi.fn(async (email: string) => {
      for (const candidate of candidates.values()) {
        if ((candidate as { email: string }).email.toLowerCase() === email.toLowerCase()) {
          return candidate;
        }
      }
      return undefined;
    }),
    updateUser: vi.fn(async (user: { id: string }) => {
      users.set(user.id, user);
    }),
    updateCandidate: vi.fn(async (candidate: { id: string }) => {
      candidates.set(candidate.id, candidate);
    }),
    emailExistsForUser: vi.fn(async (email: string) => {
      for (const user of users.values()) {
        if ((user as { email: string }).email.toLowerCase() === email.toLowerCase()) {
          return true;
        }
      }
      return false;
    }),
    emailExistsForCandidate: vi.fn(async (email: string) => {
      for (const candidate of candidates.values()) {
        if ((candidate as { email: string }).email.toLowerCase() === email.toLowerCase()) {
          return true;
        }
      }
      return false;
    }),
    findEntityByEmail: vi.fn(async (email: string, userType: string) => {
      const store = userType === 'user' ? users : candidates;
      for (const entity of store.values()) {
        if ((entity as { email: string }).email.toLowerCase() === email.toLowerCase()) {
          return entity;
        }
      }
      return undefined;
    }),
    findEntityById: vi.fn(async (id: string, userType: string) => {
      return userType === 'user' ? users.get(id) : candidates.get(id);
    }),
    updateEntity: vi.fn(async (entity: { id: string }, userType: string) => {
      const store = userType === 'user' ? users : candidates;
      store.set(entity.id, entity);
    }),
    emailExists: vi.fn(async (email: string, userType: string) => {
      const store = userType === 'user' ? users : candidates;
      for (const entity of store.values()) {
        if ((entity as { email: string }).email.toLowerCase() === email.toLowerCase()) {
          return true;
        }
      }
      return false;
    }),
  },
  UserRepository: vi.fn(),
}));

// Mock Session Repository
vi.mock('../src/repositories/session.repository.js', () => ({
  sessionRepository: {
    create: vi.fn(async (session: { id: string }) => {
      sessions.set(session.id, session);
    }),
    findById: vi.fn(async (id: string) => sessions.get(id)),
    findByRefreshTokenHash: vi.fn(async (hash: string) => {
      for (const session of sessions.values()) {
        if ((session as { refreshTokenHash: string }).refreshTokenHash === hash) {
          return session;
        }
      }
      return undefined;
    }),
    findActiveByUser: vi.fn(async (userId: string, userType: string) => {
      const result: unknown[] = [];
      for (const session of sessions.values()) {
        const s = session as { userId: string; userType: string; revokedAt?: Date; expiresAt: Date };
        if (s.userId === userId && s.userType === userType && !s.revokedAt && s.expiresAt > new Date()) {
          result.push(session);
        }
      }
      return result;
    }),
    revoke: vi.fn(async (id: string) => {
      const session = sessions.get(id) as { revokedAt?: Date } | undefined;
      if (session) {
        session.revokedAt = new Date();
        return true;
      }
      return false;
    }),
    revokeAllForUser: vi.fn(async (userId: string, userType: string) => {
      let count = 0;
      for (const session of sessions.values()) {
        const s = session as { userId: string; userType: string; revokedAt?: Date };
        if (s.userId === userId && s.userType === userType && !s.revokedAt) {
          s.revokedAt = new Date();
          count++;
        }
      }
      return count;
    }),
    update: vi.fn(async (session: { id: string }) => {
      sessions.set(session.id, session);
    }),
    cleanupExpired: vi.fn(async () => 0),
  },
  SessionRepository: vi.fn(),
}));

// Mock Password Reset Repository
vi.mock('../src/repositories/password-reset.repository.js', () => ({
  passwordResetRepository: {
    create: vi.fn(async (token: { id: string; tokenHash: string }) => {
      passwordResetTokens.set(token.tokenHash, token);
    }),
    findByTokenHash: vi.fn(async (hash: string) => passwordResetTokens.get(hash)),
    markUsed: vi.fn(async (id: string) => {
      for (const token of passwordResetTokens.values()) {
        if ((token as { id: string }).id === id) {
          (token as { usedAt?: Date }).usedAt = new Date();
          break;
        }
      }
    }),
    delete: vi.fn(async (id: string) => {
      for (const [hash, token] of passwordResetTokens.entries()) {
        if ((token as { id: string }).id === id) {
          passwordResetTokens.delete(hash);
          break;
        }
      }
    }),
    deleteByTokenHash: vi.fn(async (hash: string) => {
      passwordResetTokens.delete(hash);
    }),
    cleanupExpired: vi.fn(async () => 0),
  },
  PasswordResetRepository: vi.fn(),
}));

// Mock MFA Enrollment Repository
vi.mock('../src/repositories/mfa-enrollment.repository.js', () => ({
  mfaEnrollmentRepository: {
    create: vi.fn(async (enrollment: { id: string }) => {
      mfaEnrollments.set(enrollment.id, enrollment);
    }),
    findById: vi.fn(async (id: string) => mfaEnrollments.get(id)),
    findPendingByUser: vi.fn(async (userId: string, userType: string) => {
      for (const enrollment of mfaEnrollments.values()) {
        const e = enrollment as { userId: string; userType: string; verified: boolean };
        if (e.userId === userId && e.userType === userType && !e.verified) {
          return enrollment;
        }
      }
      return undefined;
    }),
    markVerified: vi.fn(async (id: string) => {
      const enrollment = mfaEnrollments.get(id) as { verified: boolean; verifiedAt?: Date } | undefined;
      if (enrollment) {
        enrollment.verified = true;
        enrollment.verifiedAt = new Date();
      }
    }),
    delete: vi.fn(async (id: string) => {
      return mfaEnrollments.delete(id);
    }),
    cleanupUnverified: vi.fn(async () => 0),
  },
  MfaEnrollmentRepository: vi.fn(),
}));

// Mock Audit Log Repository
vi.mock('../src/repositories/audit-log.repository.js', () => ({
  auditLogRepository: {
    create: vi.fn(async (entry: unknown) => {
      auditLogs.push(entry);
    }),
    findByActor: vi.fn(async (actorId: string, limit = 100) => {
      return auditLogs
        .filter((e) => {
          const entry = e as { event: { actorId?: string; targetId?: string } };
          return entry.event.actorId === actorId || entry.event.targetId === actorId;
        })
        .slice(-limit);
    }),
    findRecent: vi.fn(async (limit = 100) => auditLogs.slice(-limit)),
    findByEventType: vi.fn(async () => []),
    countByEventType: vi.fn(async () => 0),
    cleanupOld: vi.fn(async () => 0),
  },
  AuditLogRepository: vi.fn(),
}));

// Mock Backup Code Repository
vi.mock('../src/repositories/backup-code.repository.js', () => ({
  backupCodeRepository: {
    createBatch: vi.fn(async (codes: { id: string; userId: string; userType: string; codeHash: string }[]) => {
      for (const code of codes) {
        backupCodes.set(code.id, code);
      }
    }),
    findUnusedByUser: vi.fn(async (userId: string, userType: string) => {
      const result: unknown[] = [];
      for (const code of backupCodes.values()) {
        const c = code as { userId: string; userType: string; usedAt?: Date };
        if (c.userId === userId && c.userType === userType && !c.usedAt) {
          result.push(code);
        }
      }
      return result;
    }),
    findUnusedByHash: vi.fn(async (userId: string, userType: string, codeHash: string) => {
      for (const code of backupCodes.values()) {
        const c = code as { userId: string; userType: string; codeHash: string; usedAt?: Date };
        if (c.userId === userId && c.userType === userType && c.codeHash === codeHash && !c.usedAt) {
          return code;
        }
      }
      return undefined;
    }),
    markUsed: vi.fn(async (id: string) => {
      const code = backupCodes.get(id) as { usedAt?: Date } | undefined;
      if (code) {
        code.usedAt = new Date();
      }
    }),
    deleteAllForUser: vi.fn(async (userId: string, userType: string) => {
      let count = 0;
      for (const [id, code] of backupCodes.entries()) {
        const c = code as { userId: string; userType: string };
        if (c.userId === userId && c.userType === userType) {
          backupCodes.delete(id);
          count++;
        }
      }
      return count;
    }),
    countUnused: vi.fn(async (userId: string, userType: string) => {
      let count = 0;
      for (const code of backupCodes.values()) {
        const c = code as { userId: string; userType: string; usedAt?: Date };
        if (c.userId === userId && c.userType === userType && !c.usedAt) {
          count++;
        }
      }
      return count;
    }),
  },
  BackupCodeRepository: vi.fn(),
}));

// Mock State Store Repository
vi.mock('../src/repositories/state-store.repository.js', () => ({
  stateStoreRepository: {
    upsert: vi.fn(async (entry: { tenantId: string; userId: string; userType: string; key: string; value: string; expiresAt?: Date }) => {
      const storeKey = `${entry.tenantId}:${entry.userId}:${entry.userType}:${entry.key}`;
      const now = new Date();
      const storedEntry = {
        id: `state-${Date.now()}`,
        ...entry,
        createdAt: now,
        updatedAt: now,
      };
      stateStore.set(storeKey, storedEntry);
      return storedEntry;
    }),
    findByKey: vi.fn(async (tenantId: string, userId: string, userType: string, key: string) => {
      const storeKey = `${tenantId}:${userId}:${userType}:${key}`;
      const entry = stateStore.get(storeKey) as { expiresAt?: Date } | undefined;
      if (entry && entry.expiresAt && entry.expiresAt < new Date()) {
        stateStore.delete(storeKey);
        return undefined;
      }
      return entry;
    }),
    findAllByUser: vi.fn(async (tenantId: string, userId: string, userType: string) => {
      const results: unknown[] = [];
      for (const [key, entry] of stateStore.entries()) {
        if (key.startsWith(`${tenantId}:${userId}:${userType}:`)) {
          const e = entry as { expiresAt?: Date };
          if (!e.expiresAt || e.expiresAt > new Date()) {
            results.push(entry);
          }
        }
      }
      return results;
    }),
    delete: vi.fn(async (tenantId: string, userId: string, userType: string, key: string) => {
      const storeKey = `${tenantId}:${userId}:${userType}:${key}`;
      return stateStore.delete(storeKey);
    }),
    deleteAllByUser: vi.fn(async (tenantId: string, userId: string, userType: string) => {
      let count = 0;
      for (const key of stateStore.keys()) {
        if (key.startsWith(`${tenantId}:${userId}:${userType}:`)) {
          stateStore.delete(key);
          count++;
        }
      }
      return count;
    }),
    cleanupExpired: vi.fn(async () => {
      let count = 0;
      const now = new Date();
      for (const [key, entry] of stateStore.entries()) {
        const e = entry as { expiresAt?: Date };
        if (e.expiresAt && e.expiresAt < now) {
          stateStore.delete(key);
          count++;
        }
      }
      return count;
    }),
    verifyTenantOwnership: vi.fn(async (entryId: string, tenantId: string) => {
      for (const entry of stateStore.values()) {
        const e = entry as { id: string; tenantId: string };
        if (e.id === entryId && e.tenantId === tenantId) {
          return true;
        }
      }
      return false;
    }),
  },
  StateStoreRepository: vi.fn(),
}));

// Mock Theme Repository
vi.mock('../src/repositories/theme.repository.js', () => ({
  themeRepository: {
    findByUser: vi.fn(async (tenantId: string, userId: string, userType: string) => {
      const key = `${tenantId}:${userId}:${userType}`;
      return themePreferences.get(key) ?? null;
    }),
    upsert: vi.fn(async (params: { tenantId: string; userId: string; userType: string; presetId: string; customTokens?: unknown }) => {
      const key = `${params.tenantId}:${params.userId}:${params.userType}`;
      const existing = themePreferences.get(key) as { id: string; createdAt: Date } | undefined;
      const now = new Date();
      const preference = {
        id: existing?.id ?? `theme-${Date.now()}`,
        tenantId: params.tenantId,
        userId: params.userId,
        userType: params.userType,
        presetId: params.presetId,
        customTokens: params.customTokens,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      themePreferences.set(key, preference);
      return preference;
    }),
    delete: vi.fn(async (tenantId: string, userId: string, userType: string) => {
      const key = `${tenantId}:${userId}:${userType}`;
      return themePreferences.delete(key);
    }),
    findByTenant: vi.fn(async (tenantId: string) => {
      const results: unknown[] = [];
      for (const pref of themePreferences.values()) {
        const p = pref as { tenantId: string };
        if (p.tenantId === tenantId) {
          results.push(pref);
        }
      }
      return results;
    }),
    clear: vi.fn(async () => {
      themePreferences.clear();
    }),
  },
  ThemeRepository: vi.fn(),
}));

// Clear all stores before each test
beforeEach(() => {
  vi.clearAllMocks();
  users.clear();
  candidates.clear();
  sessions.clear();
  passwordResetTokens.clear();
  mfaEnrollments.clear();
  backupCodes.clear();
  stateStore.clear();
  themePreferences.clear();
  auditLogs.length = 0;
});

export { users, candidates, sessions, passwordResetTokens, mfaEnrollments, backupCodes, stateStore, themePreferences, auditLogs };
