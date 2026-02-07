/**
 * Admin application shell with header, sidebar, and content area.
 * Used for the /admin/* routes for SAAS staff operations.
 */

import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/context/SidebarContext';
import { Header } from './Header';
import { AdminSidebar } from './AdminSidebar';
import { Footer } from '@/components/template';
import { cn } from '@/utils';

interface AdminShellProps {
  /** Additional CSS classes. */
  className?: string;
  /** Optional children to render instead of Outlet. */
  children?: ReactNode;
  /** Whether to show the footer. */
  showFooter?: boolean;
  /** Whether to show global search in header. */
  showSearch?: boolean;
}

/**
 * AdminShell provides the main layout structure for admin area
 * with header, sidebar, and content.
 */
export function AdminShell({
  className,
  children,
  showFooter = false,
  showSearch = true,
}: AdminShellProps): ReactNode {
  return (
    <SidebarProvider>
      <div className={cn('flex h-screen flex-col', className)} data-testid="admin-shell">
        <Header showSearch={showSearch} />
        <div className="flex flex-1 overflow-hidden">
          <AdminSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
              {children ?? <Outlet />}
            </main>
            {showFooter && <Footer compact />}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
