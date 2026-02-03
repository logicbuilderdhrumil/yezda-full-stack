/**
 * Theme provider that applies theme to the document.
 */

import { useEffect, type ReactNode } from 'react';
import { useThemeStore, selectResolvedTheme } from '@/store/themeStore';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider applies the resolved theme to the document root.
 * Updates the document class and color-scheme when theme changes.
 */
export function ThemeProvider({ children }: ThemeProviderProps): ReactNode {
  const resolvedTheme = useThemeStore(selectResolvedTheme);

  useEffect(() => {
    const root = document.documentElement;

    // Toggle dark class
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Set color-scheme for native elements
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  return <>{children}</>;
}
