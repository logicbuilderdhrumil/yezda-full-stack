/**
 * Application shell with header, sidebar, and content area.
 */

import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/context/SidebarContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '@/utils';

interface AppShellProps {
  /** Additional CSS classes. */
  className?: string;
  /** Optional children to render instead of Outlet. */
  children?: ReactNode;
}

/**
 * AppShell provides the main layout structure with header, sidebar, and content.
 */
export function AppShell({ className, children }: AppShellProps): ReactNode {
  return (
    <SidebarProvider>
      <div className={cn('flex h-screen flex-col', className)}>
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
            {children ?? <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
