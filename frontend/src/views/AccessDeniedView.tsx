/**
 * Access Denied view for unauthorized access attempts.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { PageContainer } from '@/components/layouts';

/**
 * AccessDeniedView renders when a user tries to access a route they don't have authority for.
 */
export function AccessDeniedView(): ReactNode {
  return (
    <PageContainer className="flex items-center justify-center min-h-full">
      <div className="text-center">
        <ShieldX className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You do not have permission to view this page.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Return to Home
        </Link>
      </div>
    </PageContainer>
  );
}
