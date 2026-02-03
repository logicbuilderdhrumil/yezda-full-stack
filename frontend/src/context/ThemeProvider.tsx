/**
 * ThemeProvider component for theme management.
 * Wires the theme store to the document and applies CSS variables.
 */

import { useEffect, type ReactNode } from 'react';
import { useThemeStore, selectResolvedTheme } from '@/store';
import { applyThemeToDocument } from '@/utils/themeGenerator';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider initializes theme on mount and syncs theme changes to DOM.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const resolvedTheme = useThemeStore(selectResolvedTheme);

  // Apply theme on initial render and when theme changes
  useEffect(() => {
    applyThemeToDocument(resolvedTheme);
  }, [resolvedTheme]);

  return <>{children}</>;
}
