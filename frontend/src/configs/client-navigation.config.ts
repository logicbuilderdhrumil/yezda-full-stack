/**
 * Client navigation configuration.
 * All paths are for the client portal (/) for screening clients and org staff.
 */

import type { NavConfig } from '@/@types/navigation';

/**
 * Client portal navigation configuration.
 * Items are organized into logical sections.
 * Empty authorities array means all authenticated roles can access.
 */
export const clientNavConfig: NavConfig = {
  sections: [
    {
      title: 'Overview',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          path: '/',
          icon: 'home',
          authorities: [],
        },
      ],
    },
    {
      title: 'Screening',
      items: [
        {
          id: 'candidates',
          label: 'Candidates',
          path: '/candidates',
          icon: 'users',
          authorities: [],
        },
        {
          id: 'screening',
          label: 'Pipeline',
          path: '/screening',
          icon: 'shield',
          authorities: [],
        },
      ],
    },
    {
      title: 'Insights',
      items: [
        {
          id: 'reports',
          label: 'Reports',
          path: '/reports',
          icon: 'bar-chart',
          authorities: [],
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          path: '/settings',
          icon: 'settings',
          authorities: [],
        },
      ],
    },
  ],
};
