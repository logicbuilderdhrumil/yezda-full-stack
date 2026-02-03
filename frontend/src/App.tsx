import { StrictMode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider, ThemeProvider, I18nProvider } from '@/context';
import { router } from '@/routes';

/**
 * Root application component.
 */
export function App() {
  return (
    <StrictMode>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
