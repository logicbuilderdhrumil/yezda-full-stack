/**
 * Navigation configuration and icon mapping.
 */

import {
  Home,
  Users,
  Building,
  FileText,
  Settings,
  Shield,
  CreditCard,
  BarChart,
  MessageCircle,
  Bell,
  Folder,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import type { NavIconName, NavConfig } from '@/@types/navigation';

/**
 * Map of icon names to Lucide icon components.
 */
export const iconMap: Record<NavIconName, LucideIcon> = {
  home: Home,
  users: Users,
  building: Building,
  'file-text': FileText,
  settings: Settings,
  shield: Shield,
  'credit-card': CreditCard,
  'bar-chart': BarChart,
  'message-circle': MessageCircle,
  bell: Bell,
  folder: Folder,
  calendar: Calendar,
};

/**
 * Default navigation configuration.
 * Items are organized into logical sections.
 * Empty authorities array means all authenticated roles can access.
 */
export const navConfig: NavConfig = {
  sections: [
    {
      items: [
        {
          id: 'home',
          label: 'Home',
          path: '/',
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
          path: '/candidates',
          icon: 'users',
          authorities: ['admin', 'manager'],
        },
        {
          id: 'organizations',
          label: 'Organizations',
          path: '/organizations',
          icon: 'building',
          authorities: ['admin'],
        },
        {
          id: 'screening',
          label: 'Screening',
          path: '/screening',
          icon: 'file-text',
          authorities: ['admin', 'manager'],
        },
      ],
    },
    {
      title: 'Analytics',
      items: [
        {
          id: 'reports',
          label: 'Reports',
          path: '/reports',
          icon: 'bar-chart',
          authorities: ['admin', 'manager'],
        },
      ],
    },
    {
      title: 'System',
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
