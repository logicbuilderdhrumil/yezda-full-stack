import { StrictMode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeProvider';
import { router } from '@/routes';

/**
 * Root application component.
 */
export function App() {
  return (
    <StrictMode>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
