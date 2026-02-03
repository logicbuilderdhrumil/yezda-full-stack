/**
 * Route loading fallback component.
 */

import type { ReactNode } from 'react';
import { LoadingSpinner } from '@/components/ui';

/**
 * RouteLoadingFallback displays while lazy-loaded route components are loading.
 */
export function RouteLoadingFallback(): ReactNode {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size={40} className="mx-auto" />
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Loading...
        </p>
      </div>
    </div>
  );
}
