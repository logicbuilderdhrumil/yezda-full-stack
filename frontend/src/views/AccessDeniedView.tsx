/**
 * Access Denied view for unauthorized access attempts.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { ErrorPageLayout } from '@/components/layouts';
import { Button } from '@/components/ui';

/**
 * AccessDeniedView renders when a user tries to access a route they don't have authority for.
 */
export function AccessDeniedView(): ReactNode {
  const { t } = useTranslation();

  return (
    <ErrorPageLayout
      icon={<ShieldX className="h-16 w-16 text-red-500" />}
      code="403"
      title={t('errors.accessDenied')}
      description={t('errors.accessDeniedMessage')}
      actions={
        <>
          <Button asChild variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            <Link to={-1 as unknown as string} onClick={(e) => { e.preventDefault(); window.history.back(); }}>
              {t('errors.goBack')}
            </Link>
          </Button>
          <Button asChild leftIcon={<Home className="h-4 w-4" />}>
            <Link to="/">{t('errors.returnToHome')}</Link>
          </Button>
        </>
      }
    />
  );
}
