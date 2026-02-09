/**
 * Custom Components Service
 * Task 1.1, 1.2, 1.3: Organization context and theme preference operations
 * Task 1.5: RBAC enforcement - membership validation
 * Task 1.6: Audit logging for org context changes and theme updates
 * Task 1.8: SLO metrics
 */

import { auditService } from './audit.service.js';
import { customComponentsMetricsService } from './custom-components-metrics.service.js';
import type { AuditEventType } from '../models/audit.model.js';

// ──────────────────────────────────────────────────────────
// Type Definitions (Task 1.1)
// ──────────────────────────────────────────────────────────

/** User role within an organization */
export type OrgRole = 'owner' | 'admin' | 'manager' | 'agent' | 'viewer';

/** Theme mode preference */
export type ThemeMode = 'light' | 'dark' | 'system';

/** Organization context item returned to the client */
export interface OrganizationContextItem {
  id: string;
  name: string;
  logoUrl?: string;
  role: OrgRole;
  isActive: boolean;
}

/** Response for organization listing */
export interface OrganizationContextResponse {
  organizations: OrganizationContextItem[];
  activeOrganizationId: string | null;
}

/** Theme preference response */
export interface ThemePreferenceResponse {
  mode: ThemeMode;
  updatedAt: string;
}

/** Operation result wrapper */
export interface CustomComponentsResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

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

// ──────────────────────────────────────────────────────────
// Mock Data Store
// ──────────────────────────────────────────────────────────

/** In-memory org membership store: userId -> OrgMembership[] */
interface OrgMembership {
  orgId: string;
  orgName: string;
  logoUrl?: string;
  role: OrgRole;
}

const userOrgMemberships = new Map<string, OrgMembership[]>();
const activeOrganizations = new Map<string, string>(); // userId -> orgId
const themePreferences = new Map<string, { mode: ThemeMode; updatedAt: Date }>();

// Seed mock data
function seedMockData(): void {
  // Default organizations for any authenticated user
  const defaultOrgs: OrgMembership[] = [
    { orgId: 'org-1', orgName: 'Acme Corporation', logoUrl: 'https://example.com/acme-logo.png', role: 'admin' },
    { orgId: 'org-2', orgName: 'Globex Industries', logoUrl: 'https://example.com/globex-logo.png', role: 'viewer' },
    { orgId: 'org-3', orgName: 'Initech', role: 'manager' },
  ];

  userOrgMemberships.set('__default__', defaultOrgs);
}

seedMockData();

/**
 * Get the org memberships for a user, falling back to defaults
 */
function getOrgMemberships(userId: string): OrgMembership[] {
  return userOrgMemberships.get(userId) ?? userOrgMemberships.get('__default__') ?? [];
}

// ──────────────────────────────────────────────────────────
// Custom Components Audit Event Types
// ──────────────────────────────────────────────────────────

type CustomComponentsAuditEvent =
  | 'COMPONENT_ORG_LISTED'
  | 'COMPONENT_ORG_SWITCHED'
  | 'COMPONENT_ORG_SWITCH_DENIED'
  | 'COMPONENT_THEME_READ'
  | 'COMPONENT_THEME_UPDATED';

// ──────────────────────────────────────────────────────────
// Service Implementation
// ──────────────────────────────────────────────────────────

export class CustomComponentsService {
  /**
   * List organizations the user belongs to
   * Task 1.2: Organization selection endpoints
   */
  async listOrganizations(
    actor: ActorContext,
    requestContext: RequestContext
  ): Promise<CustomComponentsResult<OrganizationContextResponse>> {
    const start = Date.now();

    try {
      const memberships = getOrgMemberships(actor.userId);
      const activeOrgId = activeOrganizations.get(actor.userId) ?? null;

      const organizations: OrganizationContextItem[] = memberships.map((m) => ({
        id: m.orgId,
        name: m.orgName,
        logoUrl: m.logoUrl,
        role: m.role,
        isActive: m.orgId === activeOrgId,
      }));

      const response: OrganizationContextResponse = {
        organizations,
        activeOrganizationId: activeOrgId,
      };

      this.logEvent('COMPONENT_ORG_LISTED', {
        actor,
        success: true,
        metadata: { count: organizations.length },
        ...requestContext,
      });

      customComponentsMetricsService.recordOrgList(true, Date.now() - start);

      return { success: true, data: response };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logEvent('COMPONENT_ORG_LISTED', {
        actor,
        success: false,
        errorMessage,
        ...requestContext,
      });

      customComponentsMetricsService.recordOrgList(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to list organizations',
        errorCode: 'COMPONENT_ORG_LIST_ERROR',
      };
    }
  }

