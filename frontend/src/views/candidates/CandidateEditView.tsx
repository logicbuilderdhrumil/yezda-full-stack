/**
 * Candidate edit view.
 */
import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layouts';
import {
  Card,
  CardContent,
  SkeletonCard,
  toastSuccess,
  toastError,
} from '@/components/ui';
import { CandidatesService } from '@/services';
import { handleApiError } from '@/utils';
import type { Candidate, UpdateCandidatePayload } from '@/@types/candidate';
import { CandidateForm, type CandidateFormSubmitData } from './CandidateForm';

/**
 * CandidateEditView renders the form to edit an existing candidate.
 */
export function CandidateEditView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        toastError(t('candidates.edit.fetchError'));
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

  const handleSubmit = async (data: CandidateFormSubmitData) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      // Extract only fields valid for update
      const updatePayload: UpdateCandidatePayload = {
        firstName: data.firstName,
        lastName: data.lastName,
      };
      if ('phone' in data && data.phone) {
        updatePayload.phone = data.phone;
      }
      if ('status' in data && data.status) {
        updatePayload.status = data.status;
      }
      await CandidatesService.update(id, updatePayload);
      toastSuccess(t('candidates.edit.success'));
      navigate(`/candidates/${id}`);
    } catch (error) {
      handleApiError(error);
      toastError(t('candidates.edit.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(id ? `/candidates/${id}` : '/candidates');
  };

  if (isLoading) {
    return (
      <PageContainer title={t('candidates.edit.title')}>
        <SkeletonCard />
      </PageContainer>
    );
  }

  if (!candidate) {
    return null;
  }

  return (
    <PageContainer
      title={t('candidates.edit.title')}
      description={t('candidates.edit.description', { name: `${candidate.firstName} ${candidate.lastName}` })}
    >
      <Card>
        <CardContent className="pt-6">
          <CandidateForm
            initialData={candidate}
            isEdit
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
