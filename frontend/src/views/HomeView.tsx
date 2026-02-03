/**
 * Home dashboard view.
 */

import type { ReactNode } from 'react';
import { PageContainer } from '@/components/layouts';
import { useAuth } from '@/context/AuthContext';

/**
 * HomeView renders the main dashboard for authenticated users.
 */
export function HomeView(): ReactNode {
  const { user } = useAuth();

  return (
    <PageContainer title="Home" description="Welcome to your dashboard">
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Welcome back, {user?.firstName}!
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          This is your home dashboard. Navigate using the sidebar to access
          different sections of the application.
        </p>
      </div>
    </PageContainer>
  );
}
