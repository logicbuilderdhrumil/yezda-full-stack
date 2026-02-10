/**
 * Not Found view for unknown routes.
 */

import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { ErrorPageLayout } from '@/components/layouts';
import { Button } from '@/components/ui';

/**
 * NotFoundView renders when a user navigates to a non-existent route.
 */
export function NotFoundView(): ReactNode {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <ErrorPageLayout
      icon={<FileQuestion className="h-16 w-16 text-muted-foreground" />}
      code="404"
      title={t('errors.notFound')}
      description={t('errors.notFoundMessage')}
      actions={
        <>
          <Button asChild variant="outline">
            <Link
              to={-1 as unknown as string}
              onClick={(e) => {
                e.preventDefault();
                window.history.back();
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('errors.goBack')}
            </Link>
          </Button>
          <Button asChild>
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              {t('errors.returnToHome')}
            </Link>
          </Button>
        </>
      }
    >
      {/* Show the attempted path for debugging in development */}
      {import.meta.env.DEV && (
        <p className="text-sm text-muted-foreground font-mono bg-muted px-3 py-1 rounded">
          {location.pathname}
        </p>
      )}
    </ErrorPageLayout>
  );
}
