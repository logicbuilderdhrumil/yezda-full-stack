/**
 * Organization edit view.
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
import { OrganizationsService } from '@/services';
import { handleApiError } from '@/utils';
import type { Organization, CreateOrganizationPayload } from '@/@types/organization';
import { OrganizationForm } from './OrganizationForm';

/**
 * OrganizationEditView renders the form to edit an existing organization.
 */
export function OrganizationEditView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchOrganization = async () => {
      if (!id) {
        navigate('/admin/organizations');
        return;
      }

      try {
        const data = await OrganizationsService.get(id);
        if (isMounted) {
          setOrganization(data);
        }
      } catch (error) {
        handleApiError(error);
        toastError(t('organizations.edit.fetchError'));
        navigate('/admin/organizations');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOrganization();

    return () => {
      isMounted = false;
    };
  }, [id, navigate, t]);

  const handleSubmit = async (data: CreateOrganizationPayload) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      await OrganizationsService.update(id, data);
      toastSuccess(t('organizations.edit.success'));
      navigate(`/admin/organizations/${id}`);
    } catch (error) {
      handleApiError(error);
      toastError(t('organizations.edit.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(id ? `/admin/organizations/${id}` : '/admin/organizations');
  };

  if (isLoading) {
    return (
      <PageContainer title={t('organizations.edit.title')}>
        <SkeletonCard />
      </PageContainer>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <PageContainer
      title={t('organizations.edit.title')}
      description={t('organizations.edit.description', { name: organization.name })}
    >
      <Card>
        <CardContent className="pt-6">
          <OrganizationForm
            initialData={organization}
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
