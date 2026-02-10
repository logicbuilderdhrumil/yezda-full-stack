/**
 * PageContainer for page content with consistent spacing.
 */

import type { ReactNode } from 'react';
import { cn } from '@/utils';

interface PageContainerProps {
  /** Page title. */
  title?: string;
  /** Page description. */
  description?: string;
  /** Additional CSS classes. */
  className?: string;
  /** Whether to use full width (no max-width constraint). */
  fullWidth?: boolean;
  children: ReactNode;
}

/**
 * PageContainer wraps page content with consistent padding and optional header.
 */
export function PageContainer({
  title,
  description,
  className,
  fullWidth = false,
  children,
}: PageContainerProps): ReactNode {
  return (
    <div
      className={cn(
        'flex-1 p-6',
        !fullWidth && 'max-w-7xl mx-auto w-full',
        className
      )}
    >
      {(title || description) && (
        <header className="mb-6">
          {title && (
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
              {title}
            </h1>
          )}
          {description && (
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {description}
            </p>
          )}
        </header>
      )}
      {children}
    </div>
  );
}
