/**
 * Form metadata form component for name, description, and status.
 */
import { useState, type ReactNode, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  FormField,
  FormSection,
  FormActions,
  LoadingSpinner,
} from '@/components/ui';
import type { CreateFormPayload, FormStatus } from '@/@types/form';

export interface FormMetadataFormProps {
  /** Initial values for editing. */
  initialData?: Partial<CreateFormPayload>;
  /** Whether form is in edit mode. */
  isEdit?: boolean;
  /** Submit handler. */
  onSubmit: (data: Partial<CreateFormPayload>) => void;
  /** Cancel handler. */
  onCancel: () => void;
  /** Whether submission is in progress. */
  isSubmitting?: boolean;
  /** Custom submit button label. */
  submitLabel?: string;
}

interface FormErrors {
  name?: string | undefined;
}

const EMPTY_ERRORS: FormErrors = {
  name: undefined,
};

/**
 * Validates form metadata.
 */
function validateForm(data: Partial<CreateFormPayload>, t: (key: string) => string): FormErrors {
  const errors: FormErrors = { ...EMPTY_ERRORS };

  if (!data.name?.trim()) {
    errors.name = t('forms.form.validation.nameRequired');
  }

  return errors;
}

/**
 * Checks if there are any validation errors.
 */
function hasErrors(errors: FormErrors): boolean {
  return Boolean(errors.name);
}

/**
 * FormMetadataForm renders a form for creating or editing form metadata.
 */
export function FormMetadataForm({
  initialData,
  isEdit = false,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel,
}: FormMetadataFormProps): ReactNode {
  const { t } = useTranslation();

  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState<FormStatus>(initialData?.status || 'draft');

  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const formData: Partial<CreateFormPayload> = {
      name: name.trim(),
      description: description.trim() || undefined,
      status,
    };

    const validationErrors = validateForm(formData, t);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setErrors(EMPTY_ERRORS);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection
        title={t('forms.form.sections.basicInfo')}
        description={t('forms.form.sections.basicInfoDescription')}
      >
        <div className="grid gap-4">
          <FormField label={t('forms.form.name')} error={errors.name} required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('forms.form.namePlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label={t('forms.form.description')} helperText={t('forms.form.descriptionHelper')}>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('forms.form.descriptionPlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>

          {isEdit && (
            <FormField label={t('forms.form.status')}>
              <Select value={status} onValueChange={(v) => setStatus(v as FormStatus)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t('forms.status.draft')}</SelectItem>
                  <SelectItem value="published">{t('forms.status.published')}</SelectItem>
                  <SelectItem value="archived">{t('forms.status.archived')}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          )}
        </div>
      </FormSection>

      <FormActions>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
          {submitLabel || (isEdit ? t('common.save') : t('common.create'))}
        </Button>
      </FormActions>
    </form>
  );
}
