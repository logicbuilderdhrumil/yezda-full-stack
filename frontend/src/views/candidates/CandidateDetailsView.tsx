/**
 * Candidate details view with tabs/sections.
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toastError,
  toastSuccess,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { CandidatesService, PipelineService } from '@/services';
import { formatDate, handleApiError } from '@/utils';
import type { Candidate, CandidateStatus } from '@/@types/candidate';
import type { PipelineAssignment, ScreeningPipeline, AssignmentStatus } from '@/@types/pipeline';

/**
 * Returns badge variant for candidate status.
 */
function getStatusVariant(status: CandidateStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'certified':
      return 'default';
    case 'archived':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Returns badge variant for assignment status.
 */
function getAssignmentStatusVariant(status: AssignmentStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default';
    case 'in_progress':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    case 'on_hold':
      return 'outline';
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
 * CandidateDetailsView displays the details of a single candidate with tabs.
 */
export function CandidateDetailsView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pipeline assignment state
  const [assignments, setAssignments] = useState<PipelineAssignment[]>([]);
  const [availablePipelines, setAvailablePipelines] = useState<ScreeningPipeline[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch candidate and assignments
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!id) {
        navigate('/candidates');
        return;
      }

      try {
        const data = await CandidatesService.get(id);
        if (isMounted) {
          setCandidate(data);
        }
      } catch (error) {
        handleApiError(error);
        toastError(t('candidates.details.fetchError'));
        navigate('/candidates');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, navigate, t]);

  // Fetch pipeline assignments
  useEffect(() => {
    let isMounted = true;

    const fetchAssignments = async () => {
      if (!id) return;

      setIsLoadingAssignments(true);
      try {
        const data = await PipelineService.getCandidateAssignments(id);
        if (isMounted) {
          setAssignments(data);
        }
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
        // Don't show error toast - assignments are optional feature
      } finally {
        if (isMounted) {
          setIsLoadingAssignments(false);
        }
      }
    };

    fetchAssignments();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleOpenAssignDialog = async () => {
    try {
      const response = await PipelineService.list({ status: 'active', pageSize: 100 });
      setAvailablePipelines(response.data);
      setAssignDialogOpen(true);
    } catch (error) {
      handleApiError(error);
      toastError(t('candidates.pipelines.loadError', 'Failed to load available pipelines'));
    }
  };

  const handleAssignPipeline = async () => {
    if (!selectedPipelineId || !id) return;

    setIsAssigning(true);
    try {
      const assignment = await PipelineService.assign(selectedPipelineId, id);
      setAssignments((prev) => [...prev, assignment]);
      toastSuccess(t('candidates.pipelines.assignSuccess', 'Pipeline assigned successfully'));
      setAssignDialogOpen(false);
      setSelectedPipelineId('');
    } catch (error) {
      handleApiError(error);
      toastError(t('candidates.pipelines.assignError', 'Failed to assign pipeline'));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleEdit = () => {
    if (id) {
      navigate(`/candidates/${id}/edit`);
    }
  };

  const handleBack = () => {
    navigate('/candidates');
  };

  if (isLoading) {
    return (
      <PageContainer title={t('candidates.details.title')}>
        <SkeletonCard />
      </PageContainer>
    );
  }

  if (!candidate) {
    return null;
  }

  const fullName = `${candidate.firstName} ${candidate.lastName}`.trim();

  return (
    <PageContainer
      title={fullName || candidate.email}
      description={t('candidates.details.description')}
    >
      <div className="space-y-6">
        {/* Header actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBack}>
            ← {t('common.back')}
          </Button>
          <Button onClick={handleEdit}>{t('common.edit')}</Button>
        </div>

        {/* Main content with tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">{t('candidates.details.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="pipelines">{t('candidates.details.tabs.pipelines', 'Pipelines')}</TabsTrigger>
            <TabsTrigger value="history">{t('candidates.details.tabs.history')}</TabsTrigger>
            <TabsTrigger value="documents">{t('candidates.details.tabs.documents')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Basic info card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{fullName || candidate.email}</CardTitle>
                    <CardDescription>{candidate.email}</CardDescription>
                  </div>
                  <Badge variant={getStatusVariant(candidate.status)}>
                    {t(`candidates.status.${candidate.status}`)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                  <DetailRow label={t('candidates.details.id')} value={candidate.id} />
                  <DetailRow label={t('candidates.details.firstName')} value={candidate.firstName} />
                  <DetailRow label={t('candidates.details.lastName')} value={candidate.lastName} />
                  <DetailRow label={t('candidates.details.email')} value={candidate.email} />
                  <DetailRow label={t('candidates.details.phone')} value={candidate.phone} />
                  <DetailRow
                    label={t('candidates.details.createdAt')}
                    value={formatDate(candidate.createdAt)}
                  />
                  <DetailRow
                    label={t('candidates.details.updatedAt')}
                    value={formatDate(candidate.updatedAt)}
                  />
                </dl>
              </CardContent>
            </Card>

            {/* Organization card (if applicable) */}
            {candidate.organizationName && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('candidates.details.organizationTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                    <DetailRow
                      label={t('candidates.details.organization')}
                      value={candidate.organizationName}
                    />
                  </dl>
                </CardContent>
              </Card>
            )}

            {/* Status-specific info */}
            {(candidate.certifiedAt || candidate.archivedAt) && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('candidates.details.statusInfoTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                    {candidate.submittedAt && (
                      <DetailRow
                        label={t('candidates.details.submittedAt')}
                        value={formatDate(candidate.submittedAt)}
                      />
                    )}
                    {candidate.certifiedAt && (
                      <DetailRow
                        label={t('candidates.details.certifiedAt')}
                        value={formatDate(candidate.certifiedAt)}
                      />
                    )}
                    {candidate.archivedAt && (
                      <DetailRow
                        label={t('candidates.details.archivedAt')}
                        value={formatDate(candidate.archivedAt)}
                      />
                    )}
                  </dl>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pipelines" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('candidates.pipelines.title', 'Pipeline Assignments')}</CardTitle>
                    <CardDescription>
                      {t('candidates.pipelines.description', 'Screening pipelines assigned to this candidate')}
                    </CardDescription>
                  </div>
                  <Button onClick={handleOpenAssignDialog}>
                    {t('candidates.pipelines.assignButton', 'Assign Pipeline')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingAssignments ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    {t('common.loading', 'Loading...')}
                  </p>
                ) : assignments.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    {t('candidates.pipelines.noAssignments', 'No pipelines assigned yet')}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              Pipeline: {assignment.pipelineId.substring(0, 8)}...
                            </span>
                            <Badge variant={getAssignmentStatusVariant(assignment.status)}>
                              {t(`candidates.pipelines.status.${assignment.status}`, assignment.status)}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">
                            {t('candidates.pipelines.assignedAt', 'Assigned')}: {formatDate(assignment.assignedAt)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>{t('candidates.pipelines.progress', 'Progress')}</span>
                            <span>{assignment.progressPercentage}%</span>
                          </div>
                          <Progress value={assignment.progressPercentage} />
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          {t('candidates.pipelines.currentStage', 'Current Stage')}: {assignment.currentStageOrder + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('candidates.details.historyTitle')}</CardTitle>
                <CardDescription>{t('candidates.details.historyDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('candidates.details.noHistory')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('candidates.details.documentsTitle')}</CardTitle>
                <CardDescription>{t('candidates.details.documentsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('candidates.details.noDocuments')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Assign pipeline dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('candidates.pipelines.assignDialogTitle', 'Assign Pipeline')}</DialogTitle>
            <DialogDescription>
              {t('candidates.pipelines.assignDialogDescription', 'Select a pipeline to assign to this candidate')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
              <SelectTrigger>
                <SelectValue placeholder={t('candidates.pipelines.selectPlaceholder', 'Select a pipeline')} />
              </SelectTrigger>
              <SelectContent>
                {availablePipelines.length === 0 ? (
                  <SelectItem value="none" disabled>
                    {t('candidates.pipelines.noPipelines', 'No active pipelines available')}
                  </SelectItem>
                ) : (
                  availablePipelines.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.name} ({pipeline.stages?.length || 0} stages)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)} disabled={isAssigning}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleAssignPipeline} disabled={!selectedPipelineId || isAssigning}>
              {isAssigning ? t('common.assigning', 'Assigning...') : t('common.assign', 'Assign')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
