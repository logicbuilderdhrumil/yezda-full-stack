/**
 * ReviewDashboard — admin view for managing human review tasks.
 * Shows a queue of pending reviews with filtering and decision submission.
 */
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import { LoadingState, EmptyState, ErrorState } from '@/components/shared';
import { ReviewService, type ReviewTask, type ReviewDecisionDto } from '@/services';
import { toastSuccess, toastError } from '@/components/ui';

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

type ReviewStatusFilter = 'all' | 'pending' | 'assigned' | 'in_review';

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  assigned: 'secondary',
  in_review: 'default',
  decided: 'default',
  escalated: 'destructive',
  expired: 'destructive',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewDashboard(): ReactNode {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<ReviewStatusFilter>('all');
  const [selectedTask, setSelectedTask] = useState<ReviewTask | null>(null);
  const [decision, setDecision] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch review queue
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data =
        statusFilter === 'all'
          ? await ReviewService.getMyQueue()
          : await ReviewService.list(statusFilter);
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load review tasks:', err);
      setError(err instanceof Error ? err : new Error('Failed to load'));
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchTasks();
    // Refresh every 30 seconds
    const interval = setInterval(() => void fetchTasks(), 30000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const filteredTasks = Array.isArray(tasks) ? tasks : [];

  const filterButtons: { key: ReviewStatusFilter; label: string }[] = [
    { key: 'all', label: t('reviews.dashboard.filters.all', 'All') },
    { key: 'pending', label: t('reviews.dashboard.filters.pending', 'Pending') },
    { key: 'assigned', label: t('reviews.dashboard.filters.assigned', 'Assigned') },
    { key: 'in_review', label: t('reviews.dashboard.filters.inReview', 'In Review') },
  ];

  const handleSubmitDecision = useCallback(async () => {
    if (!selectedTask || !decision) return;

    setIsSubmitting(true);
    try {
      const dto: ReviewDecisionDto = {
        decision,
        ...(decisionNotes.trim() ? { decisionNotes: decisionNotes.trim() } : {}),
      };
      await ReviewService.submitDecision(selectedTask.id, dto);
      toastSuccess(t('reviews.dashboard.detail.submitted', 'Decision submitted'));
      setSelectedTask(null);
      setDecision('');
      setDecisionNotes('');
      void fetchTasks();
    } catch (err) {
      console.error('Submit decision error:', err);
      toastError(t('reviews.dashboard.detail.submitError', 'Failed to submit decision'));
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedTask, decision, decisionNotes, t, fetchTasks]);

  return (
    <PageContainer
      title={t('reviews.dashboard.title', 'Review Queue')}
      description={t('reviews.dashboard.subtitle', 'Manage pending review tasks')}
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex gap-2">
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setStatusFilter(btn.key)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                statusFilter === btn.key
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingState message={t('common.loading', 'Loading...')} className="py-12" />
        ) : error ? (
          <ErrorState
            title={t('reviews.dashboard.loadError', 'Failed to load review tasks')}
            error={error}
            onRetry={() => void fetchTasks()}
          />
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            title={t('reviews.dashboard.noTasks', 'No review tasks in your queue')}
            description={t(
              'reviews.dashboard.noTasksDescription',
              'Review tasks will appear here when candidates need manual review.'
            )}
          />
        ) : (
        <div className="grid gap-3">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                selectedTask?.id === task.id
                  ? 'ring-2 ring-primary-500'
                  : ''
              }`}
              onClick={() => {
                setSelectedTask(task);
                setDecision('');
                setDecisionNotes('');
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {t('reviews.dashboard.table.candidate', 'Candidate')}:{' '}
                      {task.candidateId.slice(0, 8)}...
                    </span>
                    <Badge variant={STATUS_BADGE_VARIANT[task.status] ?? 'outline'}>
                      {task.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {t('reviews.dashboard.table.pipeline', 'Pipeline')}:{' '}
                      {task.pipelineId.slice(0, 8)}...
                    </span>
                    <span>
                      {t('reviews.dashboard.table.assignedDate', 'Assigned')}:{' '}
                      {formatDate(task.createdAt)}
                    </span>
                    {task.dueAt && (
                      <span>
                        {t('reviews.dashboard.table.dueDate', 'Due')}:{' '}
                        {formatDate(task.dueAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {task.assigneeRole}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Decision panel */}
      {selectedTask && (
        <Card className="p-6 mt-4 border-primary-200 dark:border-primary-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('reviews.dashboard.detail.title', 'Review Task')}
          </h3>

          <div className="space-y-4">
            {/* Decision options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('reviews.dashboard.detail.decision', 'Decision')}
              </label>
              <div className="flex flex-wrap gap-2">
                {(selectedTask.decisionOptions ?? []).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setDecision(opt)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                      decision === opt
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-400'
                    }`}
                  >
                    {opt.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('reviews.dashboard.detail.notes', 'Notes')}
              </label>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder={t(
                  'reviews.dashboard.detail.notesPlaceholder',
                  'Add review notes...'
                )}
                className="w-full h-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTask(null)}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                size="sm"
                disabled={!decision || isSubmitting}
                onClick={handleSubmitDecision}
              >
                {isSubmitting
                  ? t('reviews.dashboard.detail.submitting', 'Submitting...')
                  : t('reviews.dashboard.detail.submit', 'Submit Decision')}
              </Button>
            </div>
          </div>
        </Card>
      )}
      </div>
    </PageContainer>
  );
}
