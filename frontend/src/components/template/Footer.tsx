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
          'flex h-12 items-center justify-center border-t border-[var(--color-border)] bg-[var(--color-background)] px-4',
          'dark:border-[var(--color-border)]',
          className
        )}
        data-testid="footer"
      >
        <p className="text-xs text-[var(--color-muted-foreground)]">
          © {currentYear} {t('app.name')}. {t('footer.allRightsReserved')}
        </p>
      </footer>
    );
  }

  return (
    <footer
      className={cn(
        'border-t border-[var(--color-border)] bg-[var(--color-background)] px-4 py-6',
        'dark:border-[var(--color-border)]',
        className
      )}
      data-testid="footer"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <span className="text-sm font-semibold text-[var(--color-foreground)]">
              {t('app.name')}
            </span>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              © {currentYear}. {t('footer.allRightsReserved')}
            </p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/privacy"
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-cta)] transition-colors duration-200"
            >
              {t('footer.privacy')}
            </Link>
            <Link
              to="/terms"
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-cta)] transition-colors duration-200"
            >
              {t('footer.terms')}
            </Link>
            <Link
              to="/help"
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-cta)] transition-colors duration-200"
            >
              {t('footer.help')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
