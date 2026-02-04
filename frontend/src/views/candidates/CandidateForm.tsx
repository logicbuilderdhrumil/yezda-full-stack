/**
 * Candidate form component for create and edit views.
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
import type {
  Candidate,
  CandidateStatus,
  CreateCandidatePayload,
  UpdateCandidatePayload,
} from '@/@types/candidate';

/**
 * Union type for form submit data that supports both create and edit modes.
 */
export type CandidateFormSubmitData = CreateCandidatePayload | (UpdateCandidatePayload & {
  email: string;
  firstName: string;
  lastName: string;
});

export interface CandidateFormProps {
  /** Initial values for editing. */
  initialData?: Candidate;
  /** Whether form is in edit mode. */
  isEdit?: boolean;
  /** Submit handler. */
  onSubmit: (data: CandidateFormSubmitData) => Promise<void>;
  /** Cancel handler. */
  onCancel: () => void;
  /** Whether submission is in progress. */
  isSubmitting?: boolean;
}

export interface FormErrors {
  email?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
}

const EMPTY_ERRORS: FormErrors = {
  email: undefined,
  firstName: undefined,
  lastName: undefined,
};

/**
 * Validates candidate form data.
 * @internal Exported for testing purposes.
 */
export function validateForm(
  data: Partial<CreateCandidatePayload>,
  t: (key: string) => string
): FormErrors {
  const errors: FormErrors = { ...EMPTY_ERRORS };

  if (!data.email?.trim()) {
    errors.email = t('candidates.form.validation.emailRequired');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = t('candidates.form.validation.emailInvalid');
  }

  if (!data.firstName?.trim()) {
    errors.firstName = t('candidates.form.validation.firstNameRequired');
  }

  if (!data.lastName?.trim()) {
    errors.lastName = t('candidates.form.validation.lastNameRequired');
  }

  return errors;
}

/**
 * Checks if there are any validation errors.
 */
function hasErrors(errors: FormErrors): boolean {
  return Boolean(errors.email || errors.firstName || errors.lastName);
}

/**
 * CandidateForm renders a form for creating or editing a candidate.
 */
export function CandidateForm({
  initialData,
  isEdit = false,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CandidateFormProps): ReactNode {
  const { t } = useTranslation();

  // Form state
  const [email, setEmail] = useState(initialData?.email || '');
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [lastName, setLastName] = useState(initialData?.lastName || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [status, setStatus] = useState<CandidateStatus>(initialData?.status || 'pending');

  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);

  // Clear field-specific error on input change
  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    clearError('email');
  };

  const handleFirstNameChange = (value: string) => {
    setFirstName(value);
    clearError('firstName');
  };

  const handleLastNameChange = (value: string) => {
    setLastName(value);
    clearError('lastName');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const formData: CreateCandidatePayload = {
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      ...(phone.trim() && { phone: phone.trim() }),
    };

    const validationErrors = validateForm(formData, t);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setErrors(EMPTY_ERRORS);

    // For edit mode, include status
    if (isEdit) {
      await onSubmit({ ...formData, status });
    } else {
      await onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection
        title={t('candidates.form.sections.basicInfo')}
        description={t('candidates.form.sections.basicInfoDescription')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={t('candidates.form.firstName')}
            error={errors.firstName}
            required
          >
            <Input
              value={firstName}
              onChange={(e) => handleFirstNameChange(e.target.value)}
              placeholder={t('candidates.form.firstNamePlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label={t('candidates.form.lastName')}
            error={errors.lastName}
            required
          >
            <Input
              value={lastName}
              onChange={(e) => handleLastNameChange(e.target.value)}
              placeholder={t('candidates.form.lastNamePlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label={t('candidates.form.email')}
            error={errors.email}
            required
            className="sm:col-span-2"
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder={t('candidates.form.emailPlaceholder')}
              disabled={isSubmitting || isEdit}
            />
          </FormField>

          <FormField label={t('candidates.form.phone')}>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('candidates.form.phonePlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>
        </div>
      </FormSection>

      {isEdit && (
        <FormSection
          title={t('candidates.form.sections.status')}
          description={t('candidates.form.sections.statusDescription')}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t('candidates.form.status')}>
              <Select value={status} onValueChange={(v) => setStatus(v as CandidateStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t('candidates.status.pending')}</SelectItem>
                  <SelectItem value="active">{t('candidates.status.active')}</SelectItem>
                  <SelectItem value="certified">{t('candidates.status.certified')}</SelectItem>
                  <SelectItem value="archived">{t('candidates.status.archived')}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </FormSection>
      )}

      <FormActions>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
          {isEdit ? t('common.save') : t('common.create')}
        </Button>
      </FormActions>
    </form>
  );
}
