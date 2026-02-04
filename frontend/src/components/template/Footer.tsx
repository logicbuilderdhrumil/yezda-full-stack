/**
 * Application footer component.
 * Displays copyright, links, and version info.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils';

export interface FooterProps {
  /** Additional CSS classes. */
  className?: string;
  /** Whether to show in a compact mode. */
  compact?: boolean;
}

/**
 * Footer displays branding, copyright, and useful links.
 */
export function Footer({ className, compact = false }: FooterProps): ReactNode {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  if (compact) {
    return (
      <footer
        className={cn(
          'flex h-12 items-center justify-center border-t border-gray-200 bg-white px-4',
          'dark:border-gray-800 dark:bg-gray-900',
          className
        )}
        data-testid="footer"
      >
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © {currentYear} {t('app.name')}. {t('footer.allRightsReserved')}
        </p>
      </footer>
    );
  }

  return (
    <footer
      className={cn(
        'border-t border-gray-200 bg-white px-4 py-6',
        'dark:border-gray-800 dark:bg-gray-900',
        className
      )}
      data-testid="footer"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('app.name')}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © {currentYear}. {t('footer.allRightsReserved')}
            </p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/privacy"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {t('footer.privacy')}
            </Link>
            <Link
              to="/terms"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {t('footer.terms')}
            </Link>
            <Link
              to="/help"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {t('footer.help')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
