/**
 * Hooks Index
 *
 * @deprecated Import feature-specific hooks from '@/features/<name>' instead.
 * Global hooks (usePresence) remain here.
 */

// Feature hooks (re-exported for backward compatibility)
export { useDashboard } from '@/features/dashboard';

// Global hooks (not feature-specific, remain in hooks/)
export { usePresence, useUserPresence } from './usePresence';
