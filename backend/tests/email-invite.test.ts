/**
 * Email Invite Module Tests
 *
 * Tests for:
 * - InviteToken entity (domain)
 * - SendOrgMemberInviteUseCase (application)
 * - SendCandidateInviteUseCase (application)
 * - VerifyInviteTokenUseCase (application)
 * - AcceptInviteUseCase (application)
 * - NoOpEmailAdapter (infrastructure)
 * - PostmarkEmailAdapter (infrastructure, mocked)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'node:crypto';

import { InviteToken } from '../src/modules/email/domain/entities/InviteToken.js';
import type { EmailPort } from '../src/modules/email/domain/ports/EmailPort.js';
import type { IInviteTokenRepository } from '../src/modules/email/domain/ports/InviteTokenRepository.port.js';
import type { InviteTokenRecord, InviteContext, InviteTokenMetadata } from '../src/modules/email/domain/types/email-types.js';

import { SendOrgMemberInviteUseCase } from '../src/modules/email/application/use-cases/SendOrgMemberInviteUseCase.js';
import { SendCandidateInviteUseCase } from '../src/modules/email/application/use-cases/SendCandidateInviteUseCase.js';
import { VerifyInviteTokenUseCase } from '../src/modules/email/application/use-cases/VerifyInviteTokenUseCase.js';
import { AcceptInviteUseCase } from '../src/modules/email/application/use-cases/AcceptInviteUseCase.js';

import { NoOpEmailAdapter } from '../src/modules/email/infrastructure/adapters/NoOpEmailAdapter.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

function createMockEmailPort(): EmailPort {
  return {
    sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-1' }),
    sendEmailWithTemplate: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-2' }),
  };
}

function createMockTokenRepo(): IInviteTokenRepository {
  return {
    create: vi.fn().mockResolvedValue(undefined),
    findByHash: vi.fn().mockResolvedValue(null),
    markConsumed: vi.fn().mockResolvedValue(undefined),
    findPendingByEmail: vi.fn().mockResolvedValue([]),
    countRecentByEmail: vi.fn().mockResolvedValue(0),
    revokeByEmail: vi.fn().mockResolvedValue(0),
  };
}

function createTestContext(overrides: Partial<InviteContext> = {}): InviteContext {
  return {
    actorId: 'user-123',
    actorType: 'user',
    tenantId: 'tenant-abc',
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    ...overrides,
  };
}

function makePendingRecord(overrides: Partial<InviteTokenRecord> = {}): InviteTokenRecord {
  const tokenPlaintext = 'a'.repeat(64);
  const hash = createHash('sha256').update(tokenPlaintext).digest('hex');
  return {
    id: 'invite-1',
    tokenHash: hash,
    type: 'org_member_invite',
    email: 'invitee@example.com',
    tenantId: 'tenant-abc',
    invitedByUserId: 'user-123',
    metadata: { orgName: 'Acme', role: 'agent', inviterName: 'Jane' },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    consumedAt: null,
    status: 'pending',
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// InviteToken Entity
// ═══════════════════════════════════════════════════════════════════════════════

describe('InviteToken Entity', () => {
  it('creates a token with hashed value and plaintext for delivery', () => {
    const { entity, plaintextToken } = InviteToken.create({
      type: 'org_member_invite',
      email: 'test@example.com',
      tenantId: 'tenant-1',
      invitedByUserId: 'user-1',
      metadata: { orgName: 'Acme', inviterName: 'Jane' },
    });

    expect(entity.id).toBeDefined();
    expect(entity.type).toBe('org_member_invite');
    expect(entity.email).toBe('test@example.com');
    expect(entity.status).toBe('pending');
    expect(entity.isValid()).toBe(true);
    expect(plaintextToken).toHaveLength(64);

    // Verify hash matches
    const expectedHash = createHash('sha256').update(plaintextToken).digest('hex');
    expect(entity.tokenHash).toBe(expectedHash);
  });

  it('lowercases and trims email', () => {
    const { entity } = InviteToken.create({
      type: 'candidate_invite',
      email: '  Test@Example.COM  ',
      tenantId: 'tenant-1',
      invitedByUserId: 'user-1',
      metadata: { orgName: 'Acme', inviterName: 'Bob' },
    });

    expect(entity.email).toBe('test@example.com');
  });

  it('defaults org_member_invite to 7 days expiry', () => {
    const { entity } = InviteToken.create({
      type: 'org_member_invite',
      email: 'test@example.com',
      tenantId: 'tenant-1',
      invitedByUserId: 'user-1',
      metadata: {},
    });

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const diff = entity.expiresAt.getTime() - entity.createdAt.getTime();
    // Allow small tolerance (100ms) for test execution time
    expect(diff).toBeGreaterThanOrEqual(sevenDaysMs - 100);
    expect(diff).toBeLessThanOrEqual(sevenDaysMs + 100);
  });

  it('defaults candidate_invite to 14 days expiry', () => {
    const { entity } = InviteToken.create({
      type: 'candidate_invite',
      email: 'test@example.com',
      tenantId: 'tenant-1',
      invitedByUserId: 'user-1',
      metadata: {},
    });

    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    const diff = entity.expiresAt.getTime() - entity.createdAt.getTime();
    expect(diff).toBeGreaterThanOrEqual(fourteenDaysMs - 100);
    expect(diff).toBeLessThanOrEqual(fourteenDaysMs + 100);
  });

  it('supports custom expiry days', () => {
    const { entity } = InviteToken.create({
      type: 'org_member_invite',
      email: 'test@example.com',
      tenantId: 'tenant-1',
      invitedByUserId: 'user-1',
      metadata: {},
      expiresInDays: 30,
    });

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const diff = entity.expiresAt.getTime() - entity.createdAt.getTime();
    expect(diff).toBeGreaterThanOrEqual(thirtyDaysMs - 100);
    expect(diff).toBeLessThanOrEqual(thirtyDaysMs + 100);
  });

  it('consume() marks the token and changes status', () => {
    const { entity } = InviteToken.create({
      type: 'org_member_invite',
      email: 'test@example.com',
      tenantId: 'tenant-1',
      invitedByUserId: 'user-1',
      metadata: {},
    });

    expect(entity.isConsumed()).toBe(false);
    entity.consume();
    expect(entity.isConsumed()).toBe(true);
    expect(entity.status).toBe('consumed');
    expect(entity.consumedAt).toBeInstanceOf(Date);
  });

  it('consume() throws if already consumed', () => {
    const { entity } = InviteToken.create({
      type: 'org_member_invite',
      email: 'test@example.com',
      tenantId: 'tenant-1',
      invitedByUserId: 'user-1',
      metadata: {},
    });

    entity.consume();
    expect(() => entity.consume()).toThrow('already been consumed');
  });

  it('consume() throws if expired', () => {
    const record = makePendingRecord({
      expiresAt: new Date(Date.now() - 1000), // expired
    });
    const entity = InviteToken.fromRecord(record);
    expect(() => entity.consume()).toThrow('expired');
  });

  it('isExpired() returns true when past expiry date', () => {
    const record = makePendingRecord({
      expiresAt: new Date(Date.now() - 1000),
    });
    const entity = InviteToken.fromRecord(record);
    expect(entity.isExpired()).toBe(true);
  });

  it('status returns expired when pending but past expiry', () => {
    const record = makePendingRecord({
      expiresAt: new Date(Date.now() - 1000),
    });
    const entity = InviteToken.fromRecord(record);
    expect(entity.status).toBe('expired');
  });

  it('isValid() returns false once consumed', () => {
    const { entity } = InviteToken.create({
      type: 'org_member_invite',
      email: 'test@example.com',
      tenantId: 'tenant-1',
      invitedByUserId: 'user-1',
      metadata: {},
    });

    entity.consume();
    expect(entity.isValid()).toBe(false);
  });

  it('toData() returns persistence-ready object', () => {
    const { entity } = InviteToken.create({
      type: 'org_member_invite',
      email: 'test@example.com',
      tenantId: 'tenant-1',
      invitedByUserId: 'user-1',
      metadata: { orgName: 'Acme' },
    });

    const data = entity.toData();
    expect(data).toEqual({
      id: entity.id,
      tokenHash: entity.tokenHash,
      type: 'org_member_invite',
      email: 'test@example.com',
      tenantId: 'tenant-1',
      invitedByUserId: 'user-1',
      metadata: { orgName: 'Acme' },
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
    });
  });

  it('fromRecord() reconstructs entity from persistence data', () => {
    const record = makePendingRecord();
    const entity = InviteToken.fromRecord(record);
    expect(entity.id).toBe(record.id);
    expect(entity.tokenHash).toBe(record.tokenHash);
    expect(entity.type).toBe(record.type);
    expect(entity.email).toBe(record.email);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SendOrgMemberInviteUseCase
// ═══════════════════════════════════════════════════════════════════════════════

describe('SendOrgMemberInviteUseCase', () => {
  let emailPort: ReturnType<typeof createMockEmailPort>;
  let tokenRepo: ReturnType<typeof createMockTokenRepo>;
  let useCase: SendOrgMemberInviteUseCase;

  beforeEach(() => {
    emailPort = createMockEmailPort();
    tokenRepo = createMockTokenRepo();
    useCase = new SendOrgMemberInviteUseCase(emailPort, tokenRepo, 'http://localhost:5173/invite');
  });

  it('sends an org member invite email successfully', async () => {
    const ctx = createTestContext();
    const result = await useCase.execute(ctx, {
      email: 'bob@example.com',
      role: 'agent',
      orgName: 'Acme Corp',
      inviterName: 'Jane Doe',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.tokenPlaintext).toHaveLength(64);
      expect(result.expiresAt).toBeInstanceOf(Date);
    }

    // Verify repo calls
    expect(tokenRepo.countRecentByEmail).toHaveBeenCalledWith('bob@example.com', expect.any(Date));
    expect(tokenRepo.revokeByEmail).toHaveBeenCalledWith('bob@example.com', 'org_member_invite', 'tenant-abc');
    expect(tokenRepo.create).toHaveBeenCalledTimes(1);

    // Verify email sent
    expect(emailPort.sendEmailWithTemplate).toHaveBeenCalledWith(
      'bob@example.com',
      'org-member-invite',
      expect.objectContaining({
        inviterName: 'Jane Doe',
        orgName: 'Acme Corp',
        role: 'agent',
        inviteLink: expect.stringContaining('http://localhost:5173/invite?token='),
        expiryDays: 7,
      }),
      expect.objectContaining({ tag: 'org-member-invite' }),
    );
  });

  it('rate-limits invites (max 3 per hour)', async () => {
    (tokenRepo.countRecentByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(3);

    const ctx = createTestContext();
    const result = await useCase.execute(ctx, {
      email: 'bob@example.com',
      role: 'agent',
      orgName: 'Acme',
      inviterName: 'Jane',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe('INVITE_RATE_LIMITED');
    }

    expect(tokenRepo.create).not.toHaveBeenCalled();
    expect(emailPort.sendEmailWithTemplate).not.toHaveBeenCalled();
  });

  it('returns failure when email send fails', async () => {
    (emailPort.sendEmailWithTemplate as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: 'SMTP error',
    });

    const ctx = createTestContext();
    const result = await useCase.execute(ctx, {
      email: 'bob@example.com',
      role: 'agent',
      orgName: 'Acme',
      inviterName: 'Jane',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe('EMAIL_SEND_FAILED');
    }
  });

  it('handles unexpected errors gracefully', async () => {
    (tokenRepo.create as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB connection lost'));

    const ctx = createTestContext();
    const result = await useCase.execute(ctx, {
      email: 'bob@example.com',
      role: 'agent',
      orgName: 'Acme',
      inviterName: 'Jane',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe('INVITE_SEND_ERROR');
      expect(result.error).toContain('DB connection lost');
    }
  });

  it('normalizes email to lowercase', async () => {
    const ctx = createTestContext();
    await useCase.execute(ctx, {
      email: 'Bob@Example.COM',
      role: 'agent',
      orgName: 'Acme',
      inviterName: 'Jane',
    });

    expect(tokenRepo.countRecentByEmail).toHaveBeenCalledWith('bob@example.com', expect.any(Date));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SendCandidateInviteUseCase
// ═══════════════════════════════════════════════════════════════════════════════

describe('SendCandidateInviteUseCase', () => {
  let emailPort: ReturnType<typeof createMockEmailPort>;
  let tokenRepo: ReturnType<typeof createMockTokenRepo>;
  let useCase: SendCandidateInviteUseCase;

  beforeEach(() => {
    emailPort = createMockEmailPort();
    tokenRepo = createMockTokenRepo();
    useCase = new SendCandidateInviteUseCase(emailPort, tokenRepo, 'http://localhost:5173/invite');
  });

  it('sends a candidate invite email successfully', async () => {
    const ctx = createTestContext();
    const result = await useCase.execute(ctx, {
      email: 'candidate@example.com',
      orgName: 'Acme Corp',
      inviterName: 'Jane Doe',
      candidateInfo: { firstName: 'Alice', lastName: 'Smith', applicationId: 'app-uuid-1' },
    });

    expect(result.success).toBe(true);

    expect(emailPort.sendEmailWithTemplate).toHaveBeenCalledWith(
      'candidate@example.com',
      'candidate-invite',
      expect.objectContaining({
        candidateName: 'Alice Smith',
        orgName: 'Acme Corp',
        inviterName: 'Jane Doe',
        inviteLink: expect.stringContaining('http://localhost:5173/invite?token='),
        expiryDays: 14,
      }),
      expect.objectContaining({ tag: 'candidate-invite' }),
    );
  });

  it('uses "Candidate" as default name when no candidateInfo provided', async () => {
    const ctx = createTestContext();
    await useCase.execute(ctx, {
      email: 'candidate@example.com',
      orgName: 'Acme',
      inviterName: 'Jane',
    });

    expect(emailPort.sendEmailWithTemplate).toHaveBeenCalledWith(
      'candidate@example.com',
      'candidate-invite',
      expect.objectContaining({ candidateName: 'Candidate' }),
      expect.anything(),
    );
  });

  it('rate-limits candidate invites', async () => {
    (tokenRepo.countRecentByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(3);

    const ctx = createTestContext();
    const result = await useCase.execute(ctx, {
      email: 'candidate@example.com',
      orgName: 'Acme',
      inviterName: 'Jane',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe('INVITE_RATE_LIMITED');
    }
  });

  it('revokes previous pending invites before creating new one', async () => {
    const ctx = createTestContext();
    await useCase.execute(ctx, {
      email: 'candidate@example.com',
      orgName: 'Acme',
      inviterName: 'Jane',
    });

    expect(tokenRepo.revokeByEmail).toHaveBeenCalledWith('candidate@example.com', 'candidate_invite', 'tenant-abc');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// VerifyInviteTokenUseCase
// ═══════════════════════════════════════════════════════════════════════════════

describe('VerifyInviteTokenUseCase', () => {
  let tokenRepo: ReturnType<typeof createMockTokenRepo>;
  let useCase: VerifyInviteTokenUseCase;

  beforeEach(() => {
    tokenRepo = createMockTokenRepo();
    useCase = new VerifyInviteTokenUseCase(tokenRepo);
  });

  it('returns valid for a healthy pending token', async () => {
    const plaintextToken = 'a'.repeat(64);
    const record = makePendingRecord({
      tokenHash: createHash('sha256').update(plaintextToken).digest('hex'),
    });
    (tokenRepo.findByHash as ReturnType<typeof vi.fn>).mockResolvedValue(record);

    const result = await useCase.execute(plaintextToken);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.invite.email).toBe('invitee@example.com');
      expect(result.invite.type).toBe('org_member_invite');
    }
  });

  it('returns invalid when token not found', async () => {
    const result = await useCase.execute('nonexistent-token');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('Invalid invite token');
    }
  });

  it('returns invalid when token is consumed', async () => {
    const plaintextToken = 'b'.repeat(64);
    const record = makePendingRecord({
      tokenHash: createHash('sha256').update(plaintextToken).digest('hex'),
      consumedAt: new Date(),
      status: 'consumed',
    });
    (tokenRepo.findByHash as ReturnType<typeof vi.fn>).mockResolvedValue(record);

    const result = await useCase.execute(plaintextToken);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain('already been used');
    }
  });

  it('returns invalid when token is expired', async () => {
    const plaintextToken = 'c'.repeat(64);
    const record = makePendingRecord({
      tokenHash: createHash('sha256').update(plaintextToken).digest('hex'),
      expiresAt: new Date(Date.now() - 1000),
    });
    (tokenRepo.findByHash as ReturnType<typeof vi.fn>).mockResolvedValue(record);

    const result = await useCase.execute(plaintextToken);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain('expired');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AcceptInviteUseCase
// ═══════════════════════════════════════════════════════════════════════════════

describe('AcceptInviteUseCase', () => {
  let tokenRepo: ReturnType<typeof createMockTokenRepo>;
  let useCase: AcceptInviteUseCase;

  beforeEach(() => {
    tokenRepo = createMockTokenRepo();
    useCase = new AcceptInviteUseCase(tokenRepo);
  });

  it('accepts a valid token and marks it consumed', async () => {
    const plaintextToken = 'd'.repeat(64);
    const record = makePendingRecord({
      tokenHash: createHash('sha256').update(plaintextToken).digest('hex'),
    });
    (tokenRepo.findByHash as ReturnType<typeof vi.fn>).mockResolvedValue(record);

    const result = await useCase.execute(plaintextToken);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.invite.email).toBe('invitee@example.com');
      expect(result.invite.type).toBe('org_member_invite');
    }

    expect(tokenRepo.markConsumed).toHaveBeenCalledWith(record.id, expect.any(Date));
  });

  it('rejects an invalid token', async () => {
    const result = await useCase.execute('nonexistent-token');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe('INVALID_TOKEN');
    }
  });

  it('rejects an already consumed token', async () => {
    const plaintextToken = 'e'.repeat(64);
    const record = makePendingRecord({
      tokenHash: createHash('sha256').update(plaintextToken).digest('hex'),
      consumedAt: new Date(),
      status: 'consumed',
    });
    (tokenRepo.findByHash as ReturnType<typeof vi.fn>).mockResolvedValue(record);

    const result = await useCase.execute(plaintextToken);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe('TOKEN_CONSUMED');
    }
  });

  it('rejects an expired token', async () => {
    const plaintextToken = 'f'.repeat(64);
    const record = makePendingRecord({
      tokenHash: createHash('sha256').update(plaintextToken).digest('hex'),
      expiresAt: new Date(Date.now() - 1000),
    });
    (tokenRepo.findByHash as ReturnType<typeof vi.fn>).mockResolvedValue(record);

    const result = await useCase.execute(plaintextToken);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe('TOKEN_EXPIRED');
    }
  });

  it('handles unexpected repo errors', async () => {
    (tokenRepo.findByHash as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network error'));

    const result = await useCase.execute('some-token');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe('INVITE_ACCEPT_ERROR');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NoOpEmailAdapter
// ═══════════════════════════════════════════════════════════════════════════════

describe('NoOpEmailAdapter', () => {
  let adapter: NoOpEmailAdapter;

  beforeEach(() => {
    adapter = new NoOpEmailAdapter();
  });

  it('sendEmail returns success with noop message ID', async () => {
    const result = await adapter.sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      htmlBody: '<p>Hello</p>',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toMatch(/^noop-/);
  });

  it('sendEmailWithTemplate returns success', async () => {
    const result = await adapter.sendEmailWithTemplate(
      'test@example.com',
      'org-member-invite',
      { inviterName: 'Jane' },
      { tag: 'test' },
    );

    expect(result.success).toBe(true);
    expect(result.messageId).toMatch(/^noop-/);
  });

  it('tracks sent emails for test assertions', async () => {
    await adapter.sendEmail({ to: 'a@test.com', subject: 'One' });
    await adapter.sendEmailWithTemplate('b@test.com', 'template-1', {});

    const sent = adapter.getSentEmails();
    expect(sent).toHaveLength(2);
    expect(sent[0].type).toBe('direct');
    expect(sent[1].type).toBe('template');
  });

  it('clear() removes tracked emails', async () => {
    await adapter.sendEmail({ to: 'a@test.com', subject: 'One' });
    adapter.clear();
    expect(adapter.getSentEmails()).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PostmarkEmailAdapter (mocked postmark client)
// ═══════════════════════════════════════════════════════════════════════════════

describe('PostmarkEmailAdapter', () => {
  let originalPostmarkServerToken: string | undefined;

  beforeEach(() => {
    originalPostmarkServerToken = process.env.POSTMARK_SERVER_TOKEN;
    // Clear so the adapter doesn't try to connect
    delete process.env.POSTMARK_SERVER_TOKEN;
  });

  afterEach(() => {
    if (originalPostmarkServerToken) {
      process.env.POSTMARK_SERVER_TOKEN = originalPostmarkServerToken;
    } else {
      delete process.env.POSTMARK_SERVER_TOKEN;
    }
  });

  it('can be instantiated with a server token', async () => {
    // Dynamic import to avoid module-level postmark client creation issues
    const { PostmarkEmailAdapter } = await import(
      '../src/modules/email/infrastructure/adapters/PostmarkEmailAdapter.js'
    );

    // This creates a real ServerClient (but we won't call any methods)
    const adapter = new PostmarkEmailAdapter('test-server-token', 'from@example.com');
    expect(adapter).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Integration: End-to-end invite flow (with in-memory mocks)
// ═══════════════════════════════════════════════════════════════════════════════

describe('End-to-end invite flow (in-memory)', () => {
  it('create → verify → accept lifecycle', async () => {
    // In-memory store
    const tokenStore = new Map<string, InviteTokenRecord>();

    const emailPort = createMockEmailPort();
    const tokenRepo: IInviteTokenRepository = {
      create: vi.fn(async (data) => {
        tokenStore.set(data.tokenHash, {
          ...data,
          consumedAt: null,
          status: 'pending',
        });
      }),
      findByHash: vi.fn(async (hash) => tokenStore.get(hash) ?? null),
      markConsumed: vi.fn(async (id, consumedAt) => {
        for (const record of tokenStore.values()) {
          if (record.id === id) {
            record.consumedAt = consumedAt;
            record.status = 'consumed';
          }
        }
      }),
      findPendingByEmail: vi.fn().mockResolvedValue([]),
      countRecentByEmail: vi.fn().mockResolvedValue(0),
      revokeByEmail: vi.fn().mockResolvedValue(0),
    };

    const sendUC = new SendOrgMemberInviteUseCase(emailPort, tokenRepo, 'http://localhost:5173/invite');
    const verifyUC = new VerifyInviteTokenUseCase(tokenRepo);
    const acceptUC = new AcceptInviteUseCase(tokenRepo);

    // 1. Send invite
    const ctx = createTestContext();
    const sendResult = await sendUC.execute(ctx, {
      email: 'member@example.com',
      role: 'agent',
      orgName: 'Acme',
      inviterName: 'Jane',
    });

    expect(sendResult.success).toBe(true);
    const plaintext = (sendResult as { success: true; tokenPlaintext: string }).tokenPlaintext;

    // 2. Verify token
    const verifyResult = await verifyUC.execute(plaintext);
    expect(verifyResult.valid).toBe(true);

    // 3. Accept invite
    const acceptResult = await acceptUC.execute(plaintext);
    expect(acceptResult.success).toBe(true);
    if (acceptResult.success) {
      expect(acceptResult.invite.email).toBe('member@example.com');
      expect(acceptResult.invite.type).toBe('org_member_invite');
    }

    // 4. Re-verify should fail (consumed)
    const reVerify = await verifyUC.execute(plaintext);
    expect(reVerify.valid).toBe(false);

    // 5. Re-accept should fail (consumed)
    const reAccept = await acceptUC.execute(plaintext);
    expect(reAccept.success).toBe(false);
    if (!reAccept.success) {
      expect(reAccept.errorCode).toBe('TOKEN_CONSUMED');
    }
  });
});
