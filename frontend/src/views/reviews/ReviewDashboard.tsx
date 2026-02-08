/**
 * ReviewDashboard — admin view for managing human review tasks.
 * Shows a queue of pending reviews with filtering and decision submission.
 */
import { useState, useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { Badge, Button, Card, Input } from '@/components/ui';
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

  // Fetch review queue
  const { data: tasks, error, isLoading, mutate } = useSWR(
    ['reviews', statusFilter],
    () =>
      statusFilter === 'all'
        ? ReviewService.getMyQueue()
        : ReviewService.list(statusFilter),
    { refreshInterval: 30000 }
  );

  const filteredTasks = tasks ?? [];

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
      mutate();
    } catch (err) {
      console.error('Submit decision error:', err);
      toastError(t('reviews.dashboard.detail.submitError', 'Failed to submit decision'));
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedTask, decision, decisionNotes, t, mutate]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('reviews.dashboard.title', 'Review Queue')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('reviews.dashboard.subtitle', 'Manage pending review tasks')}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setStatusFilter(btn.key)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              statusFilter === btn.key
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          Failed to load review tasks
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {t('reviews.dashboard.noTasks', 'No review tasks in your queue')}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                selectedTask?.id === task.id
                  ? 'ring-2 ring-blue-500'
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
        <Card className="p-6 mt-4 border-blue-200 dark:border-blue-800">
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
                {selectedTask.decisionOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setDecision(opt)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                      decision === opt
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
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
                className="w-full h-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
  );
}
