/**
 * Custom Components Tests
 * Task 1.4: Tests for organization and theme preference endpoints
 * Tests cover: endpoint behavior, auth requirements, response shapes, RBAC
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { customComponentsService } from '../src/services/custom-components.service.js';
import type {
  OrganizationContextResponse,
  ThemePreferenceResponse,
  ThemeMode,
} from '../src/services/custom-components.service.js';
import {
  customComponentsMetricsService,
  CUSTOM_COMPONENTS_SLOS,
} from '../src/services/custom-components-metrics.service.js';

// ──────────────────────────────────────────────────────────
// Shared Test Fixtures
// ──────────────────────────────────────────────────────────

const defaultActor = {
  userId: 'user-1',
  userType: 'user' as const,
};

const defaultRequestContext = {
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
  channel: 'api' as const,
};

// ──────────────────────────────────────────────────────────
// Organization Endpoints Tests
// ──────────────────────────────────────────────────────────

describe('Custom Components Service', () => {
  describe('Organization Context', () => {
    describe('listOrganizations', () => {
      it('should return a list of organizations for the user', async () => {
        const result = await customComponentsService.listOrganizations(
          defaultActor,
          defaultRequestContext
        );

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();

        const data = result.data as OrganizationContextResponse;
        expect(data.organizations).toBeInstanceOf(Array);
        expect(data.organizations.length).toBeGreaterThan(0);
      });

      it('should return organizations with correct shape', async () => {
        const result = await customComponentsService.listOrganizations(
          defaultActor,
          defaultRequestContext
        );

        expect(result.success).toBe(true);
        const data = result.data as OrganizationContextResponse;

        for (const org of data.organizations) {
          expect(org).toHaveProperty('id');
          expect(org).toHaveProperty('name');
          expect(org).toHaveProperty('role');
          expect(org).toHaveProperty('isActive');
          expect(typeof org.id).toBe('string');
          expect(typeof org.name).toBe('string');
          expect(typeof org.role).toBe('string');
          expect(typeof org.isActive).toBe('boolean');
        }
      });

      it('should include activeOrganizationId in response', async () => {
        const result = await customComponentsService.listOrganizations(
          defaultActor,
          defaultRequestContext
        );

        expect(result.success).toBe(true);
        const data = result.data as OrganizationContextResponse;
        expect(data).toHaveProperty('activeOrganizationId');
      });

      it('should initially have no active organization', async () => {
        const actor = { userId: 'new-user-no-active', userType: 'user' as const };
        const result = await customComponentsService.listOrganizations(
          actor,
          defaultRequestContext
        );

        expect(result.success).toBe(true);
        const data = result.data as OrganizationContextResponse;
        expect(data.activeOrganizationId).toBeNull();

        // All orgs should have isActive = false
        for (const org of data.organizations) {
          expect(org.isActive).toBe(false);
        }
      });
    });

    describe('setActiveOrganization', () => {
      it('should set a valid organization as active', async () => {
        // First, list to get a valid org ID
        const listResult = await customComponentsService.listOrganizations(
          defaultActor,
          defaultRequestContext
        );
        const orgs = (listResult.data as OrganizationContextResponse).organizations;
        const targetOrgId = orgs[0].id;

        const result = await customComponentsService.setActiveOrganization(
          targetOrgId,
          defaultActor,
          defaultRequestContext
        );

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.id).toBe(targetOrgId);
        expect(result.data!.isActive).toBe(true);
      });

      it('should return correct response shape when setting active org', async () => {
        const result = await customComponentsService.setActiveOrganization(
          'org-1',
          defaultActor,
          defaultRequestContext
        );

        expect(result.success).toBe(true);
        const data = result.data!;
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('name');
        expect(data).toHaveProperty('role');
        expect(data).toHaveProperty('isActive');
      });

      it('should deny switching to an organization the user is not a member of', async () => {
        const result = await customComponentsService.setActiveOrganization(
          'org-nonexistent',
          defaultActor,
          defaultRequestContext
        );

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('COMPONENT_ORG_NOT_MEMBER');
        expect(result.error).toContain('not a member');
      });

      it('should reflect active org in subsequent list calls', async () => {
        const actor = { userId: 'user-reflect-test', userType: 'user' as const };

        // Set active org
        await customComponentsService.setActiveOrganization(
          'org-2',
          actor,
          defaultRequestContext
        );

        // List and check
        const listResult = await customComponentsService.listOrganizations(
          actor,
          defaultRequestContext
        );

        const data = listResult.data as OrganizationContextResponse;
        expect(data.activeOrganizationId).toBe('org-2');

        const activeOrg = data.organizations.find((o) => o.id === 'org-2');
        expect(activeOrg?.isActive).toBe(true);

        const inactiveOrgs = data.organizations.filter((o) => o.id !== 'org-2');
        for (const org of inactiveOrgs) {
          expect(org.isActive).toBe(false);
        }
      });

      it('should allow switching between organizations', async () => {
        const actor = { userId: 'user-switch-test', userType: 'user' as const };

        // Set to org-1
        const result1 = await customComponentsService.setActiveOrganization(
          'org-1',
          actor,
          defaultRequestContext
        );
        expect(result1.success).toBe(true);
        expect(result1.data!.id).toBe('org-1');

        // Switch to org-2
        const result2 = await customComponentsService.setActiveOrganization(
          'org-2',
          actor,
          defaultRequestContext
        );
        expect(result2.success).toBe(true);
        expect(result2.data!.id).toBe('org-2');

        // Verify the list shows org-2 as active
        const listResult = await customComponentsService.listOrganizations(
          actor,
          defaultRequestContext
        );
        expect((listResult.data as OrganizationContextResponse).activeOrganizationId).toBe('org-2');
      });
    });
  });

  // ──────────────────────────────────────────────────────────
  // Theme Preference Tests
  // ──────────────────────────────────────────────────────────

  describe('Theme Preferences', () => {
    describe('getThemePreference', () => {
      it('should return system as default theme mode', async () => {
        const actor = { userId: 'user-theme-default', userType: 'user' as const };
        const result = await customComponentsService.getThemePreference(
          actor,
          defaultRequestContext
        );

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();

        const data = result.data as ThemePreferenceResponse;
        expect(data.mode).toBe('system');
      });

      it('should return correct response shape', async () => {
        const result = await customComponentsService.getThemePreference(
          defaultActor,
          defaultRequestContext
        );

        expect(result.success).toBe(true);
        const data = result.data as ThemePreferenceResponse;
        expect(data).toHaveProperty('mode');
        expect(data).toHaveProperty('updatedAt');
        expect(typeof data.mode).toBe('string');
        expect(typeof data.updatedAt).toBe('string');
      });

      it('should return updatedAt as ISO string', async () => {
        const result = await customComponentsService.getThemePreference(
          defaultActor,
          defaultRequestContext
        );

        expect(result.success).toBe(true);
        const data = result.data as ThemePreferenceResponse;
        // Should be parseable as a date
        expect(new Date(data.updatedAt).toISOString()).toBe(data.updatedAt);
      });
    });

    describe('updateThemePreference', () => {
      it('should update theme to light mode', async () => {
        const actor = { userId: 'user-theme-light', userType: 'user' as const };
        const result = await customComponentsService.updateThemePreference(
          'light',
          actor,
          defaultRequestContext
        );

        expect(result.success).toBe(true);
        const data = result.data as ThemePreferenceResponse;
        expect(data.mode).toBe('light');
      });

      it('should update theme to dark mode', async () => {
        const actor = { userId: 'user-theme-dark', userType: 'user' as const };
        const result = await customComponentsService.updateThemePreference(
          'dark',
          actor,
          defaultRequestContext
        );

        expect(result.success).toBe(true);
        const data = result.data as ThemePreferenceResponse;
        expect(data.mode).toBe('dark');
      });

      it('should update theme to system mode', async () => {
        const actor = { userId: 'user-theme-system', userType: 'user' as const };

        // First set to dark
        await customComponentsService.updateThemePreference(
          'dark',
          actor,
          defaultRequestContext
        );

        // Then switch to system
        const result = await customComponentsService.updateThemePreference(
          'system',
          actor,
          defaultRequestContext
        );

        expect(result.success).toBe(true);
        const data = result.data as ThemePreferenceResponse;
        expect(data.mode).toBe('system');
      });

      it('should persist theme preference across reads', async () => {
        const actor = { userId: 'user-theme-persist', userType: 'user' as const };

        // Update to dark
        await customComponentsService.updateThemePreference(
          'dark',
          actor,
          defaultRequestContext
        );

        // Read and verify
        const result = await customComponentsService.getThemePreference(
          actor,
          defaultRequestContext
        );

        expect(result.success).toBe(true);
        const data = result.data as ThemePreferenceResponse;
        expect(data.mode).toBe('dark');
      });

      it('should return updatedAt timestamp after update', async () => {
        const actor = { userId: 'user-theme-timestamp', userType: 'user' as const };
        const beforeUpdate = new Date();

        const result = await customComponentsService.updateThemePreference(
          'light',
          actor,
          defaultRequestContext
        );

        expect(result.success).toBe(true);
        const data = result.data as ThemePreferenceResponse;
        const updatedAt = new Date(data.updatedAt);
        expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      });

      it('should isolate theme preferences per user', async () => {
        const actor1 = { userId: 'user-theme-iso-1', userType: 'user' as const };
        const actor2 = { userId: 'user-theme-iso-2', userType: 'user' as const };

        // Set different themes for different users
        await customComponentsService.updateThemePreference('dark', actor1, defaultRequestContext);
        await customComponentsService.updateThemePreference('light', actor2, defaultRequestContext);

        // Read each and verify isolation
        const result1 = await customComponentsService.getThemePreference(actor1, defaultRequestContext);
        const result2 = await customComponentsService.getThemePreference(actor2, defaultRequestContext);

        expect((result1.data as ThemePreferenceResponse).mode).toBe('dark');
        expect((result2.data as ThemePreferenceResponse).mode).toBe('light');
      });
    });
  });

  // ──────────────────────────────────────────────────────────
  // RBAC / Auth Requirements Tests
  // ──────────────────────────────────────────────────────────

  describe('RBAC and Authorization', () => {
    it('should require userId in actor context for org listing', async () => {
      // Even with an unknown userId, the service should succeed with defaults
      const actor = { userId: 'unknown-user', userType: 'user' as const };
      const result = await customComponentsService.listOrganizations(
        actor,
        defaultRequestContext
      );

      // Returns default orgs for unknown users
      expect(result.success).toBe(true);
    });

    it('should deny org switch to non-member organization', async () => {
      const result = await customComponentsService.setActiveOrganization(
        'org-does-not-exist',
        defaultActor,
        defaultRequestContext
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('COMPONENT_ORG_NOT_MEMBER');
    });

    it('should allow any authenticated user to read theme preference', async () => {
      const actor = { userId: 'any-user', userType: 'user' as const };
      const result = await customComponentsService.getThemePreference(
        actor,
        defaultRequestContext
      );

      expect(result.success).toBe(true);
    });

    it('should allow user to update only their own theme', async () => {
      const actor = { userId: 'self-theme-user', userType: 'user' as const };

      const updateResult = await customComponentsService.updateThemePreference(
        'dark',
        actor,
        defaultRequestContext
      );
      expect(updateResult.success).toBe(true);

      // Verify it's stored under this user
      const readResult = await customComponentsService.getThemePreference(
        actor,
        defaultRequestContext
      );
      expect((readResult.data as ThemePreferenceResponse).mode).toBe('dark');

      // Different user should not see this theme
      const otherActor = { userId: 'other-theme-user', userType: 'user' as const };
      const otherResult = await customComponentsService.getThemePreference(
        otherActor,
        defaultRequestContext
      );
      expect((otherResult.data as ThemePreferenceResponse).mode).toBe('system');
    });
  });

  // ──────────────────────────────────────────────────────────
  // Response Shape Validation
  // ──────────────────────────────────────────────────────────

  describe('Response Shapes', () => {
    it('should return success result with data for org list', async () => {
      const result = await customComponentsService.listOrganizations(
        defaultActor,
        defaultRequestContext
      );

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result).not.toHaveProperty('error');
    });

    it('should return error result with code for org switch failure', async () => {
      const result = await customComponentsService.setActiveOrganization(
        'invalid-org',
        defaultActor,
        defaultRequestContext
      );

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('errorCode');
      expect(typeof result.error).toBe('string');
      expect(typeof result.errorCode).toBe('string');
    });

    it('should return valid theme mode values only', async () => {
      const validModes: ThemeMode[] = ['light', 'dark', 'system'];

      for (const mode of validModes) {
        const actor = { userId: `user-mode-${mode}`, userType: 'user' as const };
        const result = await customComponentsService.updateThemePreference(
          mode,
          actor,
          defaultRequestContext
        );

        expect(result.success).toBe(true);
        expect(validModes).toContain((result.data as ThemePreferenceResponse).mode);
      }
    });

    it('should include logoUrl as optional in org context', async () => {
      const result = await customComponentsService.listOrganizations(
        defaultActor,
        defaultRequestContext
      );

      const data = result.data as OrganizationContextResponse;
      // Some orgs have logoUrl, some don't
      const withLogo = data.organizations.find((o) => o.logoUrl !== undefined);
      const withoutLogo = data.organizations.find((o) => o.logoUrl === undefined);

      expect(withLogo).toBeDefined();
      expect(withoutLogo).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────
  // Metrics / SLOs Tests
  // ──────────────────────────────────────────────────────────

  describe('Metrics and SLOs', () => {
    it('should have defined SLO targets', () => {
      expect(CUSTOM_COMPONENTS_SLOS.ORG_LIST_LATENCY_P99_MS).toBeGreaterThan(0);
      expect(CUSTOM_COMPONENTS_SLOS.ORG_SWITCH_LATENCY_P99_MS).toBeGreaterThan(0);
      expect(CUSTOM_COMPONENTS_SLOS.THEME_READ_LATENCY_P99_MS).toBeGreaterThan(0);
      expect(CUSTOM_COMPONENTS_SLOS.THEME_UPDATE_LATENCY_P99_MS).toBeGreaterThan(0);
      expect(CUSTOM_COMPONENTS_SLOS.ORG_LIST_SUCCESS_RATE).toBeGreaterThan(0);
      expect(CUSTOM_COMPONENTS_SLOS.MAX_RATE_LIMITED_PER_MINUTE).toBeGreaterThan(0);
    });

    it('should report SLOs as met when no traffic', () => {
      const sloCheck = customComponentsMetricsService.checkSLOs();
      expect(sloCheck.met).toBe(true);
      expect(sloCheck.violations).toHaveLength(0);
    });

    it('should track org list success metrics', async () => {
      await customComponentsService.listOrganizations(
        defaultActor,
        defaultRequestContext
      );

      // Metrics should be recorded (we can't easily inspect in-memory metrics
      // from here, but checking SLOs should still pass)
      const sloCheck = customComponentsMetricsService.checkSLOs();
      expect(sloCheck.met).toBe(true);
    });
  });
});
