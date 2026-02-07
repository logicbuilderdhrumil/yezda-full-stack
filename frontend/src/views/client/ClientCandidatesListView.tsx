/**
 * ClientCandidatesListView displays an org-scoped paginated list of candidates
 * with search, status filter, and navigation to detail views.
 */

import { useState, useEffect, useCallback, type ReactNode, type ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageContainer } from '@/components/layouts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Badge,
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Pagination,
  PaginationInfo,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { ClientPortalService } from '@/services/ClientPortalService';
import type { ClientCandidate, ClientCandidateListResponse } from '@/services/ClientPortalService';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
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

/** Formats a status string for display. */
function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Formats an ISO date string. */
function formatDate(dateString: string): string {
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

/** Loading skeleton for the candidates table. */
function TableSkeleton(): ReactNode {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main View
// -----------------------------------------------------------------------------

/**
 * ClientCandidatesListView displays a searchable, filterable, paginated
 * table of candidates for the client organisation.
 */
export function ClientCandidatesListView(): ReactNode {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial state from URL search params
  const initialPage = Number(searchParams.get('page') ?? '1');
  const initialSearch = searchParams.get('search') ?? '';
  const initialStatus = searchParams.get('status') ?? '';

  const [data, setData] = useState<ClientCandidateListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (status) params.set('status', status);
    setSearchParams(params, { replace: true });
  }, [page, debouncedSearch, status, setSearchParams]);

  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await ClientPortalService.getCandidates({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: status || undefined,
      });
      setData(result);
    } catch {
      setError('Failed to load candidates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, status]);

  useEffect(() => {
    void fetchCandidates();
  }, [fetchCandidates]);

  const handleRowClick = (candidate: ClientCandidate) => {
    navigate(`/candidates/${candidate.id}`);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Error state
  if (error && !data) {
    return (
      <PageContainer title="Candidates" description="View and manage your candidates">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button variant="outline" onClick={() => void fetchCandidates()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const candidates = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const totalItems = data?.meta?.total ?? 0;

  return (
    <PageContainer title="Candidates" description="View and manage your candidates">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search candidates..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
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
          <CardTitle>Candidates</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton />
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {debouncedSearch || status
                  ? 'No candidates match your filters.'
                  : 'No candidates yet.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow
                    key={candidate.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(candidate)}
                  >
                    <TableCell className="font-medium">
                      {candidate.firstName} {candidate.lastName}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-500 dark:text-gray-400">
                      {candidate.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(candidate.screeningStatus)}>
                        {formatStatus(candidate.screeningStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-gray-500 dark:text-gray-400">
                      {formatDate(candidate.submittedAt)}
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
          <PaginationInfo
            page={page}
            pageSize={PAGE_SIZE}
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
