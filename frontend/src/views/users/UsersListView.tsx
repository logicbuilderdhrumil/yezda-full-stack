/**
 * Users list view with search, filters, and pagination.
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
import { UsersService } from '@/services';
import { formatDate, debounce } from '@/utils';
import type {
  ManagedUser,
  UserListParams,
  UserStatus,
  UserRole,
} from '@/@types/user';

const DEFAULT_PAGE_SIZE = 10;

/**
 * Returns badge variant for user status.
 */
function getStatusVariant(status: UserStatus): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'inactive':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/**
 * Returns badge variant for user role.
 */
function getRoleVariant(role: UserRole): 'default' | 'secondary' | 'outline' {
  switch (role) {
    case 'admin':
      return 'default';
    case 'manager':
      return 'secondary';
    default:
      return 'outline';
  }
}

/**
 * UsersListView displays a paginated table of users.
 */
export function UsersListView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // URL-synced filters
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const status = (searchParams.get('status') as UserStatus) || undefined;
  const role = (searchParams.get('role') as UserRole) || undefined;
  const sortBy = (searchParams.get('sortBy') as UserListParams['sortBy']) || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') as UserListParams['sortOrder']) || 'desc';

  const [searchInput, setSearchInput] = useState(search);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: UserListParams = {
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        sortBy,
        sortOrder,
      };
      if (search) params.search = search;
      if (status) params.status = status;
      if (role) params.role = role;

      const response = await UsersService.list(params);
      setUsers(response.data);
      setTotalItems(response.meta.totalItems);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      toastError(t('users.list.fetchError'));
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status, role, sortBy, sortOrder, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const handleRoleChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set('role', value);
    } else {
      params.delete('role');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  const handleSort = (column: UserListParams['sortBy']) => {
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
    navigate(`/users/${id}`);
  };

  const handleCreate = () => {
    navigate('/users/new');
  };

  const renderSortIcon = (column: UserListParams['sortBy']) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const getUserFullName = (user: ManagedUser) => {
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  };

  return (
    <PageContainer
      title={t('users.list.title')}
      description={t('users.list.description')}
    >
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-4">
          <Input
            type="search"
            placeholder={t('users.list.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-xs"
          />
          <Select value={status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('users.list.filterStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('users.status.all')}</SelectItem>
              <SelectItem value="active">{t('users.status.active')}</SelectItem>
              <SelectItem value="pending">{t('users.status.pending')}</SelectItem>
              <SelectItem value="inactive">{t('users.status.inactive')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={role || 'all'} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('users.list.filterRole')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('users.role.all')}</SelectItem>
              <SelectItem value="admin">{t('users.role.admin')}</SelectItem>
              <SelectItem value="manager">{t('users.role.manager')}</SelectItem>
              <SelectItem value="user">{t('users.role.user')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate}>{t('users.list.createButton')}</Button>
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
                >
                  {t('users.columns.name')}
                  {renderSortIcon('firstName')}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('email')}
                >
                  {t('users.columns.email')}
                  {renderSortIcon('email')}
                </TableHead>
                <TableHead>{t('users.columns.role')}</TableHead>
                <TableHead>{t('users.columns.status')}</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('createdAt')}
                >
                  {t('users.columns.created')}
                  {renderSortIcon('createdAt')}
                </TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {t('users.list.noResults')}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer"
                    tabIndex={0}
                    role="button"
                    onClick={() => handleRowClick(user.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(user.id);
                      }
                    }}
                  >
                    <TableCell className="font-medium">{getUserFullName(user)}</TableCell>
                    <TableCell className="text-gray-500">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleVariant(user.roles?.[0] || 'viewer')}>
                        {t(`users.role.${user.roles?.[0] || 'viewer'}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(user.status)}>
                        {t(`users.status.${user.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/users/${user.id}/edit`);
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
