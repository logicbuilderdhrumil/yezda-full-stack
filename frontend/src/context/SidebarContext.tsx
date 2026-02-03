/**
 * Sidebar context for managing sidebar state.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

interface SidebarContextValue {
  /** Whether the sidebar is collapsed. */
  isCollapsed: boolean;
  /** Whether the sidebar is open on mobile. */
  isMobileOpen: boolean;
  /** Toggle sidebar collapsed state. */
  toggleCollapsed: () => void;
  /** Set collapsed state. */
  setCollapsed: (collapsed: boolean) => void;
  /** Toggle mobile sidebar. */
  toggleMobile: () => void;
  /** Close mobile sidebar. */
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const COLLAPSED_STORAGE_KEY = 'yezda-sidebar-collapsed';

interface SidebarProviderProps {
  children: ReactNode;
}

/**
 * SidebarProvider manages sidebar visibility state.
 */
export function SidebarProvider({ children }: SidebarProviderProps): ReactNode {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    return stored === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const value: SidebarContextValue = {
    isCollapsed,
    isMobileOpen,
    toggleCollapsed,
    setCollapsed,
    toggleMobile,
    closeMobile,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

/**
 * useSidebar hook provides access to sidebar state.
 */
export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
