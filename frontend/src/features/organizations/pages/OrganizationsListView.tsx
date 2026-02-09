/**
 * Organizations list view with search, filters, and pagination.
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
import { OrganizationsService } from '@/services';
import { formatDate, debounce } from '@/utils';
import type {
  Organization,
  OrganizationListParams,
  OrganizationStatus,
} from '@/@types/organization';

const DEFAULT_PAGE_SIZE = 10;

/**
 * Returns badge variant for organization status.
 */
function getStatusVariant(status: OrganizationStatus): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'suspended':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/**
 * OrganizationsListView displays a paginated table of organizations.
 */
export function OrganizationsListView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // URL-synced filters
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const status = (searchParams.get('status') as OrganizationStatus) || undefined;
  const sortBy = (searchParams.get('sortBy') as OrganizationListParams['sortBy']) || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') as OrganizationListParams['sortOrder']) || 'desc';

  const [searchInput, setSearchInput] = useState(search);

  // Fetch organizations
  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: {
        page: number;
        pageSize: number;
        search?: string;
        status?: OrganizationStatus;
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

      const response = await OrganizationsService.list(params);
      setOrganizations(response.data);
      setTotalItems(response.meta.totalItems);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      toastError(t('organizations.list.fetchError'));
      console.error('Failed to fetch organizations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status, sortBy, sortOrder, t]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

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

  const handleSort = (column: OrganizationListParams['sortBy']) => {
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
    navigate(`/admin/organizations/${id}`);
  };

  const handleCreate = () => {
    navigate('/admin/organizations/new');
  };

  const renderSortIcon = (column: OrganizationListParams['sortBy']) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <PageContainer
      title={t('organizations.list.title')}
      description={t('organizations.list.description')}
    >
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-4">
          <Input
            type="search"
            placeholder={t('organizations.list.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-xs"
          />
          <Select value={status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('organizations.list.filterStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('organizations.status.all')}</SelectItem>
              <SelectItem value="active">{t('organizations.status.active')}</SelectItem>
              <SelectItem value="pending">{t('organizations.status.pending')}</SelectItem>
              <SelectItem value="suspended">{t('organizations.status.suspended')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate}>{t('organizations.list.createButton')}</Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={6} />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('name')}
                >
                  {t('organizations.columns.name')}
                  {renderSortIcon('name')}
                </TableHead>
                <TableHead>{t('organizations.columns.slug')}</TableHead>
                <TableHead>{t('organizations.columns.status')}</TableHead>
                <TableHead>{t('organizations.columns.email')}</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('createdAt')}
                >
                  {t('organizations.columns.created')}
                  {renderSortIcon('createdAt')}
                </TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t('organizations.list.noResults')}
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => (
                  <TableRow
                    key={org.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(org.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(org.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                  >
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell className="text-muted-foreground">{org.slug}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(org.status)}>
                        {t(`organizations.status.${org.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{org.email || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(org.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/organizations/${org.id}/edit`);
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
