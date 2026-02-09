/**
 * User form component for create and edit views.
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
  Checkbox,
} from '@/components/ui';
import type {
  ManagedUser,
  UserRole,
  UserStatus,
  CreateUserPayload,
  UpdateUserPayload,
} from '@/@types/user';

/**
 * Union type for form submit data that supports both create and edit modes.
 */
export type UserFormSubmitData = CreateUserPayload | (UpdateUserPayload & {
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
});

export interface UserFormProps {
  /** Initial values for editing. */
  initialData?: ManagedUser;
  /** Whether form is in edit mode. */
  isEdit?: boolean;
  /** Submit handler. */
  onSubmit: (data: UserFormSubmitData) => Promise<void>;
  /** Cancel handler. */
  onCancel: () => void;
  /** Whether submission is in progress. */
  isSubmitting?: boolean;
}

export interface FormErrors {
  email?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
  password?: string | undefined;
}

const EMPTY_ERRORS: FormErrors = {
  email: undefined,
  firstName: undefined,
  lastName: undefined,
  password: undefined,
};

/**
 * Validates user form data.
 * @internal Exported for testing purposes.
 */
export function validateForm(
  data: Partial<CreateUserPayload>,
  isEdit: boolean,
  t: (key: string) => string
): FormErrors {
  const errors: FormErrors = { ...EMPTY_ERRORS };

  if (!data.email?.trim()) {
    errors.email = t('users.form.validation.emailRequired');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = t('users.form.validation.emailInvalid');
  }

  if (!data.firstName?.trim()) {
    errors.firstName = t('users.form.validation.firstNameRequired');
  }

  if (!data.lastName?.trim()) {
    errors.lastName = t('users.form.validation.lastNameRequired');
  }

  // Password required only on create when not sending invitation
  if (!isEdit && !data.sendInvitation) {
    if (!data.password || data.password.length < 8) {
      errors.password = t('users.form.validation.passwordMinLength');
    }
  } else if (!isEdit && data.password && data.password.length > 0 && data.password.length < 8) {
    errors.password = t('users.form.validation.passwordMinLength');
  }

  return errors;
}

/**
 * Checks if there are any validation errors.
 */
function hasErrors(errors: FormErrors): boolean {
  return Boolean(errors.email || errors.firstName || errors.lastName || errors.password);
}

/**
 * UserForm renders a form for creating or editing a user.
 */
export function UserForm({
  initialData,
  isEdit = false,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: UserFormProps): ReactNode {
  const { t } = useTranslation();

  // Form state
  const [email, setEmail] = useState(initialData?.email || '');
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [lastName, setLastName] = useState(initialData?.lastName || '');
  const [role, setRole] = useState<UserRole>(initialData?.roles?.[0] || 'viewer');
  const [status, setStatus] = useState<UserStatus>(initialData?.status || 'pending');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [password, setPassword] = useState('');
  const [sendInvitation, setSendInvitation] = useState(!isEdit);

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

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    clearError('password');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const formData: CreateUserPayload = {
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      roles: [role],
      ...(phone.trim() && { phone: phone.trim() }),
      ...(!isEdit && !sendInvitation && password.trim() && { password: password.trim() }),
      ...(!isEdit && { sendInvitation }),
    };

    const validationErrors = validateForm(formData, isEdit, t);
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
        title={t('users.form.sections.basicInfo')}
        description={t('users.form.sections.basicInfoDescription')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={t('users.form.firstName')}
            error={errors.firstName}
            required
          >
            <Input
              value={firstName}
              onChange={(e) => handleFirstNameChange(e.target.value)}
              placeholder={t('users.form.firstNamePlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label={t('users.form.lastName')}
            error={errors.lastName}
            required
          >
            <Input
              value={lastName}
              onChange={(e) => handleLastNameChange(e.target.value)}
              placeholder={t('users.form.lastNamePlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label={t('users.form.email')}
            error={errors.email}
            required
            className="sm:col-span-2"
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder={t('users.form.emailPlaceholder')}
              disabled={isSubmitting || isEdit}
            />
          </FormField>

          <FormField label={t('users.form.phone')}>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('users.form.phonePlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title={t('users.form.sections.roleAccess')}
        description={t('users.form.sections.roleAccessDescription')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('users.form.role')} required>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t('users.role.admin')}</SelectItem>
                <SelectItem value="manager">{t('users.role.manager')}</SelectItem>
                <SelectItem value="user">{t('users.role.user')}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {isEdit && (
            <FormField label={t('users.form.status')}>
              <Select value={status} onValueChange={(v) => setStatus(v as UserStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('users.status.active')}</SelectItem>
                  <SelectItem value="pending">{t('users.status.pending')}</SelectItem>
                  <SelectItem value="inactive">{t('users.status.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          )}
        </div>
      </FormSection>

      {!isEdit && (
        <FormSection
          title={t('users.form.sections.credentials')}
          description={t('users.form.sections.credentialsDescription')}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendInvitation"
                checked={sendInvitation}
                onCheckedChange={(checked) => setSendInvitation(checked === true)}
                disabled={isSubmitting}
              />
              <label
                htmlFor="sendInvitation"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t('users.form.sendInvitation')}
              </label>
            </div>

            {!sendInvitation && (
              <FormField
                label={t('users.form.password')}
                error={errors.password}
                helperText={t('users.form.passwordHelper')}
                required
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder={t('users.form.passwordPlaceholder')}
                  disabled={isSubmitting}
                />
              </FormField>
            )}
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
