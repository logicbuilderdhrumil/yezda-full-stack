/**
 * Archived candidates list view.
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
  Badge,
  Pagination,
  PaginationInfo,
  SkeletonTable,
  toastError,
} from '@/components/ui';
import { CandidatesService } from '@/services';
import { formatDate, debounce } from '@/utils';
import type { Candidate, CandidateListParams } from '@/@types/candidate';

const DEFAULT_PAGE_SIZE = 10;

/**
 * ArchivedCandidatesListView displays a paginated table of archived candidates.
 */
export function ArchivedCandidatesListView(): ReactNode {
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
  const sortBy = (searchParams.get('sortBy') as CandidateListParams['sortBy']) || 'updatedAt';
  const sortOrder = (searchParams.get('sortOrder') as CandidateListParams['sortOrder']) || 'desc';

  const [searchInput, setSearchInput] = useState(search);

  // Fetch archived candidates
  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: CandidateListParams = {
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        status: 'archived', // Fixed filter for archived candidates
        sortBy,
        sortOrder,
      };
      if (search) params.search = search;

      const response = await CandidatesService.list(params);
      setCandidates(response.data);
      setTotalItems(response.meta.totalItems);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      toastError(t('candidates.archived.fetchError'));
      console.error('Failed to fetch archived candidates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, sortBy, sortOrder, t]);

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

  const handleBack = () => {
    navigate('/candidates');
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
      title={t('candidates.archived.title')}
      description={t('candidates.archived.description')}
    >
      {/* Header with back button */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="outline" onClick={handleBack}>
          ← {t('common.back')}
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          type="search"
          placeholder={t('candidates.list.searchPlaceholder')}
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('firstName')}
                >
                  {t('candidates.columns.name')}
                  {renderSortIcon('firstName')}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('email')}
                >
                  {t('candidates.columns.email')}
                  {renderSortIcon('email')}
                </TableHead>
                <TableHead>{t('candidates.columns.organization')}</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('updatedAt')}
                >
                  {t('candidates.columns.archivedAt')}
                  {renderSortIcon('updatedAt')}
                </TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {t('candidates.archived.noResults')}
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
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getCandidateFullName(candidate)}
                        <Badge variant="destructive">{t('candidates.status.archived')}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">{candidate.email}</TableCell>
                    <TableCell className="text-gray-500">
                      {candidate.organizationName || '-'}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {candidate.archivedAt ? formatDate(candidate.archivedAt) : formatDate(candidate.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/candidates/${candidate.id}`);
                        }}
                      >
                        {t('common.view')}
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
