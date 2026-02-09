/**
 * Generic Error view for unexpected application errors.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { ErrorPageLayout } from '@/components/layouts';
import { Button } from '@/components/ui';

export interface GenericErrorViewProps {
  /** Error object for displaying details. */
  error?: Error | null;
  /** Reset function to attempt recovery. */
  resetError?: () => void;
}

/**
 * GenericErrorView renders when an unexpected error occurs in the application.
 */
export function GenericErrorView({
  error,
  resetError,
}: GenericErrorViewProps): ReactNode {
  const { t } = useTranslation();

  const handleRetry = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <ErrorPageLayout
      icon={<AlertTriangle className="h-16 w-16 text-amber-500" />}
      code="500"
      title={t('errors.genericError')}
      description={t('errors.genericErrorMessage')}
      actions={
        <>
          <Button
            variant="outline"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={handleRetry}
          >
            {t('errors.tryAgain')}
          </Button>
          <Button asChild leftIcon={<Home className="h-4 w-4" />}>
            <Link to="/">{t('errors.returnToHome')}</Link>
          </Button>
        </>
      }
    >
      {/* Show error details in development */}
      {import.meta.env.DEV && error && (
        <div className="text-left bg-muted p-4 rounded-lg overflow-auto max-h-40">
          <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
            {error.name}: {error.message}
          </p>
          {error.stack && (
            <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
              {error.stack}
            </pre>
          )}
        </div>
      )}
    </ErrorPageLayout>
  );
}
