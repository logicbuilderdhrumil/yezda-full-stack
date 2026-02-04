/**
 * Application header with branding, actions, and mobile nav toggle.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { LanguageSelector } from '@/components/ui';
import {
  UserProfileDropdown,
  NotificationDropdown,
  ThemeConfigurator,
  GlobalSearchInput,
} from '@/components/template';
import { cn } from '@/utils';

interface HeaderProps {
  /** Additional CSS classes. */
  className?: string;
  /** Whether to show the global search input. */
  showSearch?: boolean;
}

/**
 * Header component with app branding and user actions.
 */
export function Header({ className, showSearch = true }: HeaderProps): ReactNode {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toggleMobile, toggleCollapsed, isCollapsed } = useSidebar();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900',
        className
      )}
      data-testid="header"
    >
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={toggleMobile}
          className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label={t('common.toggleMobileMenu')}
          data-testid="mobile-menu-toggle"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden lg:flex p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label={isCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
          data-testid="sidebar-toggle"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo/Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100"
          data-testid="header-logo"
        >
          <span className="text-xl">{t('app.name')}</span>
        </Link>
      </div>

      {/* Center: Global Search (optional) */}
      {showSearch && (
        <div className="hidden md:flex flex-1 justify-center px-4">
          <GlobalSearchInput />
        </div>
      )}

      <div className="flex items-center gap-1">
        {/* Global search on mobile (icon only would be an enhancement) */}
        
        {/* Notification dropdown */}
        {user && <NotificationDropdown />}

        {/* Language selector */}
        <LanguageSelector />

        {/* Theme configurator */}
        <ThemeConfigurator />

        {/* User profile dropdown */}
        {user && <UserProfileDropdown />}
      </div>
    </header>
  );
}
