/**
 * ClientCandidateDetailView shows a single candidate's info and
 * screening pipeline progress with step-by-step visualization.
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/layouts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Skeleton,
  Separator,
  Progress,
} from '@/components/ui';
import { ClientPortalService } from '@/services/ClientPortalService';
import type { ClientCandidateDetail, ScreeningStep } from '@/services/ClientPortalService';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Maps screening status to a badge variant. */
function statusVariant(
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

/** Maps a result to a badge variant. */
function resultVariant(
  result?: string
): 'success' | 'destructive' | 'warning' | 'secondary' {
  switch (result) {
    case 'pass':
      return 'success';
    case 'fail':
      return 'destructive';
    case 'pending':
      return 'warning';
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

/** Computes pipeline completion percentage. */
function getPipelineProgress(steps: ScreeningStep[]): number {
  if (steps.length === 0) return 0;
  const completed = steps.filter((s) => s.status === 'completed' || s.status === 'failed').length;
  return Math.round((completed / steps.length) * 100);
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

/** Icon for a pipeline step based on its status. */
function StepIcon({ step }: { step: ScreeningStep }): ReactNode {
  switch (step.status) {
    case 'completed':
      return step.result === 'fail' ? (
        <XCircle className="h-5 w-5 text-red-500" />
      ) : (
        <CheckCircle className="h-5 w-5 text-green-500" />
      );
    case 'in_progress':
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-400" />;
  }
}

/** A single pipeline step row. */
function PipelineStepRow({ step }: { step: ScreeningStep }): ReactNode {
  return (
    <div className="flex items-center gap-4 py-3">
      <StepIcon step={step} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{step.name}</p>
        {step.completedAt && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Completed {formatDate(step.completedAt)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={statusVariant(step.status)} className="text-[10px]">
          {formatStatus(step.status)}
        </Badge>
        {step.result && (
          <Badge variant={resultVariant(step.result)} className="text-[10px]">
            {formatStatus(step.result)}
          </Badge>
        )}
      </div>
    </div>
  );
}

/** Loading skeleton for the detail view. */
function DetailSkeleton(): ReactNode {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main View
// -----------------------------------------------------------------------------

/**
 * ClientCandidateDetailView shows full candidate information and
 * provides a step-by-step screening pipeline progress visualization.
 */
export function ClientCandidateDetailView(): ReactNode {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<ClientCandidateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidate = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await ClientPortalService.getCandidateDetail(id);
      setCandidate(result);
    } catch {
      setError('Failed to load candidate details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchCandidate();
  }, [fetchCandidate]);

  const handleBack = () => {
    navigate('/candidates');
  };

  // Error state
  if (error && !candidate) {
    return (
      <PageContainer>
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Candidates
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button variant="outline" onClick={() => void fetchCandidate()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <PageContainer>
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Candidates
        </Button>
        <DetailSkeleton />
      </PageContainer>
    );
  }

  if (!candidate) {
    return (
      <PageContainer>
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Candidates
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Candidate not found.</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const progress = getPipelineProgress(candidate.screeningPipeline ?? []);

  return (
    <PageContainer>
      <Button variant="ghost" onClick={handleBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Candidates
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>
                {candidate.firstName} {candidate.lastName}
              </CardTitle>
              <CardDescription>{candidate.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidate.phone && (
                <InfoRow label="Phone" value={candidate.phone} />
              )}
              {candidate.position && (
                <InfoRow label="Position" value={candidate.position} />
              )}
              {candidate.department && (
                <InfoRow label="Department" value={candidate.department} />
              )}
              <Separator />
              <InfoRow label="Status">
                <Badge variant={statusVariant(candidate.screeningStatus)}>
                  {formatStatus(candidate.screeningStatus)}
                </Badge>
              </InfoRow>
              <InfoRow label="Submitted" value={formatDate(candidate.submittedAt)} />
              <InfoRow label="Last Updated" value={formatDate(candidate.updatedAt)} />
              {candidate.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{candidate.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Screening Pipeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Screening Pipeline</CardTitle>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {progress}% complete
                </span>
              </div>
              <Progress value={progress} className="mt-2" />
            </CardHeader>
            <CardContent>
              {(candidate.screeningPipeline?.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No screening steps configured.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {candidate.screeningPipeline.map((step) => (
                    <PipelineStepRow key={step.id} step={step} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

// -----------------------------------------------------------------------------
// Utility Component
// -----------------------------------------------------------------------------

interface InfoRowProps {
  label: string;
  value?: string;
  children?: ReactNode;
}

/** A simple label-value info row. */
function InfoRow({ label, value, children }: InfoRowProps): ReactNode {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      {children ?? <span className="text-gray-900 dark:text-gray-100">{value}</span>}
    </div>
  );
}
