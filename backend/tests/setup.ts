/**
 * Test Setup
 * Mocks database connections for unit tests
 */

import { vi, beforeAll, beforeEach, afterAll } from 'vitest';

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

// In-memory stores for mocking repositories
const users = new Map<string, unknown>();
const candidates = new Map<string, unknown>();
const sessions = new Map<string, unknown>();
const passwordResetTokens = new Map<string, unknown>();
const mfaEnrollments = new Map<string, unknown>();
const auditLogs: unknown[] = [];

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

// Clear all stores before each test
beforeEach(() => {
  vi.clearAllMocks();
  users.clear();
  candidates.clear();
  sessions.clear();
  passwordResetTokens.clear();
  mfaEnrollments.clear();
  auditLogs.length = 0;
});

export { users, candidates, sessions, passwordResetTokens, mfaEnrollments, auditLogs };
