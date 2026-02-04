/**
 * Organization Management Tests
 * Task 1.4: Tests for organization workflows
 * Task 1.9: Security/compliance tests for organization access
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { organizationService } from '../src/services/org-management.service.js';
import { organizationRepository } from '../src/repositories/org-management.repository.js';
import { orgMetricsService, ORG_SLOS } from '../src/services/org-management-metrics.service.js';
import {
  generateSlug,
  DEFAULT_ORG_SETTINGS,
  type CreateOrganizationInput,
  type Organization,
  type OrganizationStatus,
} from '../src/models/org-management.model.js';

// Mock the organization repository
vi.mock('../src/repositories/org-management.repository.js', () => {
  const organizations = new Map<string, Organization>();
  let idCounter = 0;

  return {
    organizationRepository: {
      create: vi.fn(async (input: CreateOrganizationInput) => {
        idCounter++;
        const id = `org-${idCounter}`;
        const now = new Date();
        const organization: Organization = {
          id,
          name: input.name,
          slug: input.slug || generateSlug(input.name),
          description: input.description,
          status: 'pending',
          plan: input.plan ?? 'free',
          logoUrl: input.logoUrl,
          website: input.website,
          primaryContactEmail: input.primaryContactEmail,
          primaryContactName: input.primaryContactName,
          metadata: input.metadata,
          settings: { ...DEFAULT_ORG_SETTINGS, ...input.settings },
          createdAt: now,
          updatedAt: now,
          createdBy: input.createdBy,
        };
        organizations.set(id, organization);
        return organization;
      }),

      findById: vi.fn(async (id: string) => {
        return organizations.get(id);
      }),

      findBySlug: vi.fn(async (slug: string) => {
        for (const org of organizations.values()) {
          if (org.slug === slug) return org;
        }
        return undefined;
      }),

      slugExists: vi.fn(async (slug: string, excludeId?: string) => {
        for (const org of organizations.values()) {
          if (org.slug === slug && org.id !== excludeId) return true;
        }
        return false;
      }),

      list: vi.fn(async (
        filters: { status?: string; plan?: string; search?: string } = {},
        pagination: { limit?: number; offset?: number; sortBy?: string; sortOrder?: string } = {}
      ) => {
        let matchingOrgs = Array.from(organizations.values());

        if (filters.status) {
          matchingOrgs = matchingOrgs.filter((o) => o.status === filters.status);
        }
        if (filters.plan) {
          matchingOrgs = matchingOrgs.filter((o) => o.plan === filters.plan);
        }
        if (filters.search) {
          const search = filters.search.toLowerCase();
          matchingOrgs = matchingOrgs.filter(
            (o) =>
              o.name.toLowerCase().includes(search) ||
              o.slug.toLowerCase().includes(search) ||
              o.description?.toLowerCase().includes(search)
          );
        }

        // Sort
        const sortBy = pagination.sortBy ?? 'createdAt';
        const sortOrder = pagination.sortOrder ?? 'desc';
        matchingOrgs.sort((a, b) => {
          const aVal = sortBy === 'name' ? a.name : a.createdAt.getTime();
          const bVal = sortBy === 'name' ? b.name : b.createdAt.getTime();
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
          }
          return sortOrder === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
        });

        const limit = pagination.limit ?? 20;
        const offset = pagination.offset ?? 0;
        const paginatedOrgs = matchingOrgs.slice(offset, offset + limit);

        return {
          organizations: paginatedOrgs,
          total: matchingOrgs.length,
        };
      }),

      update: vi.fn(async (id: string, input: { status?: OrganizationStatus; name?: string; updatedBy: string }) => {
        const org = organizations.get(id);
        if (!org) return undefined;

        if (input.name) org.name = input.name;
        if (input.status) org.status = input.status;
        org.updatedAt = new Date();
        org.updatedBy = input.updatedBy;

        return org;
      }),

      archive: vi.fn(async (id: string, updatedBy: string) => {
        const org = organizations.get(id);
        if (!org) return undefined;
        org.status = 'archived';
        org.updatedAt = new Date();
        org.updatedBy = updatedBy;
        return org;
      }),

      delete: vi.fn(async (id: string) => {
        return organizations.delete(id);
      }),

      countByStatus: vi.fn(async (status: string) => {
        let count = 0;
        for (const org of organizations.values()) {
          if (org.status === status) count++;
        }
        return count;
      }),

      findByIds: vi.fn(async (ids: string[]) => {
        const result: Organization[] = [];
        for (const id of ids) {
          const org = organizations.get(id);
          if (org) result.push(org);
        }
        return result;
      }),

      // Test helper to clear organizations
      _clear: () => {
        organizations.clear();
        idCounter = 0;
      },
    },
    OrganizationRepository: vi.fn(),
  };
});

// Mock audit service
vi.mock('../src/services/audit.service.js', () => ({
  auditService: {
    log: vi.fn(),
  },
}));

// Mock redis cache functions
vi.mock('../src/db/redis.js', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  cacheDel: vi.fn().mockResolvedValue(undefined),
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60000 }),
}));

const requestContext = {
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
  channel: 'api' as const,
};

const adminActor = {
  userId: 'admin-user-1',
  userType: 'user' as const,
};

describe('Organization Model', () => {
  describe('generateSlug', () => {
    it('should generate a URL-friendly slug from name', () => {
      expect(generateSlug('Acme Corporation')).toBe('acme-corporation');
      expect(generateSlug('  Tech Startup  ')).toBe('tech-startup');
      expect(generateSlug('Company123')).toBe('company123');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Acme & Co.')).toBe('acme-co');
      expect(generateSlug("O'Reilly Media")).toBe('oreilly-media');
    });

    it('should handle multiple spaces and hyphens', () => {
      expect(generateSlug('Acme   Corporation')).toBe('acme-corporation');
      expect(generateSlug('Acme--Corp')).toBe('acme-corp');
    });

    it('should truncate to 50 characters', () => {
      const longName = 'A'.repeat(100);
      expect(generateSlug(longName).length).toBeLessThanOrEqual(50);
    });
  });

  describe('Default Settings', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_ORG_SETTINGS.allowSelfRegistration).toBe(false);
      expect(DEFAULT_ORG_SETTINGS.requireMfa).toBe(false);
      expect(DEFAULT_ORG_SETTINGS.sessionTimeoutMinutes).toBe(60);
      expect(DEFAULT_ORG_SETTINGS.features).toEqual([]);
    });
  });
});

describe('Organization Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (organizationRepository as unknown as { _clear: () => void })._clear();
  });

  describe('create', () => {
    it('should create an organization successfully', async () => {
      const input: CreateOrganizationInput = {
        name: 'Acme Corporation',
        primaryContactEmail: 'admin@acme.com',
        createdBy: 'admin-user-1',
      };

      const result = await organizationService.create(input, adminActor, requestContext);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: 'Acme Corporation',
        slug: 'acme-corporation',
        status: 'pending',
        plan: 'free',
        primaryContactEmail: 'admin@acme.com',
      });
    });

    it('should use custom slug when provided', async () => {
      const input: CreateOrganizationInput = {
        name: 'Acme Corporation',
        slug: 'custom-slug',
        primaryContactEmail: 'admin@acme.com',
        createdBy: 'admin-user-1',
      };

      const result = await organizationService.create(input, adminActor, requestContext);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        slug: 'custom-slug',
      });
    });

    it('should set plan when provided', async () => {
      const input: CreateOrganizationInput = {
        name: 'Enterprise Corp',
        plan: 'enterprise',
        primaryContactEmail: 'admin@enterprise.com',
        createdBy: 'admin-user-1',
      };

      const result = await organizationService.create(input, adminActor, requestContext);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        plan: 'enterprise',
      });
    });

    it('should reject duplicate slug', async () => {
      // Create first org
      await organizationService.create(
        {
          name: 'Acme Corporation',
          primaryContactEmail: 'admin@acme.com',
          createdBy: 'admin-user-1',
        },
        adminActor,
        requestContext
      );

      // Try to create second org with same name (same slug)
      const result = await organizationService.create(
        {
          name: 'Acme Corporation',
          primaryContactEmail: 'admin@acme2.com',
          createdBy: 'admin-user-1',
        },
        adminActor,
        requestContext
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ORG_SLUG_EXISTS');
    });
  });

  describe('getById', () => {
    it('should return organization by ID', async () => {
      const createResult = await organizationService.create(
        {
          name: 'Acme Corporation',
          primaryContactEmail: 'admin@acme.com',
          createdBy: 'admin-user-1',
        },
        adminActor,
        requestContext
      );

      const orgId = (createResult.data as Organization).id;
      const result = await organizationService.getById(orgId, adminActor, requestContext);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: orgId,
        name: 'Acme Corporation',
      });
    });

    it('should return error for non-existent organization', async () => {
      const result = await organizationService.getById('non-existent-id', adminActor, requestContext);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ORG_NOT_FOUND');
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      // Create multiple organizations for listing tests
      await organizationService.create(
        {
          name: 'Acme Corporation',
          plan: 'enterprise',
          primaryContactEmail: 'admin@acme.com',
          createdBy: 'admin-user-1',
        },
        adminActor,
        requestContext
      );

      await organizationService.create(
        {
          name: 'Beta Tech',
          plan: 'starter',
          primaryContactEmail: 'admin@beta.com',
          createdBy: 'admin-user-1',
        },
        adminActor,
        requestContext
      );

      await organizationService.create(
        {
          name: 'Gamma Industries',
          plan: 'professional',
          primaryContactEmail: 'admin@gamma.com',
          createdBy: 'admin-user-1',
        },
        adminActor,
        requestContext
      );
    });

    it('should list all organizations', async () => {
      const result = await organizationService.list({}, {}, adminActor, requestContext);

      expect(result.success).toBe(true);
      const data = result.data as { organizations: Organization[]; total: number };
      expect(data.organizations.length).toBe(3);
      expect(data.total).toBe(3);
    });

    it('should filter organizations by plan', async () => {
      const result = await organizationService.list(
        { plan: 'enterprise' },
        {},
        adminActor,
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as { organizations: Organization[] };
      expect(data.organizations.length).toBe(1);
      expect(data.organizations[0].name).toBe('Acme Corporation');
    });

    it('should search organizations by name', async () => {
      const result = await organizationService.list(
        { search: 'beta' },
        {},
        adminActor,
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as { organizations: Organization[] };
      expect(data.organizations.length).toBe(1);
      expect(data.organizations[0].name).toBe('Beta Tech');
    });

    it('should paginate results', async () => {
      const result = await organizationService.list(
        {},
        { limit: 2 },
        adminActor,
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as { organizations: Organization[]; total: number; hasMore: boolean };
      expect(data.organizations.length).toBeLessThanOrEqual(2);
      expect(data.total).toBe(3);
    });
  });

  describe('update', () => {
    it('should update organization fields', async () => {
      const createResult = await organizationService.create(
        {
          name: 'Acme Corporation',
          primaryContactEmail: 'admin@acme.com',
          createdBy: 'admin-user-1',
        },
        adminActor,
        requestContext
      );

      const orgId = (createResult.data as Organization).id;

      const result = await organizationService.update(
        orgId,
        {
          name: 'Acme Inc',
          status: 'active',
          updatedBy: 'admin-user-1',
        },
        adminActor,
        requestContext
      );

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        name: 'Acme Inc',
        status: 'active',
      });
    });

    it('should return error for non-existent organization', async () => {
      const result = await organizationService.update(
        'non-existent-id',
        {
          name: 'Updated Name',
          updatedBy: 'admin-user-1',
        },
        adminActor,
        requestContext
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ORG_NOT_FOUND');
    });
  });
});

describe('Organization Security/Compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (organizationRepository as unknown as { _clear: () => void })._clear();
  });

  describe('Access Control', () => {
    it('should track actor in create operation', async () => {
      const result = await organizationService.create(
        {
          name: 'Test Org',
          primaryContactEmail: 'admin@test.com',
          createdBy: 'admin-user-1',
        },
        adminActor,
        requestContext
      );

      expect(result.success).toBe(true);
      expect((result.data as Organization).createdBy).toBe('admin-user-1');
    });

    it('should track actor in update operation', async () => {
      const createResult = await organizationService.create(
        {
          name: 'Test Org',
          primaryContactEmail: 'admin@test.com',
          createdBy: 'admin-user-1',
        },
        adminActor,
        requestContext
      );

      const orgId = (createResult.data as Organization).id;
      const differentActor = { userId: 'admin-user-2', userType: 'user' as const };

      const result = await organizationService.update(
        orgId,
        {
          name: 'Updated Org',
          updatedBy: 'admin-user-2',
        },
        differentActor,
        requestContext
      );

      expect(result.success).toBe(true);
      expect((result.data as Organization).updatedBy).toBe('admin-user-2');
    });
  });

  describe('Audit Trail', () => {
    it('should log organization creation', async () => {
      const { auditService } = await import('../src/services/audit.service.js');

      await organizationService.create(
        {
          name: 'Audited Org',
          primaryContactEmail: 'admin@audited.com',
          createdBy: 'admin-user-1',
        },
        adminActor,
        requestContext
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'ORG_CREATED',
          actorId: adminActor.userId,
          actorType: adminActor.userType,
          success: true,
        })
      );
    });

    it('should log organization access', async () => {
      const { auditService } = await import('../src/services/audit.service.js');

      const createResult = await organizationService.create(
        {
          name: 'Audited Org',
          primaryContactEmail: 'admin@audited.com',
          createdBy: 'admin-user-1',
        },
        adminActor,
        requestContext
      );

      const orgId = (createResult.data as Organization).id;

      vi.clearAllMocks();

      await organizationService.getById(orgId, adminActor, requestContext);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'ORG_ACCESSED',
          targetId: orgId,
          success: true,
        })
      );
    });

    it('should log failed access attempts', async () => {
      const { auditService } = await import('../src/services/audit.service.js');

      await organizationService.getById('non-existent-id', adminActor, requestContext);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'ORG_ACCESS_DENIED',
          targetId: 'non-existent-id',
          success: false,
        })
      );
    });

    it('should log status changes separately', async () => {
      const { auditService } = await import('../src/services/audit.service.js');

      const createResult = await organizationService.create(
        {
          name: 'Status Change Org',
          primaryContactEmail: 'admin@status.com',
          createdBy: 'admin-user-1',
        },
        adminActor,
        requestContext
      );

      const orgId = (createResult.data as Organization).id;

      vi.clearAllMocks();

      await organizationService.update(
        orgId,
        {
          status: 'active',
          updatedBy: 'admin-user-1',
        },
        adminActor,
        requestContext
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'ORG_STATUS_CHANGED',
          targetId: orgId,
          metadata: expect.objectContaining({
            previousStatus: 'pending',
            newStatus: 'active',
          }),
        })
      );
    });
  });
});

describe('Organization Metrics', () => {
  it('should have defined SLO targets', () => {
    expect(ORG_SLOS.LIST_LATENCY_P99_MS).toBeDefined();
    expect(ORG_SLOS.LIST_LATENCY_P95_MS).toBeDefined();
    expect(ORG_SLOS.READ_LATENCY_P99_MS).toBeDefined();
    expect(ORG_SLOS.LIST_SUCCESS_RATE).toBeDefined();
    expect(ORG_SLOS.CACHE_HIT_RATE).toBeDefined();
    expect(ORG_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE).toBeDefined();
  });

  it('should return SLO check result structure', () => {
    const result = orgMetricsService.checkSLOs();

    // Verify the result has the expected structure
    expect(result).toHaveProperty('met');
    expect(result).toHaveProperty('violations');
    expect(typeof result.met).toBe('boolean');
    expect(Array.isArray(result.violations)).toBe(true);
  });
});
