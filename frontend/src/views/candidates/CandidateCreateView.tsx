/**
 * Candidate create view.
 */
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layouts';
import { Card, CardContent, toastSuccess, toastError } from '@/components/ui';
import { CandidatesService } from '@/services';
import { handleApiError } from '@/utils';
import type { CreateCandidatePayload } from '@/@types/candidate';
import { CandidateForm, type CandidateFormSubmitData } from './CandidateForm';

/**
 * Type guard to check if data is CreateCandidatePayload.
 */
function isCreatePayload(data: CandidateFormSubmitData): data is CreateCandidatePayload {
  return !('status' in data);
}

/**
 * CandidateCreateView renders the form to create a new candidate.
 */
export function CandidateCreateView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CandidateFormSubmitData) => {
    if (!isCreatePayload(data)) {
      toastError(t('candidates.create.error'));
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await CandidatesService.create(data);
      toastSuccess(t('candidates.create.success'));
      navigate(`/candidates/${created.id}`);
    } catch (error) {
      handleApiError(error);
      toastError(t('candidates.create.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/candidates');
  };

  return (
    <PageContainer
      title={t('candidates.create.title')}
      description={t('candidates.create.description')}
    >
      <Card>
        <CardContent className="pt-6">
          <CandidateForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
