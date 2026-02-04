/**
 * Candidates list view with search, filters, and pagination.
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
import { CandidatesService } from '@/services';
import { formatDate, debounce } from '@/utils';
import type {
  Candidate,
  CandidateListParams,
  CandidateStatus,
} from '@/@types/candidate';

const DEFAULT_PAGE_SIZE = 10;

/**
 * Returns badge variant for candidate status.
 */
function getStatusVariant(status: CandidateStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'certified':
      return 'default';
    case 'archived':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * CandidatesListView displays a paginated table of candidates.
 */
export function CandidatesListView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // URL-synced filters
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const status = (searchParams.get('status') as CandidateStatus) || undefined;
  const sortBy = (searchParams.get('sortBy') as CandidateListParams['sortBy']) || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') as CandidateListParams['sortOrder']) || 'desc';

  const [searchInput, setSearchInput] = useState(search);

  // Fetch candidates
  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: CandidateListParams = {
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        sortBy,
        sortOrder,
      };
      if (search) params.search = search;
      if (status) params.status = status;

      const response = await CandidatesService.list(params);
      setCandidates(response.data);
      setTotalItems(response.meta.totalItems);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      toastError(t('candidates.list.fetchError'));
      console.error('Failed to fetch candidates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status, sortBy, sortOrder, t]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

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
    () => debounce((...args: unknown[]) => {
      const value = args[0] as string;
      updateSearchParams(value);
    }, 300),
    [updateSearchParams]
  );

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

  const handleSort = (column: CandidateListParams['sortBy']) => {
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
    navigate(`/candidates/${id}`);
  };

  const handleCreate = () => {
    navigate('/candidates/new');
  };

  const handleBulkCreate = () => {
    navigate('/candidates/bulk-create');
  };

  const renderSortIcon = (column: CandidateListParams['sortBy']) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const getCandidateFullName = (candidate: Candidate) => {
    return `${candidate.firstName} ${candidate.lastName}`.trim() || candidate.email;
  };

  return (
    <PageContainer
      title={t('candidates.list.title')}
      description={t('candidates.list.description')}
    >
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-4">
          <Input
            type="search"
            placeholder={t('candidates.list.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-xs"
          />
          <Select value={status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('candidates.list.filterStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('candidates.status.all')}</SelectItem>
              <SelectItem value="pending">{t('candidates.status.pending')}</SelectItem>
              <SelectItem value="active">{t('candidates.status.active')}</SelectItem>
              <SelectItem value="certified">{t('candidates.status.certified')}</SelectItem>
              <SelectItem value="archived">{t('candidates.status.archived')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBulkCreate}>
            {t('candidates.list.bulkCreateButton')}
          </Button>
          <Button onClick={handleCreate}>{t('candidates.list.createButton')}</Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={6} />
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('firstName')}
                  aria-sort={sortBy === 'firstName' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {t('candidates.columns.name')}
                  {renderSortIcon('firstName')}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('email')}
                  aria-sort={sortBy === 'email' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {t('candidates.columns.email')}
                  {renderSortIcon('email')}
                </TableHead>
                <TableHead>{t('candidates.columns.status')}</TableHead>
                <TableHead>{t('candidates.columns.organization')}</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('createdAt')}
                  aria-sort={sortBy === 'createdAt' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {t('candidates.columns.created')}
                  {renderSortIcon('createdAt')}
                </TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {t('candidates.list.noResults')}
                  </TableCell>
                </TableRow>
              ) : (
                candidates.map((candidate) => (
                  <TableRow
                    key={candidate.id}
                    className="cursor-pointer"
                    tabIndex={0}
                    role="button"
                    onClick={() => handleRowClick(candidate.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(candidate.id);
                      }
                    }}
                  >
                    <TableCell className="font-medium">{getCandidateFullName(candidate)}</TableCell>
                    <TableCell className="text-gray-500">{candidate.email}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(candidate.status)}>
                        {t(`candidates.status.${candidate.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {candidate.organizationName || '-'}
                    </TableCell>
                    <TableCell className="text-gray-500">{formatDate(candidate.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/candidates/${candidate.id}/edit`);
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
          <PaginationInfo
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            totalItems={totalItems}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </PageContainer>
  );
}
