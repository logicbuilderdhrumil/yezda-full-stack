/**
 * Pipeline details view with stages and assignments.
 */
import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layouts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  SkeletonCard,
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
import { formatDate, handleApiError } from '@/utils';
import type { ScreeningPipeline, PipelineStatus } from '@/@types/pipeline';

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

interface DetailRowProps {
  label: string;
  value: string | undefined;
}

function DetailRow({ label, value }: DetailRowProps): ReactNode {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 py-3">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="col-span-2 text-sm text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
  );
}

/**
 * PipelineDetailsView displays the details of a single screening pipeline.
 */
export function PipelineDetailsView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [pipeline, setPipeline] = useState<ScreeningPipeline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchPipeline = async () => {
      if (!id) {
        navigate('/admin/pipelines');
        return;
      }

      try {
        const data = await PipelineService.getById(id);
        if (isMounted) {
          setPipeline(data);
        }
      } catch (error) {
        handleApiError(error);
        toastError(t('pipelines.details.fetchError', 'Failed to load pipeline'));
        navigate('/admin/pipelines');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPipeline();

    return () => {
      isMounted = false;
    };
  }, [id, navigate, t]);

  const handleEdit = () => {
    if (id) {
      navigate(`/admin/pipelines/${id}/edit`);
    }
  };

  const handleBack = () => {
    navigate('/admin/pipelines');
  };

  const handleActivate = async () => {
    if (!id) return;
    try {
      const updated = await PipelineService.activate(id);
      setPipeline(updated);
      toastSuccess(t('pipelines.actions.activateSuccess', 'Pipeline activated successfully'));
    } catch (error) {
      handleApiError(error);
      toastError(t('pipelines.actions.activateError', 'Failed to activate pipeline'));
    }
  };

  const handleArchive = async () => {
    if (!id) return;
    try {
      const updated = await PipelineService.archive(id);
      setPipeline(updated);
      toastSuccess(t('pipelines.actions.archiveSuccess', 'Pipeline archived successfully'));
    } catch (error) {
      handleApiError(error);
      toastError(t('pipelines.actions.archiveError', 'Failed to archive pipeline'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await PipelineService.delete(id);
      toastSuccess(t('pipelines.actions.deleteSuccess', 'Pipeline deleted successfully'));
      navigate('/admin/pipelines');
    } catch (error) {
      handleApiError(error);
      toastError(t('pipelines.actions.deleteError', 'Failed to delete pipeline'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title={t('pipelines.details.title', 'Pipeline Details')}>
        <SkeletonCard />
      </PageContainer>
    );
  }

  if (!pipeline) {
    return null;
  }

  const sortedStages = [...(pipeline.stages || [])].sort((a, b) => a.order - b.order);

  return (
    <PageContainer
      title={pipeline.name}
      description={t('pipelines.details.description', 'View pipeline details and stages')}
    >
      <div className="space-y-6">
        {/* Header actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBack}>
            ← {t('common.back', 'Back')}
          </Button>
          <div className="flex gap-2">
            {pipeline.status === 'draft' && (
              <>
                <Button variant="outline" onClick={handleEdit}>
                  {t('common.edit', 'Edit')}
                </Button>
                <Button variant="outline" onClick={handleActivate}>
                  {t('pipelines.actions.activate', 'Activate')}
                </Button>
                <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                  {t('common.delete', 'Delete')}
                </Button>
              </>
            )}
            {pipeline.status === 'active' && (
              <Button variant="outline" onClick={handleArchive}>
                {t('pipelines.actions.archive', 'Archive')}
              </Button>
            )}
          </div>
        </div>

        {/* Pipeline info card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{pipeline.name}</CardTitle>
                <CardDescription>{pipeline.description || t('pipelines.details.noDescription', 'No description')}</CardDescription>
              </div>
              <Badge variant={getStatusVariant(pipeline.status)}>
                {t(`pipelines.status.${pipeline.status}`, pipeline.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-gray-200 dark:divide-gray-700">
              <DetailRow label={t('pipelines.details.id', 'ID')} value={pipeline.id} />
              <DetailRow label={t('pipelines.details.version', 'Version')} value={String(pipeline.version)} />
              <DetailRow
                label={t('pipelines.details.createdAt', 'Created At')}
                value={formatDate(pipeline.createdAt)}
              />
              <DetailRow
                label={t('pipelines.details.updatedAt', 'Updated At')}
                value={formatDate(pipeline.updatedAt)}
              />
            </dl>
          </CardContent>
        </Card>

        {/* Stages card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('pipelines.details.stagesTitle', 'Stages')} ({sortedStages.length})
            </CardTitle>
            <CardDescription>
              {t('pipelines.details.stagesDescription', 'The steps in this screening pipeline')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedStages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                {t('pipelines.details.noStages', 'No stages defined')}
              </p>
            ) : (
              <div className="space-y-4">
                {sortedStages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{stage.name}</span>
                        <Badge variant={stage.isRequired ? 'default' : 'outline'}>
                          {stage.isRequired
                            ? t('pipelines.stage.required', 'Required')
                            : t('pipelines.stage.optional', 'Optional')}
                        </Badge>
                      </div>
                      {stage.description && (
                        <p className="text-sm text-gray-500 mt-1">{stage.description}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        {stage.estimatedDurationMinutes && (
                          <span>
                            {t('pipelines.stage.estimatedTime', 'Est. {{mins}} min', { mins: stage.estimatedDurationMinutes })}
                          </span>
                        )}
                        <span>Form: {stage.formDefinitionId.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignments placeholder - for active pipelines */}
        {pipeline.status === 'active' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('pipelines.details.assignmentsTitle', 'Candidate Assignments')}</CardTitle>
              <CardDescription>
                {t('pipelines.details.assignmentsDescription', 'Candidates currently assigned to this pipeline')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-4">
                {t('pipelines.details.assignmentsComing', 'Assignment tracking coming soon. Use the candidate detail view to assign pipelines.')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

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
