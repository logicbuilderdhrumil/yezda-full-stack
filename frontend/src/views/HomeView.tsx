/**
 * Home dashboard view.
 */

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layouts';
import { useAuth } from '@/context/AuthContext';

/**
 * HomeView renders the main dashboard for authenticated users.
 */
export function HomeView(): ReactNode {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <PageContainer title={t('pages.home.title')} description={t('pages.home.description')}>
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {t('pages.home.welcomeBack', { name: user?.firstName })}
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t('pages.home.dashboardIntro')}
        </p>
      </div>
    </PageContainer>
  );
}
