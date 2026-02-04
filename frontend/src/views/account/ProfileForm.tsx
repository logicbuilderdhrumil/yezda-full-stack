/**
 * Profile Form Component
 * Task 1.3: Implement profile update form and validation
 */
import { useState, type ReactNode, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Input,
  FormField,
  FormSection,
  FormActions,
  LoadingSpinner,
} from '@/components/ui';
import type { AccountProfile, UpdateProfilePayload } from '@/@types/account';
import { AvatarUpload } from './AvatarUpload';

export interface ProfileFormProps {
  /** Current profile data. */
  profile: AccountProfile;
  /** Submit handler. */
  onSubmit: (data: UpdateProfilePayload) => Promise<void>;
  /** Avatar upload handler. */
  onAvatarUpload: (file: File) => Promise<void>;
  /** Avatar remove handler. */
  onAvatarRemove: () => Promise<void>;
  /** Whether submission is in progress. */
  isSubmitting?: boolean;
  /** Whether avatar operation is in progress. */
  isAvatarLoading?: boolean;
}

interface FormErrors {
  firstName?: string | undefined;
  lastName?: string | undefined;
  phone?: string | undefined;
}

const EMPTY_ERRORS: FormErrors = {
  firstName: undefined,
  lastName: undefined,
  phone: undefined,
};

/**
 * Validates profile form data.
 */
function validateForm(
  data: Partial<UpdateProfilePayload>,
  t: (key: string) => string
): FormErrors {
  const errors: FormErrors = { ...EMPTY_ERRORS };

  if (!data.firstName?.trim()) {
    errors.firstName = t('account.form.validation.firstNameRequired');
  }

  if (!data.lastName?.trim()) {
    errors.lastName = t('account.form.validation.lastNameRequired');
  }

  // Phone validation (optional field)
  if (data.phone && !/^[+]?[\d\s\-()]+$/.test(data.phone)) {
    errors.phone = t('account.form.validation.phoneInvalid');
  }

  return errors;
}

/**
 * Checks if there are any validation errors.
 */
function hasErrors(errors: FormErrors): boolean {
  return Boolean(errors.firstName || errors.lastName || errors.phone);
}

/**
 * ProfileForm renders a form for editing user profile.
 */
export function ProfileForm({
  profile,
  onSubmit,
  onAvatarUpload,
  onAvatarRemove,
  isSubmitting = false,
  isAvatarLoading = false,
}: ProfileFormProps): ReactNode {
  const { t } = useTranslation();

  // Form state
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [phone, setPhone] = useState(profile.phone || '');

  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);

  const displayName = `${firstName} ${lastName}`.trim() || profile.email;

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();

    const formData: UpdateProfilePayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
    };

    const validationErrors = validateForm(formData, t);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setErrors(EMPTY_ERRORS);
    await onSubmit(formData);
  };

  const handleReset = (): void => {
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setPhone(profile.phone || '');
    setErrors(EMPTY_ERRORS);
  };

  const hasChanges =
    firstName !== profile.firstName ||
    lastName !== profile.lastName ||
    phone !== (profile.phone || '');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <FormSection
        title={t('account.form.sections.avatar')}
        description={t('account.form.sections.avatarDescription')}
      >
        <AvatarUpload
          avatarUrl={profile.avatarUrl}
          displayName={displayName}
          onUpload={onAvatarUpload}
          onRemove={onAvatarRemove}
          isUploading={isAvatarLoading}
        />
      </FormSection>

      {/* Personal Information */}
      <FormSection
        title={t('account.form.sections.personal')}
        description={t('account.form.sections.personalDescription')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={t('account.form.firstName')}
            error={errors.firstName}
            required
          >
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t('account.form.firstNamePlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label={t('account.form.lastName')}
            error={errors.lastName}
            required
          >
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t('account.form.lastNamePlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>
        </div>

        <FormField
          label={t('account.form.email')}
          helperText={t('account.form.emailHelper')}
        >
          <Input
            type="email"
            value={profile.email}
            disabled
            className="bg-gray-50 dark:bg-gray-800"
          />
        </FormField>

        <FormField
          label={t('account.form.phone')}
          error={errors.phone}
        >
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('account.form.phonePlaceholder')}
            disabled={isSubmitting}
          />
        </FormField>
      </FormSection>

      <FormActions>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isSubmitting || !hasChanges}
        >
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting || !hasChanges}>
          {isSubmitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
          {t('common.save')}
        </Button>
      </FormActions>
    </form>
  );
}
