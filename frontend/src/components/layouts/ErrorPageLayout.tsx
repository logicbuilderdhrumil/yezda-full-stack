/**
 * ErrorPageLayout - Shared layout for error, access denied, and not-found pages.
 */

import type { ReactNode } from 'react';
import { cn } from '@/utils';

export interface ErrorPageLayoutProps {
  /** Icon component to display. */
  icon: ReactNode;
  /** Error code (e.g., 403, 404, 500). */
  code?: string | number;
  /** Page title. */
  title: string;
  /** Error description. */
  description: string;
  /** CTA actions. */
  actions?: ReactNode;
  /** Additional content below description. */
  children?: ReactNode;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * ErrorPageLayout provides consistent styling for error pages.
 * Centers content with icon, title, description, and action buttons.
 */
export function ErrorPageLayout({
  icon,
  code,
  title,
  description,
  actions,
  children,
  className,
}: ErrorPageLayoutProps): ReactNode {
  return (
    <div
      className={cn(
        'flex min-h-screen items-center justify-center p-6 bg-[var(--color-background)]',
        className
      )}
    >
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto mb-6">{icon}</div>

        {/* Error Code */}
        {code && (
          <p className="text-5xl font-bold text-[var(--color-cta)]/20 mb-2">
            {code}
          </p>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
          {title}
        </h1>

        {/* Description */}
        <p className="text-[var(--color-muted-foreground)] mb-6">{description}</p>

        {/* Additional Content */}
        {children && <div className="mb-6">{children}</div>}

        {/* Actions */}
        {actions && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
