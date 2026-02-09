/**
 * Form edit view with prefilled schema.
 */
import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layouts';
import { Card, CardContent, LoadingSpinner, toastSuccess, toastError } from '@/components/ui';
import { FormsService } from '@/services';
import { handleApiError } from '@/utils';
import type { Form, UpdateFormPayload, FormSchema } from '@/@types/form';
import { FormMetadataForm } from './FormMetadataForm';
import { FormBuilderCanvas } from './FormBuilderCanvas';

type Step = 'metadata' | 'builder';

/**
 * FormEditView renders the form for editing an existing form.
 */
export function FormEditView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [step, setStep] = useState<Step>('metadata');
  const [formData, setFormData] = useState<UpdateFormPayload>({});

  useEffect(() => {
    const fetchForm = async () => {
      if (!id) return;
      try {
        const data = await FormsService.get(id);
        setForm(data);
        const update: UpdateFormPayload = {
          name: data.name,
          status: data.status,
          schema: data.schema,
        };
        if (data.description !== undefined) {
          update.description = data.description;
        }
        setFormData(update);
      } catch (error) {
        toastError(t('forms.edit.fetchError'));
        console.error('Failed to fetch form:', error);
        navigate('/admin/forms');
      } finally {
        setIsLoading(false);
      }
    };

    fetchForm();
  }, [id, navigate, t]);

  const handleMetadataSubmit = (data: Partial<UpdateFormPayload>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep('builder');
  };

  const handleSchemaChange = (schema: FormSchema) => {
    setFormData((prev) => ({ ...prev, schema }));
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await FormsService.update(id, formData);
      toastSuccess(t('forms.edit.success'));
      navigate(`/admin/forms/${id}`);
    } catch (error) {
      handleApiError(error);
      toastError(t('forms.edit.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (step === 'builder') {
      setStep('metadata');
    } else {
      navigate(`/admin/forms/${id}`);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title={t('forms.edit.title')} description={t('forms.edit.description')}>
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
      title={t('forms.edit.title')}
      description={t('forms.edit.description', { name: form.name })}
    >
      {step === 'metadata' ? (
        <Card>
          <CardContent className="pt-6">
            <FormMetadataForm
              initialData={formData}
              isEdit
              onSubmit={handleMetadataSubmit}
              onCancel={handleCancel}
              submitLabel={t('forms.edit.nextStep')}
            />
          </CardContent>
        </Card>
      ) : (
        <FormBuilderCanvas
          schema={formData.schema || form.schema}
          onSchemaChange={handleSchemaChange}
          onSave={handleSave}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          formName={formData.name || form.name}
        />
      )}
    </PageContainer>
  );
}
