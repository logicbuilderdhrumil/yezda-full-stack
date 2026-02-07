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
          authorities: ['admin'],
        },
        {
          id: 'screening',
          label: 'Screening',
          path: '/admin/screening',
          icon: 'file-text',
          authorities: ['admin', 'manager'],
        },
        {
          id: 'pipelines',
          label: 'Pipelines',
          path: '/admin/pipelines',
          icon: 'shield',
          authorities: ['admin'],
          children: [
            {
              id: 'forms',
              label: 'Forms',
              path: '/admin/forms',
              icon: 'file-text',
              authorities: ['admin'],
            },
          ],
        },
        {
          id: 'users',
          label: 'Users',
          path: '/admin/users',
          icon: 'users',
          authorities: ['admin'],
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
          authorities: ['admin', 'manager'],
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
          authorities: ['admin', 'manager'],
        },
        {
          id: 'ledger',
          label: 'Ledger',
          path: '/admin/ledger',
          icon: 'credit-card',
          authorities: ['admin'],
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
