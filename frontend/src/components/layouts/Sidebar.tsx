/**
 * Sidebar navigation component with role-based filtering.
 */

import { useMemo, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { navConfig, iconMap } from '@/configs';
import type { NavItem, NavSection } from '@/@types/navigation';
import type { UserRole } from '@/@types/auth';
import { cn } from '@/utils';

/**
 * Filter navigation items based on user authorities.
 */
function filterByAuthority(
  items: NavItem[],
  userRole: UserRole | undefined
): NavItem[] {
  return items.filter((item) => {
    // Empty authorities means all authenticated users can access
    if (item.authorities.length === 0) return true;
    // Check if user role is in allowed authorities
    return userRole && item.authorities.includes(userRole);
  });
}

/**
 * Filter sections and their items based on user role.
 */
function filterNavConfig(
  sections: NavSection[],
  userRole: UserRole | undefined
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: filterByAuthority(section.items, userRole),
    }))
    .filter((section) => section.items.length > 0);
}

interface NavItemButtonProps {
  item: NavItem;
  isCollapsed: boolean;
}

function NavItemButton({ item, isCollapsed }: NavItemButtonProps): ReactNode {
  const Icon = iconMap[item.icon];

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          isActive
            ? 'bg-primary/10 text-primary dark:bg-primary/20'
            : 'text-gray-700 dark:text-gray-300',
          isCollapsed && 'justify-center px-2'
        )
      }
      title={isCollapsed ? item.label : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

interface SidebarProps {
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Sidebar component with navigation items filtered by user role.
 */
export function Sidebar({ className }: SidebarProps): ReactNode {
  const { user } = useAuth();
  const { isCollapsed, isMobileOpen, closeMobile, toggleCollapsed } =
    useSidebar();

  // Filter navigation based on user role
  const filteredSections = useMemo(
    () => filterNavConfig(navConfig.sections, user?.role),
    [user?.role]
  );

  // Close mobile sidebar on navigation
  const handleNavClick = () => {
    if (isMobileOpen) {
      closeMobile();
    }
  };

  const sidebarContent = (
    <nav className="flex flex-col h-full" onClick={handleNavClick}>
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {filteredSections.map((section, index) => (
          <div key={section.title || index} className="mb-4">
            {section.title && !isCollapsed && (
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.id}>
                  <NavItemButton item={item} isCollapsed={isCollapsed} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Collapse toggle for desktop */}
      <div className="hidden lg:flex border-t border-gray-200 dark:border-gray-800 p-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            'flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
            isCollapsed && 'justify-center'
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={cn(
              'h-4 w-4 transition-transform',
              isCollapsed && 'rotate-180'
            )}
          />
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition-transform duration-200 ease-in-out dark:bg-gray-900 lg:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
          <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Yezda
          </span>
          <button
            type="button"
            onClick={closeMobile}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Close sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col border-r border-gray-200 bg-white transition-all duration-200 dark:border-gray-800 dark:bg-gray-900',
          isCollapsed ? 'w-16' : 'w-64',
          className
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
