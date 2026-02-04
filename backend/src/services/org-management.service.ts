/**
 * Organization Management Service
 * Task 1.2, 1.3: Organization lifecycle operations
 * Task 1.5: RBAC and tenant isolation
 * Task 1.6: Audit logging for organization access and changes
 * Task 1.8: SLO metrics
 */

import { organizationRepository } from '../repositories/org-management.repository.js';
import { auditService } from './audit.service.js';
import { orgMetricsService } from './org-management-metrics.service.js';
import { cacheGet, cacheSet, cacheDel } from '../db/redis.js';
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationFilters,
  OrganizationListResult,
  OrganizationOperationResult,
  OrganizationPaginationOptions,
  OrgAuditEventType,
} from '../models/org-management.model.js';
import { generateSlug } from '../models/org-management.model.js';
import type { AuditEventType } from '../models/audit.model.js';

/** Cache TTL in seconds */
const CACHE_TTL_SECONDS = 300; // 5 minutes

/** Request context for audit logging */
interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
  channel: 'web' | 'mobile' | 'api';
}

/** Actor context for audit logging */
interface ActorContext {
  userId: string;
  userType: 'user' | 'candidate';
}

export class OrganizationService {
  /**
   * Create a new organization
   */
  async create(
    input: CreateOrganizationInput,
    actor: ActorContext,
    requestContext: RequestContext
  ): Promise<OrganizationOperationResult> {
    const start = Date.now();

    try {
      // Generate and validate slug uniqueness
      const slug = input.slug || generateSlug(input.name);
      const slugExists = await organizationRepository.slugExists(slug);

      if (slugExists) {
        this.logOrgEvent('ORG_CREATED', {
          actor,
          organizationId: undefined,
          success: false,
          errorMessage: 'Organization slug already exists',
          ...requestContext,
        });

        orgMetricsService.recordCreate(false, Date.now() - start);

        return {
          success: false,
          error: 'An organization with this slug already exists',
          errorCode: 'ORG_SLUG_EXISTS',
        };
      }

      const organization = await organizationRepository.create({
        ...input,
        slug,
      });

      this.logOrgEvent('ORG_CREATED', {
        actor,
        organizationId: organization.id,
        organizationName: organization.name,
        success: true,
        ...requestContext,
      });

      // Invalidate list cache
      await this.invalidateListCache();

      orgMetricsService.recordCreate(true, Date.now() - start);

      return { success: true, data: organization };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logOrgEvent('ORG_CREATED', {
        actor,
        organizationId: undefined,
        success: false,
        errorMessage,
        ...requestContext,
      });

      orgMetricsService.recordCreate(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to create organization',
        errorCode: 'ORG_CREATE_ERROR',
      };
    }
  }

  /**
   * Get organization by ID
   */
  async getById(
    id: string,
    actor: ActorContext,
    requestContext: RequestContext
  ): Promise<OrganizationOperationResult> {
    const start = Date.now();

    try {
      // Try cache first
      const cacheKey = `org:${id}`;
      const cached = await cacheGet<Organization>(cacheKey);

      if (cached) {
        orgMetricsService.recordCacheHit(true);
        orgMetricsService.recordRead(true, Date.now() - start);

        this.logOrgEvent('ORG_ACCESSED', {
          actor,
          organizationId: id,
          organizationName: cached.name,
          success: true,
          metadata: { cached: true },
          ...requestContext,
        });

        return { success: true, data: cached };
      }

      orgMetricsService.recordCacheHit(false);

      const organization = await organizationRepository.findById(id);

      if (!organization) {
        this.logOrgEvent('ORG_ACCESS_DENIED', {
          actor,
          organizationId: id,
          success: false,
          errorMessage: 'Organization not found',
          ...requestContext,
        });

        orgMetricsService.recordAccessDenied();
        orgMetricsService.recordRead(false, Date.now() - start);

        return {
          success: false,
          error: 'Organization not found',
          errorCode: 'ORG_NOT_FOUND',
        };
      }

      // Cache the result (convert seconds to milliseconds)
      await cacheSet(cacheKey, organization, CACHE_TTL_SECONDS * 1000);

      this.logOrgEvent('ORG_ACCESSED', {
        actor,
        organizationId: id,
        organizationName: organization.name,
        success: true,
        ...requestContext,
      });

      orgMetricsService.recordRead(true, Date.now() - start);

      return { success: true, data: organization };
    } catch (error) {
      orgMetricsService.recordRead(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to retrieve organization',
        errorCode: 'ORG_READ_ERROR',
      };
    }
  }

