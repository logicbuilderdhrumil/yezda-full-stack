/**
 * Application header with branding, actions, and mobile nav toggle.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { useThemeStore, selectResolvedTheme } from '@/store/themeStore';
import { LanguageSelector } from '@/components/ui';
import { cn } from '@/utils';

interface HeaderProps {
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Header component with app branding and user actions.
 */
export function Header({ className }: HeaderProps): ReactNode {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { toggleMobile, toggleCollapsed, isCollapsed } = useSidebar();
  const resolvedTheme = useThemeStore(selectResolvedTheme);
  const toggleTheme = useThemeStore((state) => state.toggle);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={toggleMobile}
          className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label={t('common.toggleMobileMenu')}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden lg:flex p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label={isCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo/Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100"
        >
          <span className="text-xl">{t('app.name')}</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {/* Language selector */}
        <LanguageSelector />

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label={
            resolvedTheme === 'dark'
              ? t('common.switchToLight')
              : t('common.switchToDark')
          }
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* User info and sign out */}
        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-300">
              {user.firstName} {user.lastName}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label={t('common.signOut')}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
