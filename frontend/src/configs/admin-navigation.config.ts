/**
 * Admin navigation configuration.
 * All paths are prefixed with /admin for the SAAS staff area.
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
          id: 'candidates',
          label: 'Candidates',
          path: '/admin/candidates',
          icon: 'users',
          authorities: ['admin', 'manager'],
        },
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
        },
        {
          id: 'files',
          label: 'Files',
          path: '/admin/files',
          icon: 'folder',
          authorities: ['admin'],
        },
        {
          id: 'users',
          label: 'Users',
          path: '/admin/users',
          icon: 'shield',
          authorities: ['admin'],
        },
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
      title: 'Analytics',
      items: [
        {
          id: 'reports',
          label: 'Reports',
          path: '/admin/reports',
          icon: 'bar-chart',
          authorities: ['admin', 'manager'],
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
      title: 'Billing',
      items: [
        {
          id: 'ledger-billed',
          label: 'Billed Ledger',
          path: '/admin/ledger/billed',
          icon: 'credit-card',
          authorities: ['admin'],
        },
        {
          id: 'ledger-unbilled',
          label: 'Unbilled Ledger',
          path: '/admin/ledger/unbilled',
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
