/**
 * Application shell with header, sidebar, and content area.
 */

import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/context/SidebarContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from '@/components/template';
import { cn } from '@/utils';

interface AppShellProps {
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
 * AppShell provides the main layout structure with header, sidebar, and content.
 */
export function AppShell({
  className,
  children,
  showFooter = false,
  showSearch = true,
}: AppShellProps): ReactNode {
  return (
    <SidebarProvider>
      <div className={cn('flex h-screen flex-col', className)} data-testid="app-shell">
        <Header showSearch={showSearch} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
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
