/**
 * Hook for session bootstrap on app launch.
 * Task 1.5: Implement session bootstrap on app launch.
 */

import { useEffect } from 'react';
import { useAuthStore, selectIsLoading, selectIsAuthenticated } from '../store/authStore';

/**
 * Bootstraps the auth session on app launch.
 * Should be called once at the app root.
 */
export function useSessionBootstrap() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const isLoading = useAuthStore(selectIsLoading);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return {
    isLoading,
    isAuthenticated,
  };
}

export default useSessionBootstrap;