  /**
   * Set the active organization context
   * Task 1.2: Organization selection endpoints
   * Task 1.5: RBAC - user must be member of target org
   */
  async setActiveOrganization(
    organizationId: string,
    actor: ActorContext,
    requestContext: RequestContext
  ): Promise<CustomComponentsResult<OrganizationContextItem>> {
    const start = Date.now();

    try {
      const memberships = getOrgMemberships(actor.userId);
      const membership = memberships.find((m) => m.orgId === organizationId);

      // Task 1.5: Verify user is a member of the target organization
      if (!membership) {
        this.logEvent('COMPONENT_ORG_SWITCH_DENIED', {
          actor,
          targetId: organizationId,
          success: false,
          errorMessage: 'User is not a member of the target organization',
          ...requestContext,
        });

        customComponentsMetricsService.recordOrgSwitch(false, Date.now() - start);

        return {
          success: false,
          error: 'You are not a member of this organization',
          errorCode: 'COMPONENT_ORG_NOT_MEMBER',
        };
      }

      const previousOrgId = activeOrganizations.get(actor.userId);
      activeOrganizations.set(actor.userId, organizationId);

      const activeOrg: OrganizationContextItem = {
        id: membership.orgId,
        name: membership.orgName,
        logoUrl: membership.logoUrl,
        role: membership.role,
        isActive: true,
      };

      // Task 1.6: Audit log the org context switch
      this.logEvent('COMPONENT_ORG_SWITCHED', {
        actor,
        targetId: organizationId,
        success: true,
        metadata: {
          previousOrganizationId: previousOrgId ?? null,
          newOrganizationId: organizationId,
          organizationName: membership.orgName,
        },
        ...requestContext,
      });

      customComponentsMetricsService.recordOrgSwitch(true, Date.now() - start);

      return { success: true, data: activeOrg };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logEvent('COMPONENT_ORG_SWITCHED', {
        actor,
        targetId: organizationId,
        success: false,
        errorMessage,
        ...requestContext,
      });

      customComponentsMetricsService.recordOrgSwitch(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to set active organization',
        errorCode: 'COMPONENT_ORG_SWITCH_ERROR',
      };
    }
  }

  /**
   * Get user's theme preference
   * Task 1.3: Theme preference endpoints
   */
  async getThemePreference(
    actor: ActorContext,
    requestContext: RequestContext
  ): Promise<CustomComponentsResult<ThemePreferenceResponse>> {
    const start = Date.now();

    try {
      const preference = themePreferences.get(actor.userId);

      const response: ThemePreferenceResponse = {
        mode: preference?.mode ?? 'system',
        updatedAt: preference?.updatedAt?.toISOString() ?? new Date().toISOString(),
      };

      this.logEvent('COMPONENT_THEME_READ', {
        actor,
        success: true,
        metadata: { mode: response.mode },
        ...requestContext,
      });

      customComponentsMetricsService.recordThemeRead(true, Date.now() - start);

      return { success: true, data: response };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logEvent('COMPONENT_THEME_READ', {
        actor,
        success: false,
        errorMessage,
        ...requestContext,
      });

      customComponentsMetricsService.recordThemeRead(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to get theme preference',
        errorCode: 'COMPONENT_THEME_READ_ERROR',
      };
    }
  }

  /**
   * Update user's theme preference
   * Task 1.3: Theme preference endpoints
   * Task 1.5: RBAC - only the user can update their own preference
   * Task 1.6: Audit log theme updates
   */
  async updateThemePreference(
    mode: ThemeMode,
    actor: ActorContext,
    requestContext: RequestContext
  ): Promise<CustomComponentsResult<ThemePreferenceResponse>> {
    const start = Date.now();

    try {
      const previousPreference = themePreferences.get(actor.userId);
      const previousMode = previousPreference?.mode ?? 'system';

      const now = new Date();
      themePreferences.set(actor.userId, { mode, updatedAt: now });

      const response: ThemePreferenceResponse = {
        mode,
        updatedAt: now.toISOString(),
      };

      // Task 1.6: Audit log theme update
      this.logEvent('COMPONENT_THEME_UPDATED', {
        actor,
        success: true,
        metadata: {
          previousMode,
          newMode: mode,
        },
        ...requestContext,
      });

      customComponentsMetricsService.recordThemeUpdate(true, Date.now() - start);

      return { success: true, data: response };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logEvent('COMPONENT_THEME_UPDATED', {
        actor,
        success: false,
        errorMessage,
        ...requestContext,
      });

      customComponentsMetricsService.recordThemeUpdate(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to update theme preference',
        errorCode: 'COMPONENT_THEME_UPDATE_ERROR',
      };
    }
  }

  /**
   * Log a custom components audit event
   * Task 1.6: Audit logging
   */
  private logEvent(
    eventType: CustomComponentsAuditEvent,
    params: {
      actor?: ActorContext;
      targetId?: string;
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
      targetId: params.targetId,
      targetType: 'component',
      channel: params.channel,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
      success: params.success,
      errorMessage: params.errorMessage,
    });
  }
}

export const customComponentsService = new CustomComponentsService();
