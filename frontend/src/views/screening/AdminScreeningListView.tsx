/**
 * AdminScreeningListView displays a paginated, filterable table of screening
 * pipelines for admin users. Uses the screening-pipelines admin endpoint
 * instead of the client-scoped screening endpoint.
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { PageContainer } from '@/components/layouts';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Pagination,
  PaginationInfo,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { PipelineService } from '@/services';
import type { ScreeningPipeline } from '@/@types/pipeline';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
] as const;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Maps pipeline status to a badge variant. */
function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'success' | 'destructive' {
  switch (status) {
    case 'active':
      return 'success';
    case 'draft':
      return 'secondary';
    case 'archived':
      return 'destructive';
    default:
      return 'default';
  }
}

/** Formats a label for display. */
function formatLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Formats an ISO date string for display. */
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

/** Loading skeleton for the screening table. */
function TableSkeleton(): ReactNode {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface AdminScreeningListViewProps {
  /** Optional organization ID to filter screenings by org. */
  orgId?: string;
}

// -----------------------------------------------------------------------------
// Main View
// -----------------------------------------------------------------------------

export function AdminScreeningListView({ orgId: propOrgId }: AdminScreeningListViewProps): ReactNode {
  const params = useParams<{ orgId?: string }>();
  const orgId = propOrgId ?? params.orgId;

  const [pipelines, setPipelines] = useState<ScreeningPipeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [status, setStatus] = useState('all');

  const fetchPipelines = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: import('@/@types/pipeline').PipelineListParams = {
        page,
        pageSize: PAGE_SIZE,
      };
      if (status !== 'all') {
        params.status = status as 'draft' | 'active' | 'archived';
      }
      const result = await PipelineService.list(params);
      const items = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
      setPipelines(items);
      setTotalPages(result?.meta?.totalPages ?? 1);
      setTotalItems(result?.meta?.totalItems ?? items.length);
    } catch {
      setError('Failed to load screenings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void fetchPipelines();
  }, [fetchPipelines]);

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const title = orgId ? 'Organization Screenings' : 'All Screenings';
  const description = orgId
    ? 'Screening pipelines for this organization'
    : 'All screening pipelines across organizations';

  // Error state
  if (error && pipelines.length === 0) {
    return (
      <PageContainer title={title} description={description}>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button variant="outline" onClick={() => void fetchPipelines()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={title} description={description}>
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Screening Pipelines</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : pipelines.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {status !== 'all'
                  ? 'No pipelines match your filters.'
                  : 'No screening pipelines yet.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Stages</TableHead>
                  <TableHead className="hidden sm:table-cell">Version</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="hidden md:table-cell">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pipelines.map((pipeline) => (
                  <TableRow key={pipeline.id}>
                    <TableCell className="font-medium">
                      {pipeline.name}
                      {pipeline.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {pipeline.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(pipeline.status)}>
                        {formatLabel(pipeline.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-gray-500 dark:text-gray-400">
                      {pipeline.stages?.length ?? 0}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-gray-500 dark:text-gray-400">
                      v{pipeline.version}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-500 dark:text-gray-400">
                      {formatDate(pipeline.createdAt)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-500 dark:text-gray-400">
                      {formatDate(pipeline.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-4">
          <PaginationInfo page={page} pageSize={PAGE_SIZE} totalItems={totalItems} />
          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}
    </PageContainer>
  );
}
