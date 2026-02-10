/**
 * ScreeningListView displays a paginated, filterable table of screening
 * requests for the client organisation.
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { PageContainer } from '@/components/layouts';
import {
  Badge,
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
import { ErrorState } from '@/components/shared';
import { ClientPortalService } from '@/services/ClientPortalService';
import type { ScreeningListResponse } from '@/services/ClientPortalService';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
] as const;

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'background_check', label: 'Background Check' },
  { value: 'identity_verification', label: 'Identity Verification' },
  { value: 'right_to_work', label: 'Right to Work' },
  { value: 'dbs_check', label: 'DBS Check' },
  { value: 'reference_check', label: 'Reference Check' },
] as const;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Maps screening status to a badge variant. */
function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'default';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/** Maps screening result to a badge variant. */
function getResultBadgeVariant(
  result: string | null | undefined
): 'success' | 'destructive' | 'secondary' {
  switch (result) {
    case 'pass':
      return 'success';
    case 'fail':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/** Formats a snake_case string for display. */
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
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main View
// -----------------------------------------------------------------------------

export function ScreeningListView(): ReactNode {
  const [data, setData] = useState<ScreeningListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');

  const fetchScreenings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await ClientPortalService.getScreenings({
        page,
        limit: PAGE_SIZE,
        ...(status !== 'all' ? { status } : {}),
        ...(type !== 'all' ? { type } : {}),
      });
      setData(result);
    } catch {
      setError('Failed to load screenings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [page, status, type]);

  useEffect(() => {
    void fetchScreenings();
  }, [fetchScreenings]);

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Error state
  if (error && !data) {
    return (
      <PageContainer title="Screenings" description="Track screening requests and results">
        <ErrorState
          title="Failed to load screenings"
          error={error}
          onRetry={() => void fetchScreenings()}
        />
      </PageContainer>
    );
  }

  const screenings = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const totalItems = data?.meta?.total ?? 0;

  return (
    <PageContainer title="Screenings" description="Track screening requests and results">
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

        <Select value={type} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
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
          <CardTitle>Screening Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : screenings.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {status !== 'all' || type !== 'all'
                  ? 'No screenings match your filters.'
                  : 'No screenings yet.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Requested</TableHead>
                  <TableHead className="hidden md:table-cell">Completed</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {screenings.map((screening) => (
                  <TableRow key={screening.id}>
                    <TableCell className="font-medium">
                      {screening.candidateName}
                    </TableCell>
                    <TableCell>{formatLabel(screening.type)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(screening.status)}>
                        {formatLabel(screening.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {formatDate(screening.requestedAt)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {formatDate(screening.completedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getResultBadgeVariant(screening.result)}>
                        {screening.result ? formatLabel(screening.result) : 'Pending'}
                      </Badge>
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
