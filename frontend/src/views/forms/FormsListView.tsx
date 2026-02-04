/**
 * Forms list view with search, filters, and pagination.
 */
import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layouts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Pagination,
  PaginationInfo,
  SkeletonTable,
  toastError,
} from '@/components/ui';
import { FormsService } from '@/services';
import { formatDate, debounce } from '@/utils';
import type { Form, FormListParams, FormStatus } from '@/@types/form';

const DEFAULT_PAGE_SIZE = 10;

/**
 * Returns badge variant for form status.
 */
function getStatusVariant(status: FormStatus): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'published':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'archived':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/**
 * FormsListView displays a paginated table of forms.
 */
export function FormsListView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // URL-synced filters
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const status = (searchParams.get('status') as FormStatus) || undefined;
  const sortBy = (searchParams.get('sortBy') as FormListParams['sortBy']) || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') as FormListParams['sortOrder']) || 'desc';

  const [searchInput, setSearchInput] = useState(search);

  // Fetch forms
  const fetchForms = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: {
        page: number;
        pageSize: number;
        search?: string;
        status?: FormStatus;
        sortBy?: 'name' | 'createdAt' | 'updatedAt';
        sortOrder?: 'asc' | 'desc';
      } = {
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        sortBy,
        sortOrder,
      };
      if (search) params.search = search;
      if (status) params.status = status;

      const response = await FormsService.list(params);
      setForms(response.data);
      setTotalItems(response.meta.totalItems);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      toastError(t('forms.list.fetchError'));
      console.error('Failed to fetch forms:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status, sortBy, sortOrder, t]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  // Debounced search
  const updateSearchParams = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }
      params.set('page', '1');
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const debouncedSearch = useMemo(
    () =>
      debounce((...args: unknown[]) => {
        const value = args[0] as string;
        updateSearchParams(value);
      }, 300),
    [updateSearchParams]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel?.();
    };
  }, [debouncedSearch]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSearch(value);
  };

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set('status', value);
    } else {
      params.delete('status');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  const handleSort = (column: FormListParams['sortBy']) => {
    const params = new URLSearchParams(searchParams);
    if (sortBy === column) {
      params.set('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sortBy', column!);
      params.set('sortOrder', 'asc');
    }
    setSearchParams(params);
  };

  const handleRowClick = (id: string) => {
    navigate(`/forms/${id}`);
  };

  const handleCreate = () => {
    navigate('/forms/new');
  };

  const renderSortIcon = (column: FormListParams['sortBy']) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <PageContainer title={t('forms.list.title')} description={t('forms.list.description')}>
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-4">
          <Input
            type="search"
            placeholder={t('forms.list.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-xs"
          />
          <Select value={status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('forms.list.filterStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('forms.status.all')}</SelectItem>
              <SelectItem value="draft">{t('forms.status.draft')}</SelectItem>
              <SelectItem value="published">{t('forms.status.published')}</SelectItem>
              <SelectItem value="archived">{t('forms.status.archived')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate}>{t('forms.list.createButton')}</Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                  {t('forms.columns.name')}
                  {renderSortIcon('name')}
                </TableHead>
                <TableHead>{t('forms.columns.description')}</TableHead>
                <TableHead>{t('forms.columns.status')}</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('createdAt')}
                >
                  {t('forms.columns.created')}
                  {renderSortIcon('createdAt')}
                </TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                    {t('forms.list.noResults')}
                  </TableCell>
                </TableRow>
              ) : (
                forms.map((form) => (
                  <TableRow
                    key={form.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(form.id)}
                  >
                    <TableCell className="font-medium">{form.name}</TableCell>
                    <TableCell className="text-gray-500">{form.description || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(form.status)}>
                        {t(`forms.status.${form.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">{formatDate(form.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/forms/${form.id}/edit`);
                        }}
                      >
                        {t('common.edit')}
                      </Button>
                    </TableCell>
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
