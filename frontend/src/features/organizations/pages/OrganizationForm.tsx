/**
 * Organization form component for create and edit views.
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
  Organization,
  OrganizationStatus,
  CreateOrganizationPayload,
} from '@/@types/organization';
import { kebabCase } from '@/utils';

export interface OrganizationFormProps {
  /** Initial values for editing. */
  initialData?: Organization;
  /** Whether form is in edit mode. */
  isEdit?: boolean;
  /** Submit handler. */
  onSubmit: (data: CreateOrganizationPayload) => Promise<void>;
  /** Cancel handler. */
  onCancel: () => void;
  /** Whether submission is in progress. */
  isSubmitting?: boolean;
}

interface FormErrors {
  name?: string | undefined;
  slug?: string | undefined;
  email?: string | undefined;
}

const EMPTY_ERRORS: FormErrors = {
  name: undefined,
  slug: undefined,
  email: undefined,
};

/**
 * Validates organization form data.
 */
function validateForm(
  data: Partial<CreateOrganizationPayload>,
  t: (key: string) => string
): FormErrors {
  const errors: FormErrors = { ...EMPTY_ERRORS };

  if (!data.name?.trim()) {
    errors.name = t('organizations.form.validation.nameRequired');
  }

  if (!data.slug?.trim()) {
    errors.slug = t('organizations.form.validation.slugRequired');
  } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
    errors.slug = t('organizations.form.validation.slugInvalid');
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = t('organizations.form.validation.emailInvalid');
  }

  return errors;
}

/**
 * Checks if there are any validation errors.
 */
function hasErrors(errors: FormErrors): boolean {
  return Boolean(errors.name || errors.slug || errors.email);
}

/**
 * OrganizationForm renders a form for creating or editing an organization.
 */
export function OrganizationForm({
  initialData,
  isEdit = false,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: OrganizationFormProps): ReactNode {
  const { t } = useTranslation();

  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [status, setStatus] = useState<OrganizationStatus>(initialData?.status || 'pending');
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [state, setState] = useState(initialData?.state || '');
  const [country, setCountry] = useState(initialData?.country || '');
  const [postalCode, setPostalCode] = useState(initialData?.postalCode || '');

  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);

  // Auto-generate slug from name (only on create)
  const handleNameChange = (value: string) => {
    setName(value);
    if (!isEdit && !initialData) {
      setSlug(kebabCase(value));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const formData = {
      name: name.trim(),
      slug: slug.trim(),
      ...(email.trim() && { primaryContactEmail: email.trim() }),
      ...(phone.trim() && { phone: phone.trim() }),
      ...(website.trim() && { website: website.trim() }),
      ...(address.trim() && { address: address.trim() }),
      ...(city.trim() && { city: city.trim() }),
      ...(state.trim() && { state: state.trim() }),
      ...(country.trim() && { country: country.trim() }),
      ...(postalCode.trim() && { postalCode: postalCode.trim() }),
    };

    const validationErrors = validateForm(formData, t);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setErrors(EMPTY_ERRORS);

    await onSubmit({ ...formData, ...(isEdit && { status }) } as CreateOrganizationPayload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSection
        title={t('organizations.form.sections.basicInfo')}
        description={t('organizations.form.sections.basicInfoDescription')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={t('organizations.form.name')}
            error={errors.name}
            required
          >
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={t('organizations.form.namePlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label={t('organizations.form.slug')}
            error={errors.slug}
            helperText={t('organizations.form.slugHelper')}
            required
          >
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={t('organizations.form.slugPlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>
        </div>

        {isEdit && (
          <FormField label={t('organizations.form.status')}>
            <Select value={status} onValueChange={(v) => setStatus(v as OrganizationStatus)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('organizations.status.active')}</SelectItem>
                <SelectItem value="pending">{t('organizations.status.pending')}</SelectItem>
                <SelectItem value="suspended">{t('organizations.status.suspended')}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        )}
      </FormSection>

      <FormSection
        title={t('organizations.form.sections.contact')}
        description={t('organizations.form.sections.contactDescription')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('organizations.form.email')} error={errors.email}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('organizations.form.emailPlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label={t('organizations.form.phone')}>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('organizations.form.phonePlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label={t('organizations.form.website')} className="sm:col-span-2">
            <Input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder={t('organizations.form.websitePlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title={t('organizations.form.sections.address')}
        description={t('organizations.form.sections.addressDescription')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('organizations.form.address')} className="sm:col-span-2">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('organizations.form.addressPlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label={t('organizations.form.city')}>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t('organizations.form.cityPlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label={t('organizations.form.state')}>
            <Input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder={t('organizations.form.statePlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label={t('organizations.form.country')}>
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder={t('organizations.form.countryPlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label={t('organizations.form.postalCode')}>
            <Input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder={t('organizations.form.postalCodePlaceholder')}
              disabled={isSubmitting}
            />
          </FormField>
        </div>
      </FormSection>

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
