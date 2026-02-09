/**
 * Sidebar navigation component with role-based filtering.
 */

import { useMemo, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  userRoles: UserRole[] | undefined
): NavItem[] {
  return items.filter((item) => {
    // Empty authorities means all authenticated users can access
    if (item.authorities.length === 0) return true;
    // Check if user role is in allowed authorities
    return (userRoles?.length ?? 0) > 0
      ? item.authorities.some((role) => userRoles!.includes(role))
      : false;
  });
}

/**
 * Filter sections and their items based on user role.
 */
function filterNavConfig(
  sections: NavSection[],
  userRoles: UserRole[] | undefined
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: filterByAuthority(section.items, userRoles),
    }))
    .filter((section) => section.items.length > 0);
}

interface NavItemButtonProps {
  item: NavItem;
  isCollapsed: boolean;
}

function NavItemButton({ item, isCollapsed }: NavItemButtonProps): ReactNode {
  const { t } = useTranslation();
  const Icon = iconMap[item.icon];
  // Map nav item ids to translation keys
  const navLabel = t(`nav.${item.id}`, { defaultValue: item.label });

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
          'hover:bg-white/10',
          isActive
            ? 'bg-[var(--color-cta)] text-white shadow-sm'
            : 'text-slate-300',
          isCollapsed && 'justify-center px-2'
        )
      }
      title={isCollapsed ? navLabel : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && <span>{navLabel}</span>}
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
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isCollapsed, isMobileOpen, closeMobile, toggleCollapsed } =
    useSidebar();

  // Filter navigation based on user role
  const filteredSections = useMemo(
    () => filterNavConfig(navConfig.sections, user?.roles),
    [user?.roles]
  );

  // Map section titles to translation keys
  const getSectionTitle = (title: string | undefined): string | undefined => {
    if (!title) return undefined;
    const key = title.toLowerCase();
    return t(`nav.${key}`, { defaultValue: title });
  };

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
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {getSectionTitle(section.title)}
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
      <div className="hidden lg:flex border-t border-white/10 p-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            'flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-white/10 hover:text-white transition-colors duration-200',
            isCollapsed && 'justify-center'
          )}
          aria-label={isCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
        >
          <ChevronLeft
            className={cn(
              'h-4 w-4 transition-transform duration-300',
              isCollapsed && 'rotate-180'
            )}
          />
          {!isCollapsed && <span>{t('nav.collapse')}</span>}
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
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-[var(--color-primary)] transition-transform duration-300 ease-in-out lg:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <span className="text-xl font-semibold text-white">
            {t('app.name')}
          </span>
          <button
            type="button"
            onClick={closeMobile}
            className="p-2 rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition-colors duration-200"
            aria-label={t('common.closeSidebar')}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col border-r border-white/10 bg-[var(--color-primary)] dark:bg-[#0c1222] transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          className
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
