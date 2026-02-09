/**
 * Organization create view.
 */
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layouts';
import { Card, CardContent, toastSuccess, toastError } from '@/components/ui';
import { OrganizationsService } from '@/services';
import { handleApiError } from '@/utils';
import type { CreateOrganizationPayload } from '@/@types/organization';
import { OrganizationForm } from './OrganizationForm';

/**
 * OrganizationCreateView renders the form to create a new organization.
 */
export function OrganizationCreateView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateOrganizationPayload) => {
    setIsSubmitting(true);
    try {
      const created = await OrganizationsService.create(data);
      toastSuccess(t('organizations.create.success'));
      navigate(`/admin/organizations/${created.id}`);
    } catch (error) {
      handleApiError(error);
      toastError(t('organizations.create.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/organizations');
  };

  return (
    <PageContainer
      title={t('organizations.create.title')}
      description={t('organizations.create.description')}
    >
      <Card>
        <CardContent className="pt-6">
          <OrganizationForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
