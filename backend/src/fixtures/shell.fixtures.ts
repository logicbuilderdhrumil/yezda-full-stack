/**
 * Shell Configuration Fixtures
 * Mock data for shell configuration endpoints in development mode.
 */

export interface MockShellConfig {
  tenantId: string;
  branding: {
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    companyName: string;
  };
  navigation: {
    items: MockNavigationItem[];
  };
  features: {
    mfaRequired: boolean;
    selfRegistration: boolean;
    documentUpload: boolean;
    chatSupport: boolean;
  };
}

export interface MockNavigationItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  roles: string[];
  children?: MockNavigationItem[];
}

/**
 * Mock shell configurations for development
 */
export const mockShellConfigs: MockShellConfig[] = [
  {
    tenantId: 'mock-tenant-001',
    branding: {
      logoUrl: 'https://via.placeholder.com/150x50?text=MockLogo',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      companyName: 'Mock Screening Co.',
    },
    navigation: {
      items: [
        {
          id: 'nav-dashboard',
          label: 'Dashboard',
          path: '/dashboard',
          icon: 'home',
          roles: ['admin', 'manager', 'agent', 'viewer'],
        },
        {
          id: 'nav-screenings',
          label: 'Screenings',
          path: '/screenings',
          icon: 'search',
          roles: ['admin', 'manager', 'agent'],
          children: [
            {
              id: 'nav-screenings-active',
              label: 'Active',
              path: '/screenings/active',
              icon: 'clock',
              roles: ['admin', 'manager', 'agent'],
            },
            {
              id: 'nav-screenings-complete',
              label: 'Completed',
              path: '/screenings/complete',
              icon: 'check',
              roles: ['admin', 'manager', 'agent'],
            },
          ],
        },
        {
          id: 'nav-candidates',
          label: 'Candidates',
          path: '/candidates',
          icon: 'users',
          roles: ['admin', 'manager', 'agent'],
        },
        {
          id: 'nav-reports',
          label: 'Reports',
          path: '/reports',
          icon: 'chart',
          roles: ['admin', 'manager'],
        },
        {
          id: 'nav-settings',
          label: 'Settings',
          path: '/settings',
          icon: 'cog',
          roles: ['admin'],
        },
      ],
    },
    features: {
      mfaRequired: false,
      selfRegistration: true,
      documentUpload: true,
      chatSupport: true,
    },
  },
];

/**
 * Find mock shell config by tenant
 */
export function findMockShellConfigByTenant(tenantId: string): MockShellConfig | undefined {
  return mockShellConfigs.find((c) => c.tenantId === tenantId);
}

/**
 * Get navigation items for a user based on roles
 */
export function getMockNavigationForRoles(
  tenantId: string,
  roles: string[]
): MockNavigationItem[] {
  const config = findMockShellConfigByTenant(tenantId);
  if (!config) return [];

  const filterByRoles = (items: MockNavigationItem[]): MockNavigationItem[] => {
    return items
      .filter((item) => item.roles.some((r) => roles.includes(r)))
      .map((item) => ({
        ...item,
        children: item.children ? filterByRoles(item.children) : undefined,
      }));
  };

  return filterByRoles(config.navigation.items);
}
