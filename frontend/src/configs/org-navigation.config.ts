/**
 * Organization-context navigation configuration.
 * Generates sidebar items for when a user is viewing a specific organization.
 */

import type { NavConfig } from '@/@types/navigation';

/**
 * Builds the org-context navigation config for a given organization.
 * @param orgId - The organization ID from route params
 * @returns NavConfig scoped to the org context
 */
export function buildOrgNavConfig(orgId: string): NavConfig {
  const basePath = `/admin/organizations/${orgId}`;

  return {
    sections: [
      {
        items: [
          {
            id: 'org-back',
            label: 'Back to Organizations',
            path: '/admin/organizations',
            icon: 'arrow-left',
            authorities: [],
          },
        ],
      },
      {
        title: 'Organization',
        items: [
          {
            id: 'org-candidates',
            label: 'Candidates',
            path: `${basePath}/candidates`,
            icon: 'users',
            authorities: ['admin', 'manager'],
          },
          {
            id: 'org-screening',
            label: 'Screening',
            path: `${basePath}/screening`,
            icon: 'file-text',
            authorities: ['admin', 'manager'],
          },
          {
            id: 'org-files',
            label: 'Files',
            path: `${basePath}/files`,
            icon: 'folder',
            authorities: ['admin'],
          },
          {
            id: 'org-users',
            label: 'Users',
            path: `${basePath}/users`,
            icon: 'users',
            authorities: ['admin'],
          },
        ],
      },
    ],
  };
}
