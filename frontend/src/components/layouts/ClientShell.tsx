/**
 * Client portal shell with header, sidebar, and content area.
 * Used for the client-facing routes (/) for screening clients and org staff.
 */

import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/context/SidebarContext';
import { Header } from './Header';
import { ClientSidebar } from './ClientSidebar';
import { cn } from '@/utils';

interface ClientShellProps {
  /** Additional CSS classes. */
  className?: string;
  /** Optional children to render instead of Outlet. */
  children?: ReactNode;
  /** Whether to show global search in header. */
  showSearch?: boolean;
}

/**
 * ClientShell provides the main layout structure for the client portal
 * with header, sidebar, and content.
 */
export function ClientShell({
  className,
  children,
  showSearch = true,
}: ClientShellProps): ReactNode {
  return (
    <SidebarProvider>
      <div
        className={cn('flex h-screen flex-col bg-neutral-950 text-neutral-100', className)}
        data-testid="client-shell"
      >
        <Header showSearch={showSearch} />
        <div className="flex flex-1 overflow-hidden">
          <ClientSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
              {children ?? <Outlet />}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
