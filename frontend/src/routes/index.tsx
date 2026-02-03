import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { authRoutes } from './authRoutes';

/**
 * Placeholder home component for authenticated users.
 */
function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Yezda</h1>
        <p className="mt-2 text-gray-600">You are signed in.</p>
      </div>
    </div>
  );
}

/**
 * Root routes configuration.
 */
const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  ...authRoutes,
];

/**
 * Application router instance.
 */
export const router = createBrowserRouter(routes);
