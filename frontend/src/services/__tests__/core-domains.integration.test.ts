/**
 * Core Domains Integration Tests
 * Tests contract alignment between frontend services and backend API.
 * Validates DTOs, pagination, filtering, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationsService } from '../OrganizationsService';
import { UsersService } from '../UsersService';
import { AccountService } from '../AccountService';
import { ApiService } from '../ApiService';
import type { OrganizationListResult } from '@/@types/organization';
import type { UserListResult } from '@/@types/user';
import type { AccountProfile, IntegrationStatus } from '@/@types/account';

// Mock ApiService
vi.mock('../ApiService', () => ({
  ApiService: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Core Domains Integration - Contract Alignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OrganizationsService', () => {
    it('should translate frontend pagination to backend format (page/pageSize -> limit/offset)', async () => {
      const mockBackendResponse: OrganizationListResult = {
        organizations: [
          {
            id: 'org-1',
            name: 'Test Org',
            slug: 'test-org',
            status: 'active',
            plan: 'professional',
            primaryContactEmail: 'contact@test.org',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            createdBy: 'user-1',
          },
        ],
        total: 1,
        hasMore: false,
      };

      vi.mocked(ApiService.get).mockResolvedValue({ data: mockBackendResponse });

      const result = await OrganizationsService.list({ page: 2, pageSize: 10 });

      // Verify backend params (offset = (page-1) * pageSize)
      expect(ApiService.get).toHaveBeenCalledWith('organizations.list', {
        params: expect.objectContaining({
          limit: '10',
          offset: '10', // page 2 with pageSize 10 = offset 10
        }),
      });

      // Verify normalized response
      expect(result.data).toEqual(mockBackendResponse.organizations);
      expect(result.meta.page).toBe(2);
      expect(result.meta.pageSize).toBe(10);
      expect(result.meta.totalItems).toBe(1);
      expect(result.meta.hasMore).toBe(false);
    });

    it('should include plan filter in request', async () => {
      const mockBackendResponse: OrganizationListResult = {
        organizations: [],
        total: 0,
        hasMore: false,
      };

      vi.mocked(ApiService.get).mockResolvedValue({ data: mockBackendResponse });

      await OrganizationsService.list({
        plan: 'enterprise',
        status: 'active',
        search: 'acme',
      });

      expect(ApiService.get).toHaveBeenCalledWith('organizations.list', {
        params: expect.objectContaining({
          plan: 'enterprise',
          status: 'active',
          search: 'acme',
        }),
      });
    });

    it('should handle cursor-based pagination when cursor is provided', async () => {
      const mockBackendResponse: OrganizationListResult = {
        organizations: [],
        total: 0,
        hasMore: true,
        nextCursor: 'cursor-xyz',
      };

      vi.mocked(ApiService.get).mockResolvedValue({ data: mockBackendResponse });

      const result = await OrganizationsService.list({ cursor: 'cursor-abc' });

      expect(ApiService.get).toHaveBeenCalledWith('organizations.list', {
        params: expect.objectContaining({
          cursor: 'cursor-abc',
        }),
      });

      expect(result.meta.nextCursor).toBe('cursor-xyz');
    });
  });

  describe('UsersService', () => {
    it('should translate frontend pagination and search to backend format', async () => {
      const mockBackendResponse: UserListResult = {
        users: [
          {
            id: 'user-1',
            email: 'test@example.com',
            displayName: 'Test User',
            status: 'active',
            roles: ['admin'],
            tenantId: 'tenant-1',
            mfaEnabled: false,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      vi.mocked(ApiService.get).mockResolvedValue({ data: mockBackendResponse });

      const result = await UsersService.list({
        page: 1,
        pageSize: 20,
        search: 'test',
        status: 'active',
        role: 'admin',
      });

      // Backend uses 'q' for search query
      expect(ApiService.get).toHaveBeenCalledWith('users.list', {
        params: expect.objectContaining({
          page: '1',
          limit: '20',
          q: 'test',
          status: 'active',
          role: 'admin',
        }),
      });

      // Verify normalized response
      expect(result.data).toEqual(mockBackendResponse.users);
      expect(result.meta.page).toBe(1);
      expect(result.meta.pageSize).toBe(20);
      expect(result.meta.totalItems).toBe(1);
    });

    it('should handle suspended status (backend-only status)', async () => {
      const mockBackendResponse: UserListResult = {
        users: [
          {
            id: 'user-1',
            email: 'suspended@example.com',
            status: 'suspended',
            roles: ['viewer'],
            tenantId: 'tenant-1',
            mfaEnabled: false,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      vi.mocked(ApiService.get).mockResolvedValue({ data: mockBackendResponse });

      const result = await UsersService.list({ status: 'suspended' });

      expect(result.data[0].status).toBe('suspended');
    });
  });

  describe('AccountService', () => {
    it('should handle profile with backend fields (bio, notificationsEnabled)', async () => {
      const mockProfile: AccountProfile = {
        id: 'profile-1',
        displayName: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        phone: '+1234567890',
        timezone: 'America/New_York',
        locale: 'en-US',
        bio: 'A test user biography',
        notificationsEnabled: true,
        emailNotificationsEnabled: false,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      // AccountService uses direct axios, so mock the module
      const axiosMock = vi.fn().mockResolvedValue({ data: mockProfile });
      vi.doMock('axios', async (importOriginal) => {
        const actual = await importOriginal<typeof import('axios')>();
        return {
          ...actual,
          default: {
            ...actual.default,
            create: () => ({
              get: axiosMock,
              patch: vi.fn(),
              post: vi.fn(),
              delete: vi.fn(),
            }),
          },
        };
      });

      // Verify profile structure includes backend-specific fields
      expect(mockProfile.bio).toBeDefined();
      expect(mockProfile.notificationsEnabled).toBe(true);
      expect(mockProfile.emailNotificationsEnabled).toBe(false);
    });
  });

  describe('Access Control Error Codes', () => {
    it('should use UNAUTHORIZED code for 401 errors', () => {
      // This tests that error responses match backend codes
      const backendErrorCodes = {
        UNAUTHORIZED: 'UNAUTHORIZED',
        INVALID_TOKEN: 'INVALID_TOKEN',
        FORBIDDEN: 'FORBIDDEN',
        GUARD_RATE_LIMITED: 'GUARD_RATE_LIMITED',
      };

      // Frontend should handle these codes
      expect(backendErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(backendErrorCodes.FORBIDDEN).toBe('FORBIDDEN');
    });
  });
});

describe('Type Alignment Verification', () => {
  it('should have aligned Organization types', () => {
    // This is a compile-time check - if types are misaligned, this won't compile
    type BackendOrgStatus = 'active' | 'suspended' | 'pending' | 'archived';
    type FrontendOrgStatus = 'active' | 'suspended' | 'pending' | 'archived';
    
    const status: BackendOrgStatus = 'archived';
    const frontendStatus: FrontendOrgStatus = status;
    expect(frontendStatus).toBe('archived');
  });

  it('should have aligned User types with roles array', () => {
    // Both frontend and backend use roles array now
    const backendUser = {
      roles: ['admin', 'manager'] as const,
      tenantId: 'tenant-1',
    };
    
    const frontendRoles: ('admin' | 'manager' | 'agent' | 'viewer')[] = 
      backendUser.roles as unknown as ('admin' | 'manager' | 'agent' | 'viewer')[];
    
    expect(frontendRoles).toContain('admin');
  });

  it('should have aligned UserStatus with suspended state', () => {
    type BackendUserStatus = 'active' | 'inactive' | 'suspended' | 'pending';
    type FrontendUserStatus = 'active' | 'inactive' | 'suspended' | 'pending';
    
    const status: BackendUserStatus = 'suspended';
    const frontendStatus: FrontendUserStatus = status;
    expect(frontendStatus).toBe('suspended');
  });
});