  /**
   * List organizations with filters and pagination
   */
  async list(
    filters: OrganizationFilters = {},
    pagination: OrganizationPaginationOptions = {},
    actor: ActorContext,
    requestContext: RequestContext
  ): Promise<OrganizationOperationResult<OrganizationListResult>> {
    const start = Date.now();

    try {
      const limit = Math.min(pagination.limit ?? 20, 100);
      const isSearch = Boolean(filters.search);

      // Try cache for non-search list requests
      if (!isSearch && !filters.createdAfter && !filters.createdBefore) {
        const cacheKey = this.getListCacheKey(filters, pagination);
        const cached = await cacheGet<OrganizationListResult>(cacheKey);

        if (cached) {
          orgMetricsService.recordCacheHit(true);
          orgMetricsService.recordList(true, Date.now() - start);

          this.logOrgEvent('ORG_LIST_ACCESSED', {
            actor,
            success: true,
            metadata: {
              count: cached.organizations.length,
              total: cached.total,
              cached: true,
              filters: Object.keys(filters).length > 0 ? filters : undefined,
            },
            ...requestContext,
          });

          return { success: true, data: cached };
        }

        orgMetricsService.recordCacheHit(false);
      }

      const { organizations, total } = await organizationRepository.list(
        filters,
        { ...pagination, limit }
      );

      const hasMore = organizations.length > limit;
      const resultOrgs = hasMore ? organizations.slice(0, -1) : organizations;
      const nextCursor = hasMore && resultOrgs.length > 0
        ? resultOrgs[resultOrgs.length - 1].createdAt.toISOString()
        : undefined;

      const result: OrganizationListResult = {
        organizations: resultOrgs,
        total,
        hasMore,
        nextCursor,
      };

      // Cache non-search results (convert seconds to milliseconds)
      if (!isSearch && !filters.createdAfter && !filters.createdBefore) {
        const cacheKey = this.getListCacheKey(filters, pagination);
        await cacheSet(cacheKey, result, CACHE_TTL_SECONDS * 1000);
      }

      this.logOrgEvent('ORG_LIST_ACCESSED', {
        actor,
        success: true,
        metadata: {
          count: resultOrgs.length,
          total,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
        },
        ...requestContext,
      });

      if (isSearch) {
        orgMetricsService.recordSearch(true, Date.now() - start);
      } else {
        orgMetricsService.recordList(true, Date.now() - start);
      }

      return { success: true, data: result };
    } catch (error) {
      if (filters.search) {
        orgMetricsService.recordSearch(false, Date.now() - start);
      } else {
        orgMetricsService.recordList(false, Date.now() - start);
      }

      return {
        success: false,
        error: 'Failed to list organizations',
        errorCode: 'ORG_LIST_ERROR',
      };
    }
  }

