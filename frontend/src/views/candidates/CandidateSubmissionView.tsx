/**
 * Candidate submission form view for public candidate data collection.
 */
import { useState, type ReactNode, type FormEvent } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  FormField,
  FormSection,
  FormActions,
  LoadingSpinner,
  toastSuccess,
  toastError,
} from '@/components/ui';
import { CandidatesService } from '@/services';
import { handleApiError } from '@/utils';
import type { CreateCandidatePayload } from '@/@types/candidate';

interface FormErrors {
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
 * CandidateSubmissionView provides a public-facing form for candidates to submit their info.
 */
export function CandidateSubmissionView(): ReactNode {
  const { t } = useTranslation();
  const { formId } = useParams<{ formId: string }>();
  const [searchParams] = useSearchParams();
  const organizationId = searchParams.get('org') || undefined;

  // Form state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = { ...EMPTY_ERRORS };

    if (!email.trim()) {
      newErrors.email = t('candidates.submission.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('candidates.submission.validation.emailInvalid');
    }

    if (!firstName.trim()) {
      newErrors.firstName = t('candidates.submission.validation.firstNameRequired');
    }

    if (!lastName.trim()) {
      newErrors.lastName = t('candidates.submission.validation.lastNameRequired');
    }

    return newErrors;
  };

  const hasErrors = (formErrors: FormErrors): boolean => {
    return Boolean(formErrors.email || formErrors.firstName || formErrors.lastName);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setErrors(EMPTY_ERRORS);
    setIsSubmitting(true);

    try {
      const payload: CreateCandidatePayload = {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };
      
      const trimmedPhone = phone.trim();
      if (trimmedPhone) {
        payload.phone = trimmedPhone;
      }
      if (organizationId) {
        payload.organizationId = organizationId;
      }
      if (formId) {
        payload.metadata = { formId };
      }
      
      await CandidatesService.create(payload);
      setIsSubmitted(true);
      toastSuccess(t('candidates.submission.success'));
    } catch (error) {
      handleApiError(error);
      toastError(t('candidates.submission.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>{t('candidates.submission.thankYouTitle')}</CardTitle>
            <CardDescription>
              {t('candidates.submission.thankYouDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-6xl mb-4">✓</div>
            <p className="text-gray-600 dark:text-gray-400">
              {t('candidates.submission.confirmationText')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{t('candidates.submission.title')}</CardTitle>
          <CardDescription>
            {t('candidates.submission.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormSection>
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
                    disabled={isSubmitting}
                  />
                </FormField>

                <FormField 
                  label={t('candidates.form.phone')}
                  className="sm:col-span-2"
                >
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

            <FormActions>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
                {t('candidates.submission.submitButton')}
              </Button>
            </FormActions>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
