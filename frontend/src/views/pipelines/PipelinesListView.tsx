/**
 * Pipelines list view with search, filters, and pagination.
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
  toastSuccess,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { PipelineService } from '@/services';
import { formatDate, debounce } from '@/utils';
import type { ScreeningPipeline, PipelineListParams, PipelineStatus } from '@/@types/pipeline';

const DEFAULT_PAGE_SIZE = 10;

/**
 * Returns badge variant for pipeline status.
 */
function getStatusVariant(status: PipelineStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'archived':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * PipelinesListView displays a paginated table of screening pipelines.
 */
export function PipelinesListView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [pipelines, setPipelines] = useState<ScreeningPipeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState<ScreeningPipeline | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // URL-synced filters
  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const status = (searchParams.get('status') as PipelineStatus) || undefined;
  const sortBy = (searchParams.get('sortBy') as PipelineListParams['sortBy']) || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') as PipelineListParams['sortOrder']) || 'desc';

  const [searchInput, setSearchInput] = useState(search);

  // Fetch pipelines
  const fetchPipelines = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: PipelineListParams = {
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        sortBy,
        sortOrder,
      };
      if (search) params.search = search;
      if (status) params.status = status;

      const response = await PipelineService.list(params);
      setPipelines(response.data);
      setTotalItems(response.meta.totalItems);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      toastError(t('pipelines.list.fetchError', 'Failed to load pipelines'));
      console.error('Failed to fetch pipelines:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status, sortBy, sortOrder, t]);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

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

  const handleSort = (column: PipelineListParams['sortBy']) => {
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
    navigate(`/admin/pipelines/${id}`);
  };

  const handleCreate = () => {
    navigate('/admin/pipelines/create');
  };

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/admin/pipelines/${id}/edit`);
  };

  const handleActivate = async (e: React.MouseEvent, pipeline: ScreeningPipeline) => {
    e.stopPropagation();
    try {
      await PipelineService.activate(pipeline.id);
      toastSuccess(t('pipelines.actions.activateSuccess', 'Pipeline activated successfully'));
      fetchPipelines();
    } catch (error) {
      toastError(t('pipelines.actions.activateError', 'Failed to activate pipeline'));
      console.error('Failed to activate pipeline:', error);
    }
  };

  const handleArchive = async (e: React.MouseEvent, pipeline: ScreeningPipeline) => {
    e.stopPropagation();
    try {
      await PipelineService.archive(pipeline.id);
      toastSuccess(t('pipelines.actions.archiveSuccess', 'Pipeline archived successfully'));
      fetchPipelines();
    } catch (error) {
      toastError(t('pipelines.actions.archiveError', 'Failed to archive pipeline'));
      console.error('Failed to archive pipeline:', error);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, pipeline: ScreeningPipeline) => {
    e.stopPropagation();
    setPipelineToDelete(pipeline);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!pipelineToDelete) return;
    setIsDeleting(true);
    try {
      await PipelineService.delete(pipelineToDelete.id);
      toastSuccess(t('pipelines.actions.deleteSuccess', 'Pipeline deleted successfully'));
      setDeleteDialogOpen(false);
      setPipelineToDelete(null);
      fetchPipelines();
    } catch (error) {
      toastError(t('pipelines.actions.deleteError', 'Failed to delete pipeline'));
      console.error('Failed to delete pipeline:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderSortIcon = (column: PipelineListParams['sortBy']) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <PageContainer
      title={t('pipelines.list.title', 'Screening Pipelines')}
      description={t('pipelines.list.description', 'Manage your screening pipeline templates')}
    >
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-4">
          <Input
            type="search"
            placeholder={t('pipelines.list.searchPlaceholder', 'Search pipelines...')}
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-xs"
          />
          <Select value={status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('pipelines.list.filterStatus', 'Filter by status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('pipelines.status.all', 'All')}</SelectItem>
              <SelectItem value="draft">{t('pipelines.status.draft', 'Draft')}</SelectItem>
              <SelectItem value="active">{t('pipelines.status.active', 'Active')}</SelectItem>
              <SelectItem value="archived">{t('pipelines.status.archived', 'Archived')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate}>
          {t('pipelines.list.createButton', 'Create Pipeline')}
        </Button>
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
                  onClick={() => handleSort('name')}
                  aria-sort={sortBy === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {t('pipelines.columns.name', 'Name')}
                  {renderSortIcon('name')}
                </TableHead>
                <TableHead>{t('pipelines.columns.stages', 'Stages')}</TableHead>
                <TableHead>{t('pipelines.columns.status', 'Status')}</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('createdAt')}
                  aria-sort={sortBy === 'createdAt' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {t('pipelines.columns.created', 'Created')}
                  {renderSortIcon('createdAt')}
                </TableHead>
                <TableHead className="w-48" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pipelines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {t('pipelines.list.noResults', 'No pipelines found')}
                  </TableCell>
                </TableRow>
              ) : (
                pipelines.map((pipeline) => (
                  <TableRow
                    key={pipeline.id}
                    className="cursor-pointer"
                    tabIndex={0}
                    role="button"
                    onClick={() => handleRowClick(pipeline.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(pipeline.id);
                      }
                    }}
                  >
                    <TableCell className="font-medium">{pipeline.name}</TableCell>
                    <TableCell className="text-gray-500">
                      {pipeline.stages?.length || 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(pipeline.status)}>
                        {t(`pipelines.status.${pipeline.status}`, pipeline.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">{formatDate(pipeline.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {pipeline.status === 'draft' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleEdit(e, pipeline.id)}
                            >
                              {t('common.edit', 'Edit')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleActivate(e, pipeline)}
                            >
                              {t('pipelines.actions.activate', 'Activate')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteClick(e, pipeline)}
                            >
                              {t('common.delete', 'Delete')}
                            </Button>
                          </>
                        )}
                        {pipeline.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleArchive(e, pipeline)}
                          >
                            {t('pipelines.actions.archive', 'Archive')}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(pipeline.id);
                          }}
                        >
                          {t('common.view', 'View')}
                        </Button>
                      </div>
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

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pipelines.delete.title', 'Delete Pipeline')}</DialogTitle>
            <DialogDescription>
              {t('pipelines.delete.description', 'Are you sure you want to delete this pipeline? This action cannot be undone.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