  /**
   * Update an organization
   */
  async update(
    id: string,
    input: UpdateOrganizationInput,
    actor: ActorContext,
    requestContext: RequestContext
  ): Promise<OrganizationOperationResult> {
    const start = Date.now();

    try {
      // Check if organization exists
      const existing = await organizationRepository.findById(id);

      if (!existing) {
        this.logOrgEvent('ORG_ACCESS_DENIED', {
          actor,
          organizationId: id,
          success: false,
          errorMessage: 'Organization not found',
          ...requestContext,
        });

        orgMetricsService.recordAccessDenied();
        orgMetricsService.recordUpdate(false, Date.now() - start);

        return {
          success: false,
          error: 'Organization not found',
          errorCode: 'ORG_NOT_FOUND',
        };
      }

      // Capture previous status before update (for audit logging)
      const previousStatus = existing.status;

      const organization = await organizationRepository.update(id, input);

      if (!organization) {
        orgMetricsService.recordUpdate(false, Date.now() - start);

        return {
          success: false,
          error: 'Failed to update organization',
          errorCode: 'ORG_UPDATE_ERROR',
        };
      }

      // Log status change separately if status changed
      if (input.status && input.status !== previousStatus) {
        this.logOrgEvent('ORG_STATUS_CHANGED', {
          actor,
          organizationId: id,
          organizationName: organization.name,
          success: true,
          metadata: {
            previousStatus,
            newStatus: input.status,
          },
          ...requestContext,
        });
      }

      this.logOrgEvent('ORG_UPDATED', {
        actor,
        organizationId: id,
        organizationName: organization.name,
        success: true,
        metadata: {
          updatedFields: Object.keys(input).filter((k) => k !== 'updatedBy'),
        },
        ...requestContext,
      });

      // Invalidate caches
      await this.invalidateOrgCache(id);
      await this.invalidateListCache();

      orgMetricsService.recordUpdate(true, Date.now() - start);

      return { success: true, data: organization };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logOrgEvent('ORG_UPDATED', {
        actor,
        organizationId: id,
        success: false,
        errorMessage,
        ...requestContext,
      });

      orgMetricsService.recordUpdate(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to update organization',
        errorCode: 'ORG_UPDATE_ERROR',
      };
    }
  }

  /**
   * Generate a list cache key based on filters and pagination
   */
  private getListCacheKey(
    filters: OrganizationFilters,
    pagination: OrganizationPaginationOptions
  ): string {
    const parts = ['org:list'];

    if (filters.status) parts.push(`status:${filters.status}`);
    if (filters.plan) parts.push(`plan:${filters.plan}`);
    if (pagination.limit) parts.push(`limit:${pagination.limit}`);
    if (pagination.offset) parts.push(`offset:${pagination.offset}`);
    if (pagination.cursor) parts.push(`cursor:${pagination.cursor}`);
    if (pagination.sortBy) parts.push(`sortBy:${pagination.sortBy}`);
    if (pagination.sortOrder) parts.push(`sortOrder:${pagination.sortOrder}`);

    return parts.join(':');
  }

  /**
   * Invalidate organization cache by ID
   */
  private async invalidateOrgCache(id: string): Promise<void> {
    try {
      await cacheDel(`org:${id}`);
    } catch (error) {
      console.warn('[OrgService] Failed to invalidate org cache:', error);
    }
  }

  /**
   * Invalidate list cache
   */
  private async invalidateListCache(): Promise<void> {
    try {
      // Simple invalidation - in production, use pattern-based invalidation
      // For now, we'll let TTL handle it
    } catch (error) {
      console.warn('[OrgService] Failed to invalidate list cache:', error);
    }
  }

  /**
   * Log organization audit event
   */
  private logOrgEvent(
    eventType: OrgAuditEventType,
    params: {
      actor?: ActorContext;
      organizationId?: string;
      organizationName?: string;
      success: boolean;
      errorMessage?: string;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
      channel: 'web' | 'mobile' | 'api';
    }
  ): void {
    auditService.log({
      eventType: eventType as AuditEventType,
      actorId: params.actor?.userId,
      actorType: params.actor?.userType,
      targetId: params.organizationId,
      targetType: 'organization',
      channel: params.channel,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        organizationName: params.organizationName,
        ...params.metadata,
      },
      success: params.success,
      errorMessage: params.errorMessage,
    });
  }
}

export const organizationService = new OrganizationService();
