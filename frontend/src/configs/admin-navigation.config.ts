/**
 * Admin navigation configuration.
 * All paths are prefixed with /admin for the SAAS staff area.
 *
 * Candidates and Files are accessed within org context only.
 * Forms is a child of Pipelines.
 * Ledger is a single combined view (Billed/Unbilled tabs).
 */

import type { NavConfig } from '@/@types/navigation';

/**
 * Admin area navigation configuration.
 * Items are organized into logical sections.
 * Empty authorities array means all authenticated roles can access.
 */
export const adminNavConfig: NavConfig = {
  sections: [
    {
      items: [
        {
          id: 'home',
          label: 'Home',
          path: '/admin',
          icon: 'home',
          authorities: [],
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          id: 'organizations',
          label: 'Organizations',
          path: '/admin/organizations',
          icon: 'building',
          authorities: ['platform_admin'],
        },
        {
          id: 'screening',
          label: 'Screening',
          path: '/admin/screening',
          icon: 'file-text',
          authorities: ['platform_admin', 'platform_manager'],
        },
        {
          id: 'pipelines',
          label: 'Pipelines',
          path: '/admin/pipelines',
          icon: 'shield',
          authorities: ['platform_admin'],
          children: [
            {
              id: 'pipeline-builder',
              label: 'Builder',
              path: '/admin/pipelines/builder',
              icon: 'workflow',
              authorities: ['platform_admin'],
            },
            {
              id: 'forms',
              label: 'Forms',
              path: '/admin/forms',
              icon: 'file-text',
              authorities: ['platform_admin'],
            },
          ],
        },
        {
          id: 'reviews',
          label: 'Reviews',
          path: '/admin/reviews',
          icon: 'clipboard-check',
          authorities: ['platform_admin', 'platform_manager'],
        },
        {
          id: 'users',
          label: 'Users',
          path: '/admin/users',
          icon: 'users',
          authorities: ['platform_admin'],
        },
      ],
    },
    {
      title: 'Communication',
      items: [
        {
          id: 'chat',
          label: 'Chat',
          path: '/admin/chat',
          icon: 'message-circle',
          authorities: ['platform_admin', 'platform_manager'],
        },
      ],
    },
    {
      title: 'Billing and Analytics',
      items: [
        {
          id: 'reports',
          label: 'Reports',
          path: '/admin/reports',
          icon: 'bar-chart',
          authorities: ['platform_admin', 'platform_manager'],
        },
        {
          id: 'ledger',
          label: 'Ledger',
          path: '/admin/ledger',
          icon: 'credit-card',
          authorities: ['platform_admin'],
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          path: '/admin/settings',
          icon: 'settings',
          authorities: [],
        },
      ],
    },
  ],
};
