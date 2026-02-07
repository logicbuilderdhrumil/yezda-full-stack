import { StrictMode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider, ThemeProvider, I18nProvider, OrgPerspectiveProvider } from '@/context';
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
            <OrgPerspectiveProvider>
              <RouterProvider router={router} />
            </OrgPerspectiveProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
