/**
 * Billed ledger list view with filters, totals, and pagination.
 */
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { PageContainer } from '@/components/layouts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Pagination,
  PaginationInfo,
  SkeletonTable,
  Card,
  toastError,
  toastSuccess,
} from '@/components/ui';
import { LedgerService } from '@/services';
import { formatDate, formatCurrency } from '@/utils';
import type { LedgerEntry, LedgerListParams, LedgerSummary } from '@/@types/ledger';

const DEFAULT_PAGE_SIZE = 10;

/**
 * BilledLedgerListView displays billed ledger entries with summary and filters.
 */
export function BilledLedgerListView(): ReactNode {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);

  // URL-synced filters
  const page = Number(searchParams.get('page')) || 1;
  const organizationId = searchParams.get('organizationId') || undefined;
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;
  const sortBy = (searchParams.get('sortBy') as LedgerListParams['sortBy']) || 'billedAt';
  const sortOrder = (searchParams.get('sortOrder') as LedgerListParams['sortOrder']) || 'desc';

  // Fetch billed entries
  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Omit<LedgerListParams, 'status'> = {
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        sortBy,
        sortOrder,
      };
      if (organizationId) params.organizationId = organizationId;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await LedgerService.listBilled(params);
      setEntries(response.data);
      setTotalItems(response.meta.totalItems);
      setTotalPages(response.meta.totalPages);
      setSummary(response.summary);
    } catch (error) {
      toastError(t('ledger.billed.fetchError'));
      console.error('Failed to fetch billed entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, organizationId, dateFrom, dateTo, sortBy, sortOrder, t]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  const handleSort = (column: LedgerListParams['sortBy']) => {
    const params = new URLSearchParams(searchParams);
    if (sortBy === column) {
      params.set('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sortBy', column!);
      params.set('sortOrder', 'desc');
    }
    setSearchParams(params);
  };

  const handleDateFromChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('dateFrom', value);
    } else {
      params.delete('dateFrom');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleDateToChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('dateTo', value);
    } else {
      params.delete('dateTo');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await LedgerService.exportCsv({
        status: 'billed',
        organizationId,
        dateFrom,
        dateTo,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billed-ledger-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toastSuccess(t('ledger.exportSuccess'));
    } catch (error) {
      toastError(t('ledger.exportError'));
      console.error('Failed to export ledger:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const renderSortIcon = (column: LedgerListParams['sortBy']) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <PageContainer
      title={t('ledger.billed.title')}
      description={t('ledger.billed.description')}
    >
      {/* Summary Cards */}
      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">
              {t('ledger.summary.totalAmount')}
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {formatCurrency(summary.totalAmount, summary.currency)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">
              {t('ledger.summary.entryCount')}
            </div>
            <div className="mt-1 text-2xl font-semibold">{summary.entryCount}</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-4">
          <input
            type="date"
            value={dateFrom || ''}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className="rounded-md border border-border px-3 py-2 text-sm dark:bg-muted"
            placeholder={t('ledger.filters.dateFrom')}
          />
          <input
            type="date"
            value={dateTo || ''}
            onChange={(e) => handleDateToChange(e.target.value)}
            className="rounded-md border border-border px-3 py-2 text-sm dark:bg-muted"
            placeholder={t('ledger.filters.dateTo')}
          />
        </div>
        <Button onClick={handleExport} disabled={isExporting} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? t('ledger.exporting') : t('ledger.export')}
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('organizationName')}
                >
                  {t('ledger.columns.organization')}
                  {renderSortIcon('organizationName')}
                </TableHead>
                <TableHead>{t('ledger.columns.description')}</TableHead>
                <TableHead
                  className="cursor-pointer select-none text-right"
                  onClick={() => handleSort('amount')}
                >
                  {t('ledger.columns.amount')}
                  {renderSortIcon('amount')}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('billedAt')}
                >
                  {t('ledger.columns.billedAt')}
                  {renderSortIcon('billedAt')}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('createdAt')}
                >
                  {t('ledger.columns.created')}
                  {renderSortIcon('createdAt')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    {t('ledger.billed.noResults')}
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.organizationName}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.description}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(entry.amount, entry.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.billedAt ? formatDate(entry.billedAt) : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(entry.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PaginationInfo page={page} pageSize={DEFAULT_PAGE_SIZE} totalItems={totalItems} />
          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}
    </PageContainer>
  );
}
