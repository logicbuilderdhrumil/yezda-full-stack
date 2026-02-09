/**
 * Privacy Policy placeholder view.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * PrivacyView renders the Privacy Policy page.
 */
export function PrivacyView(): ReactNode {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-muted/50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-8 py-10">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            {t('legal.privacyPolicy', 'Privacy Policy')}
          </h1>
          <p className="text-muted-foreground mb-4">
            {t('legal.privacyPlaceholder', 'Privacy Policy content will be added here.')}
          </p>
          <p className="text-muted-foreground mb-8">
            {t('legal.lastUpdated', 'Last updated')}: February 4, 2026
          </p>
          <Link
            to="/"
            className="text-primary hover:text-primary/80 font-medium"
          >
            ← {t('common.backToHome', 'Back to Home')}
          </Link>
        </div>
      </div>
    </div>
  );
}
