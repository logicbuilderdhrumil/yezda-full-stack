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
} from '@/components/ui';
import { CandidatesService } from '@/services';
import { formatDate, handleApiError } from '@/utils';
import type { Candidate, CandidateStatus } from '@/@types/candidate';

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

  useEffect(() => {
    let isMounted = true;

    const fetchCandidate = async () => {
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

    fetchCandidate();

    return () => {
      isMounted = false;
    };
  }, [id, navigate, t]);

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
    </PageContainer>
  );
}
