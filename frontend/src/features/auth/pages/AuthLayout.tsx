import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[var(--color-background)] to-[var(--color-muted)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-[var(--color-cta)]">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            {t('app.name')}
          </Link>
        </div>
        <div className="rounded-xl bg-white dark:bg-slate-800 px-8 py-10 shadow-lg ring-1 ring-[var(--color-border)]">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
