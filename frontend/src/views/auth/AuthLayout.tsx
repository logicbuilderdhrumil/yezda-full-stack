import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
  /** Page title displayed in the header. */
  title: string;
  /** Subtitle or description. */
  subtitle?: string;
}

/**
 * Shared layout for authentication pages.
 */
export function AuthLayout({ children, title, subtitle }: AuthLayoutProps): ReactNode {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Yezda
          </Link>
        </div>
        <div className="rounded-xl bg-white px-8 py-10 shadow-lg ring-1 ring-gray-900/5">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
