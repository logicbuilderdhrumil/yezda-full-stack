/**
 * Form create view with metadata fields and form builder.
 */
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layouts';
import { Card, CardContent, toastSuccess, toastError } from '@/components/ui';
import { FormsService } from '@/services';
import { handleApiError } from '@/utils';
import type { CreateFormPayload, FormSchema } from '@/@types/form';
import { FormMetadataForm } from './FormMetadataForm';
import { FormBuilderCanvas } from './FormBuilderCanvas';

type Step = 'metadata' | 'builder';

/**
 * FormCreateView renders the wizard to create a new form.
 */
export function FormCreateView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<Step>('metadata');
  const [formData, setFormData] = useState<CreateFormPayload>({
    name: '',
    description: '',
    status: 'draft',
    schema: { fields: [], version: 1 },
  });

  const handleMetadataSubmit = (data: Partial<CreateFormPayload>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep('builder');
  };

  const handleSchemaChange = (schema: FormSchema) => {
    setFormData((prev) => ({ ...prev, schema }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const created = await FormsService.create(formData);
      toastSuccess(t('forms.create.success'));
      navigate(`/admin/forms/${created.id}`);
    } catch (error) {
      handleApiError(error);
      toastError(t('forms.create.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (step === 'builder') {
      setStep('metadata');
    } else {
      navigate('/admin/forms');
    }
  };

  return (
    <PageContainer title={t('forms.create.title')} description={t('forms.create.description')}>
      {step === 'metadata' ? (
        <Card>
          <CardContent className="pt-6">
            <FormMetadataForm
              initialData={formData}
              onSubmit={handleMetadataSubmit}
              onCancel={handleCancel}
              submitLabel={t('forms.create.nextStep')}
            />
          </CardContent>
        </Card>
      ) : (
        <FormBuilderCanvas
          schema={formData.schema!}
          onSchemaChange={handleSchemaChange}
          onSave={handleSave}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          formName={formData.name}
        />
      )}
    </PageContainer>
  );
}
