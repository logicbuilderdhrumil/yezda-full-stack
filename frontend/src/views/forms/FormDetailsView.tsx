/**
 * Form details view.
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
  Button,
  Badge,
  LoadingSpinner,
  toastError,
} from '@/components/ui';
import { FormsService } from '@/services';
import { formatDate } from '@/utils';
import type { Form, FormStatus } from '@/@types/form';

/**
 * Returns badge variant for form status.
 */
function getStatusVariant(status: FormStatus): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'published':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'archived':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/**
 * FormDetailsView displays form information and schema summary.
 */
export function FormDetailsView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<Form | null>(null);

  useEffect(() => {
    const fetchForm = async () => {
      if (!id) return;
      try {
        const data = await FormsService.get(id);
        setForm(data);
      } catch (error) {
        toastError(t('forms.details.fetchError'));
        console.error('Failed to fetch form:', error);
        navigate('/admin/forms');
      } finally {
        setIsLoading(false);
      }
    };

    fetchForm();
  }, [id, navigate, t]);

  if (isLoading) {
    return (
      <PageContainer title={t('forms.details.title')} description={t('forms.details.description')}>
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </PageContainer>
    );
  }

  if (!form) {
    return null;
  }

  return (
    <PageContainer
      title={form.name}
      description={t('forms.details.description')}
    >
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/forms')}>
            {t('common.back')}
          </Button>
          <Button onClick={() => navigate(`/admin/forms/${id}/edit`)}>
            {t('common.edit')}
          </Button>
        </div>

        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle>{t('forms.details.overview')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  {t('forms.details.id')}
                </dt>
                <dd className="mt-1 text-sm text-foreground font-mono">
                  {form.id}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  {t('forms.details.status')}
                </dt>
                <dd className="mt-1">
                  <Badge variant={getStatusVariant(form.status)}>
                    {t(`forms.status.${form.status}`)}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  {t('forms.details.createdAt')}
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {formatDate(form.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  {t('forms.details.updatedAt')}
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {formatDate(form.updatedAt)}
                </dd>
              </div>
              {form.description && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-muted-foreground">
                    {t('forms.details.description')}
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {form.description}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Schema Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{t('forms.details.schema')}</CardTitle>
          </CardHeader>
          <CardContent>
            {form.schema.fields.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('forms.details.noFields')}
              </p>
            ) : (
              <div className="space-y-3">
                {form.schema.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-4 rounded-lg border border-border p-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded bg-muted text-sm font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {field.label}
                        </span>
                        {field.validation?.required && (
                          <span className="text-xs text-red-500">*</span>
                        )}
                      </div>
                      <span className="text-xs uppercase text-muted-foreground">{field.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
