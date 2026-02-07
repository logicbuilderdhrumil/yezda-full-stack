/**
 * Client Portal Tests
 * Tests for RBAC guards, tenant scoping, and all client-portal endpoints.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDashboardSummary,
  listCandidates,
  getCandidateDetail,
  getOrgSettingsForTenant,
  updateOrgSettings,
  _resetOrgSettingsStore,
} from '../src/services/client-portal.service.js';
import type {
  DashboardSummary,
  PaginatedCandidateList,
  CandidateDetail,
  OrgSettings,
} from '../src/services/client-portal.service.js';

// ── Service-level tests ────────────────────────────────────────────

describe('Client Portal Service', () => {
  beforeEach(() => {
    _resetOrgSettingsStore();
  });

  // ── Dashboard ──────────────────────────────────────────────────

  describe('getDashboardSummary', () => {
    it('should return a dashboard summary with expected shape', () => {
      const result = getDashboardSummary('tenant-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const data = result.data as DashboardSummary;
      expect(data.totalCandidates).toBeTypeOf('number');
      expect(data.activeScreenings).toBeTypeOf('number');
      expect(data.completedScreenings).toBeTypeOf('number');
      expect(data.pendingActions).toBeTypeOf('number');
      expect(Array.isArray(data.recentActivity)).toBe(true);
      expect(data.recentActivity.length).toBeGreaterThan(0);
    });

    it('should include activity items with correct fields', () => {
      const result = getDashboardSummary('tenant-1');
      const activity = result.data!.recentActivity[0];

      expect(activity).toHaveProperty('id');
      expect(activity).toHaveProperty('type');
      expect(activity).toHaveProperty('message');
      expect(activity).toHaveProperty('timestamp');
      expect(['screening_completed', 'candidate_added', 'action_required', 'report_ready']).toContain(activity.type);
    });

    it('should scope activity IDs to the tenant', () => {
      const result = getDashboardSummary('my-tenant');
      for (const item of result.data!.recentActivity) {
        expect(item.id).toContain('my-tenant');
      }
    });
  });

  // ── Candidates list ────────────────────────────────────────────

  describe('listCandidates', () => {
    it('should return a paginated candidate list', () => {
      const result = listCandidates('tenant-1', {});

      expect(result.success).toBe(true);

      const data = result.data as PaginatedCandidateList;
      expect(data.candidates).toBeDefined();
      expect(data.total).toBeTypeOf('number');
      expect(data.page).toBe(1);
      expect(data.limit).toBe(20);
      expect(data.totalPages).toBeTypeOf('number');
    });

    it('should paginate correctly', () => {
      const result = listCandidates('tenant-1', { page: 1, limit: 2 });
      const data = result.data as PaginatedCandidateList;

      expect(data.candidates.length).toBe(2);
      expect(data.limit).toBe(2);
      expect(data.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should filter by search term', () => {
      const result = listCandidates('tenant-1', { search: 'jane' });
      const data = result.data as PaginatedCandidateList;

      expect(data.candidates.length).toBeGreaterThanOrEqual(1);
      expect(data.candidates[0].firstName.toLowerCase()).toContain('jane');
    });

    it('should filter by status', () => {
      const result = listCandidates('tenant-1', { status: 'completed' });
      const data = result.data as PaginatedCandidateList;

      for (const c of data.candidates) {
        expect(c.screeningStatus).toBe('completed');
      }
    });

    it('should combine search and status filters', () => {
      const result = listCandidates('tenant-1', { search: 'smith', status: 'completed' });
      const data = result.data as PaginatedCandidateList;

      for (const c of data.candidates) {
        expect(c.screeningStatus).toBe('completed');
        const name = `${c.firstName} ${c.lastName}`.toLowerCase();
        expect(name).toContain('smith');
      }
    });

    it('should return empty list for non-matching search', () => {
      const result = listCandidates('tenant-1', { search: 'zzzznotexist' });
      const data = result.data as PaginatedCandidateList;

      expect(data.candidates.length).toBe(0);
      expect(data.total).toBe(0);
    });

    it('should clamp limit to reasonable bounds', () => {
      const result = listCandidates('tenant-1', { limit: 999 });
      expect(result.data!.limit).toBe(100);

      const result2 = listCandidates('tenant-1', { limit: -5 });
      expect(result2.data!.limit).toBe(1);
    });
  });

  // ── Candidate detail ───────────────────────────────────────────

  describe('getCandidateDetail', () => {
    it('should return candidate detail with screening steps', () => {
      const result = getCandidateDetail('tenant-1', 'cand-1');

      expect(result.success).toBe(true);

      const data = result.data as CandidateDetail;
      expect(data.id).toBe('cand-1');
      expect(data.firstName).toBe('Jane');
      expect(data.lastName).toBe('Smith');
      expect(Array.isArray(data.screeningSteps)).toBe(true);
      expect(data.screeningSteps.length).toBeGreaterThan(0);
      expect(data.progressPercentage).toBeTypeOf('number');
    });

    it('should include phone and email in detail', () => {
      const result = getCandidateDetail('tenant-1', 'cand-2');
      const data = result.data as CandidateDetail;

      expect(data.email).toBeDefined();
      expect(data.phone).toBeDefined();
    });

    it('should return NOT_FOUND for unknown candidate', () => {
      const result = getCandidateDetail('tenant-1', 'cand-unknown');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should have screening steps with proper shape', () => {
      const result = getCandidateDetail('tenant-1', 'cand-1');
      const step = result.data!.screeningSteps[0];

      expect(step).toHaveProperty('id');
      expect(step).toHaveProperty('name');
      expect(step).toHaveProperty('status');
      expect(step).toHaveProperty('completedAt');
    });

    it('should show 100% progress for completed candidates', () => {
      const result = getCandidateDetail('tenant-1', 'cand-1');
      expect(result.data!.progressPercentage).toBe(100);
    });

    it('should show partial progress for in_progress candidates', () => {
      const result = getCandidateDetail('tenant-1', 'cand-2');
      expect(result.data!.progressPercentage).toBe(50);
    });
  });

  // ── Org settings ───────────────────────────────────────────────

  describe('getOrgSettingsForTenant', () => {
    it('should return default org settings', () => {
      const result = getOrgSettingsForTenant('tenant-1');

      expect(result.success).toBe(true);

      const data = result.data as OrgSettings;
      expect(data.orgName).toBeTypeOf('string');
      expect(data.contactEmail).toBeTypeOf('string');
      expect(data.notificationPrefs).toBeDefined();
      expect(data.notificationPrefs.emailOnScreeningComplete).toBeTypeOf('boolean');
      expect(data.notificationPrefs.emailOnActionRequired).toBeTypeOf('boolean');
      expect(data.notificationPrefs.weeklyDigest).toBeTypeOf('boolean');
    });

    it('should return same settings for the same tenant', () => {
      const r1 = getOrgSettingsForTenant('tenant-x');
      const r2 = getOrgSettingsForTenant('tenant-x');

      expect(r1.data).toEqual(r2.data);
    });
  });

  describe('updateOrgSettings', () => {
    it('should update orgName', () => {
      const result = updateOrgSettings('tenant-1', { orgName: 'New Name' });

      expect(result.success).toBe(true);
      expect(result.data!.orgName).toBe('New Name');
    });

    it('should update contactEmail', () => {
      const result = updateOrgSettings('tenant-1', { contactEmail: 'new@example.com' });

      expect(result.success).toBe(true);
      expect(result.data!.contactEmail).toBe('new@example.com');
    });

    it('should partially update notificationPrefs', () => {
      // First get defaults
      getOrgSettingsForTenant('tenant-1');

      const result = updateOrgSettings('tenant-1', {
        notificationPrefs: { weeklyDigest: true },
      });

      expect(result.success).toBe(true);
      expect(result.data!.notificationPrefs.weeklyDigest).toBe(true);
      // Other prefs remain unchanged
      expect(result.data!.notificationPrefs.emailOnScreeningComplete).toBe(true);
    });

    it('should persist updates across reads', () => {
      updateOrgSettings('tenant-1', { orgName: 'Persisted Corp' });

      const result = getOrgSettingsForTenant('tenant-1');
      expect(result.data!.orgName).toBe('Persisted Corp');
    });

    it('should isolate settings between tenants', () => {
      updateOrgSettings('tenant-a', { orgName: 'Tenant A Corp' });
      updateOrgSettings('tenant-b', { orgName: 'Tenant B Corp' });

      expect(getOrgSettingsForTenant('tenant-a').data!.orgName).toBe('Tenant A Corp');
      expect(getOrgSettingsForTenant('tenant-b').data!.orgName).toBe('Tenant B Corp');
    });
  });
});

// ── Guard / RBAC tests (unit-level, testing the middleware functions) ──

import type { Request, Response, NextFunction } from 'express';
import {
  requireTenantScopeGuard,
  requireRoleGuard,
} from '../src/middleware/route-guards.middleware.js';
import type {
  TenantScopedRequest,
  AuthenticatedRoleRequest,
  AuthenticatedUserPayload,
} from '../src/middleware/route-guards.middleware.js';

/** Helper — build a minimal mock request */
function mockReq(overrides: Partial<AuthenticatedRoleRequest> = {}): AuthenticatedRoleRequest {
  return {
    user: undefined,
    headers: {},
    path: '/test',
    method: 'GET',
    connection: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as unknown as AuthenticatedRoleRequest;
}

/** Helper — build a mock response that captures status + json */
function mockRes(): Response & { _status: number; _body: unknown } {
  const res = {
    _status: 0,
    _body: undefined as unknown,
    headersSent: false,
    status(code: number) {
      res._status = code;
      return res;
    },
    json(body: unknown) {
      res._body = body;
      return res;
    },
  } as unknown as Response & { _status: number; _body: unknown };
  return res;
}

describe('Route Guards – Client RBAC', () => {
  describe('requireRoleGuard – client roles', () => {
    it('should allow client role', async () => {
      const guard = requireRoleGuard('client', 'client_admin');
      const req = mockReq({
        user: { sub: 'u1', type: 'user', roles: ['client'], tenantId: 'tenant-1' } as AuthenticatedUserPayload,
      });
      const res = mockRes();
      let nextCalled = false;
      const next: NextFunction = () => { nextCalled = true; };

      await guard(req, res, next);
      expect(nextCalled).toBe(true);
    });

    it('should allow client_admin role', async () => {
      const guard = requireRoleGuard('client', 'client_admin');
      const req = mockReq({
        user: { sub: 'u1', type: 'user', roles: ['client_admin'], tenantId: 'tenant-1' } as AuthenticatedUserPayload,
      });
      const res = mockRes();
      let nextCalled = false;
      const next: NextFunction = () => { nextCalled = true; };

      await guard(req, res, next);
      expect(nextCalled).toBe(true);
    });

    it('should deny viewer role from client routes', async () => {
      const guard = requireRoleGuard('client', 'client_admin');
      const req = mockReq({
        user: { sub: 'u1', type: 'user', roles: ['viewer'], tenantId: 'tenant-1' } as AuthenticatedUserPayload,
      });
      const res = mockRes();
      const next: NextFunction = () => {};

      await guard(req, res, next);
      expect(res._status).toBe(403);
    });

    it('should deny admin role from client-only routes', async () => {
      const guard = requireRoleGuard('client', 'client_admin');
      const req = mockReq({
        user: { sub: 'u1', type: 'user', roles: ['admin'], tenantId: 'tenant-1' } as AuthenticatedUserPayload,
      });
      const res = mockRes();
      const next: NextFunction = () => {};

      await guard(req, res, next);
      expect(res._status).toBe(403);
    });

    it('should deny unauthenticated requests', async () => {
      const guard = requireRoleGuard('client', 'client_admin');
      const req = mockReq();
      const res = mockRes();
      const next: NextFunction = () => {};

      await guard(req, res, next);
      expect(res._status).toBe(401);
    });
  });

  describe('requireRoleGuard – client_admin only', () => {
    it('should allow client_admin', async () => {
      const guard = requireRoleGuard('client_admin');
      const req = mockReq({
        user: { sub: 'u1', type: 'user', roles: ['client_admin'], tenantId: 'tenant-1' } as AuthenticatedUserPayload,
      });
      const res = mockRes();
      let nextCalled = false;
      const next: NextFunction = () => { nextCalled = true; };

      await guard(req, res, next);
      expect(nextCalled).toBe(true);
    });

    it('should deny regular client from admin write routes', async () => {
      const guard = requireRoleGuard('client_admin');
      const req = mockReq({
        user: { sub: 'u1', type: 'user', roles: ['client'], tenantId: 'tenant-1' } as AuthenticatedUserPayload,
      });
      const res = mockRes();
      const next: NextFunction = () => {};

      await guard(req, res, next);
      expect(res._status).toBe(403);
    });
  });

  describe('requireTenantScopeGuard', () => {
    it('should set tenantScope when tenantId exists', async () => {
      const req = mockReq({
        user: { sub: 'u1', type: 'user', roles: ['client'], tenantId: 'tenant-abc' } as AuthenticatedUserPayload,
      }) as TenantScopedRequest;
      const res = mockRes();
      let nextCalled = false;
      const next: NextFunction = () => { nextCalled = true; };

      await requireTenantScopeGuard(req, res, next);

      expect(nextCalled).toBe(true);
      expect(req.tenantScope).toBe('tenant-abc');
    });

    it('should deny requests without tenantId', async () => {
      const req = mockReq({
        user: { sub: 'u1', type: 'user', roles: ['client'] } as AuthenticatedUserPayload,
      }) as TenantScopedRequest;
      const res = mockRes();
      const next: NextFunction = () => {};

      await requireTenantScopeGuard(req, res, next);

      expect(res._status).toBe(403);
      expect((res._body as { code: string }).code).toBe('TENANT_REQUIRED');
    });

    it('should deny unauthenticated requests', async () => {
      const req = mockReq() as TenantScopedRequest;
      const res = mockRes();
      const next: NextFunction = () => {};

      await requireTenantScopeGuard(req, res, next);

      expect(res._status).toBe(401);
    });
  });
});
