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
  ArrowLeft,
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
  'arrow-left': ArrowLeft,
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
        {
          id: 'files',
          label: 'Files',
          path: '/files',
          icon: 'folder',
          authorities: ['admin'],
        },
        {
          id: 'users',
          label: 'Users',
          path: '/users',
          icon: 'shield',
          authorities: ['admin'],
        },
        {
          id: 'forms',
          label: 'Forms',
          path: '/forms',
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
          path: '/reports',
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
          path: '/chat',
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
          path: '/ledger/billed',
          icon: 'credit-card',
          authorities: ['admin'],
        },
        {
          id: 'ledger-unbilled',
          label: 'Unbilled Ledger',
          path: '/ledger/unbilled',
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
          path: '/settings',
          icon: 'settings',
          authorities: [],
        },
      ],
    },
  ],
};
