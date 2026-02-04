/**
 * User profile dropdown menu for header.
 * Displays user info and provides account-related actions.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/utils';

export interface UserProfileDropdownProps {
  /** Additional CSS classes. */
  className?: string;
}

/**
 * UserProfileDropdown displays the current user's info and provides
 * links to profile, settings, and sign out actions.
 */
export function UserProfileDropdown({ className }: UserProfileDropdownProps): ReactNode {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 rounded-full p-1 text-gray-500 hover:bg-gray-100',
            'dark:text-gray-400 dark:hover:bg-gray-800',
            className
          )}
          aria-label={t('common.userMenu')}
          data-testid="user-profile-dropdown-trigger"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
            {initials}
          </div>
          <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-300">
            {user.firstName}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs leading-none text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            <span>{t('nav.profile')}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
            <Settings className="h-4 w-4" />
            <span>{t('nav.settings')}</span>
          </Link>
        </DropdownMenuItem>
        {user.role === 'admin' && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
              <Shield className="h-4 w-4" />
              <span>{t('nav.admin')}</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400"
          destructive
        >
          <LogOut className="h-4 w-4" />
          <span>{t('common.signOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
