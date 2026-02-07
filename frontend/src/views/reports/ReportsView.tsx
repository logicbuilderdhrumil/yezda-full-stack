/**
 * ReportsView displays screening report data with KPI summary cards,
 * a by-type breakdown table, and a monthly trend table.
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { PageContainer } from '@/components/layouts';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { ClientPortalService } from '@/services/ClientPortalService';
import type { ScreeningReportData } from '@/services/ClientPortalService';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Formats a snake_case string for display. */
function formatLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

interface KpiCardProps {
  title: string;
  value: string | number;
}

function KpiCard({ title, value }: KpiCardProps): ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function KpiSkeleton(): ReactNode {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton(): ReactNode {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main View
// -----------------------------------------------------------------------------

export function ReportsView(): ReactNode {
  const [data, setData] = useState<ScreeningReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await ClientPortalService.getReport();
      setData(result);
    } catch {
      setError('Failed to load report data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  // Error state
  if (error && !data) {
    return (
      <PageContainer title="Reports" description="Screening analytics and statistics">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button variant="outline" onClick={() => void fetchReport()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const summary = data?.summary;
  const byType = data?.byType ?? [];
  const monthlyTrend = data?.monthlyTrend ?? [];

  return (
    <PageContainer title="Reports" description="Screening analytics and statistics">
      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-7 mb-8">
        {isLoading ? (
          Array.from({ length: 7 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard title="Total Screenings" value={summary?.totalScreenings ?? 0} />
            <KpiCard title="Completed" value={summary?.completed ?? 0} />
            <KpiCard title="In Progress" value={summary?.inProgress ?? 0} />
            <KpiCard title="Pending" value={summary?.pending ?? 0} />
            <KpiCard title="Failed" value={summary?.failed ?? 0} />
            <KpiCard
              title="Pass Rate"
              value={`${(summary?.passRate ?? 0).toFixed(1)}%`}
            />
            <KpiCard
              title="Avg Days to Complete"
              value={(summary?.averageDaysToComplete ?? 0).toFixed(1)}
            />
          </>
        )}
      </div>

      {/* By Type Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>By Type</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : byType.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No type data available.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Pass Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byType.map((row) => (
                  <TableRow key={row.type}>
                    <TableCell className="font-medium">
                      {formatLabel(row.type)}
                    </TableCell>
                    <TableCell>{row.count}</TableCell>
                    <TableCell>{row.passRate.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trend</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton />
          ) : monthlyTrend.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No trend data available.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyTrend.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell className="font-medium">{row.month}</TableCell>
                    <TableCell>{row.completed}</TableCell>
                    <TableCell>{row.submitted}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
