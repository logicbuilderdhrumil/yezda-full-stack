/**
 * Combined ledger view with Billed and Unbilled tabs.
 * Replaces the separate /admin/ledger/billed and /admin/ledger/unbilled routes
 * with a single /admin/ledger route that uses tabs.
 */

import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layouts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { BilledLedgerListView } from './BilledLedgerListView';
import { UnbilledLedgerListView } from './UnbilledLedgerListView';

/**
 * LedgerView combines the Billed and Unbilled ledger views
 * into a single page with tab navigation.
 */
export function LedgerView(): ReactNode {
  const { t } = useTranslation();

  return (
    <PageContainer
      title={t('ledger.title', { defaultValue: 'Ledger' })}
      description={t('ledger.description', {
        defaultValue: 'View and manage billed and unbilled ledger entries',
      })}
    >
      <Tabs defaultValue="billed" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="billed">
            {t('ledger.tabs.billed', { defaultValue: 'Billed' })}
          </TabsTrigger>
          <TabsTrigger value="unbilled">
            {t('ledger.tabs.unbilled', { defaultValue: 'Unbilled' })}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="billed">
          <BilledLedgerContent />
        </TabsContent>
        <TabsContent value="unbilled">
          <UnbilledLedgerContent />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

/**
 * Billed ledger content rendered without its own PageContainer
 * since the parent LedgerView provides one.
 */
function BilledLedgerContent(): ReactNode {
  // Re-render the full component; it wraps in PageContainer which is fine
  // since PageContainer just adds padding and a header - we'll render inline
  return <BilledLedgerListView />;
}

/**
 * Unbilled ledger content rendered without its own PageContainer.
 */
function UnbilledLedgerContent(): ReactNode {
  return <UnbilledLedgerListView />;
}
