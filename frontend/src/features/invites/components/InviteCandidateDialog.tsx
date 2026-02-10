/**
 * InviteCandidateDialog — modal for inviting a candidate to go through screening.
 *
 * Flow (per InviteFlows.md — org-context candidate invite):
 * 1. Staff member navigates to Candidates page
 * 2. Clicks "Invite Candidate" button
 * 3. Enters email + additional info (first name, last name, phone, DOB, NI number)
 * 4. System creates global identity + sends invite email
 */
import { useState, type ReactNode, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  LoadingSpinner,
  toastSuccess,
  toastError,
} from '@/components/ui';
import { InviteService } from '@/features/invites/services/InviteService';
import { extractApiError } from '@/utils';
import type { InviteCandidatePayload } from '@/@types/invite';

export interface InviteCandidateDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Callback to close the dialog. */
  onOpenChange: (open: boolean) => void;
  /** Organization ID (optional — may be inferred from user context). */
  organizationId?: string;
  /** Called after a successful invite. */
  onSuccess?: () => void;
}

interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * InviteCandidateDialog presents a form for inviting a candidate for screening.
 */
export function InviteCandidateDialog({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: InviteCandidateDialogProps): ReactNode {
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationalInsuranceNumber, setNationalInsuranceNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const resetForm = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setDateOfBirth('');
    setNationalInsuranceNumber('');
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = t('invites.candidate.emailRequired');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = t('invites.candidate.emailInvalid');
      }
    }

    if (!firstName.trim()) {
      newErrors.firstName = t('invites.candidate.firstNameRequired');
    }
    if (!lastName.trim()) {
      newErrors.lastName = t('invites.candidate.lastNameRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: InviteCandidatePayload = {
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        nationalInsuranceNumber: nationalInsuranceNumber.trim() || undefined,
        organizationId,
      };
      await InviteService.sendCandidateInvite(payload, organizationId);
      toastSuccess(t('invites.candidate.success', { email: payload.email }));
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const code = extractApiError(error).code;
      if (code === 'DUPLICATE_EMAIL') {
        setErrors({ email: t('invites.candidate.duplicateEmail') });
      } else if (code === 'INVITE_ALREADY_PENDING') {
        setErrors({ email: t('invites.candidate.alreadyPending') });
      } else {
        toastError(t('invites.candidate.error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('invites.candidate.title')}</DialogTitle>
          <DialogDescription>{t('invites.candidate.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="invite-cand-email" className="text-sm font-medium text-foreground">
              {t('invites.candidate.emailLabel')} *
            </label>
            <Input
              id="invite-cand-email"
              type="email"
              placeholder={t('invites.candidate.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => {
                if (email) {
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!email.trim()) {
                    setErrors((prev) => ({ ...prev, email: t('invites.candidate.emailRequired') }));
                  } else if (!emailRegex.test(email)) {
                    setErrors((prev) => ({ ...prev, email: t('invites.candidate.emailInvalid') }));
                  } else {
                    setErrors((prev) => ({ ...prev, email: '' }));
                  }
                }
              }}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'invite-cand-email-error' : undefined}
              disabled={isSubmitting}
              autoFocus
            />
            {errors.email && (
              <p id="invite-cand-email-error" className="text-sm text-destructive" role="alert">{errors.email}</p>
            )}
          </div>

          {/* Name fields in grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="invite-cand-fname" className="text-sm font-medium text-foreground">
                {t('invites.candidate.firstNameLabel')} *
              </label>
              <Input
                id="invite-cand-fname"
                type="text"
                placeholder={t('invites.candidate.firstNamePlaceholder')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? 'invite-cand-fname-error' : undefined}
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <p id="invite-cand-fname-error" className="text-sm text-destructive" role="alert">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="invite-cand-lname" className="text-sm font-medium text-foreground">
                {t('invites.candidate.lastNameLabel')} *
              </label>
              <Input
                id="invite-cand-lname"
                type="text"
                placeholder={t('invites.candidate.lastNamePlaceholder')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? 'invite-cand-lname-error' : undefined}
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <p id="invite-cand-lname-error" className="text-sm text-destructive" role="alert">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label htmlFor="invite-cand-phone" className="text-sm font-medium text-foreground">
              {t('invites.candidate.phoneLabel')}
            </label>
            <Input
              id="invite-cand-phone"
              type="tel"
              placeholder={t('invites.candidate.phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* DOB */}
          <div className="space-y-2">
            <label htmlFor="invite-cand-dob" className="text-sm font-medium text-foreground">
              {t('invites.candidate.dobLabel')}
            </label>
            <Input
              id="invite-cand-dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* National Insurance Number */}
          <div className="space-y-2">
            <label htmlFor="invite-cand-ni" className="text-sm font-medium text-foreground">
              {t('invites.candidate.niLabel')}
            </label>
            <Input
              id="invite-cand-ni"
              type="text"
              placeholder={t('invites.candidate.niPlaceholder')}
              value={nationalInsuranceNumber}
              onChange={(e) => setNationalInsuranceNumber(e.target.value.toUpperCase())}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  {t('invites.candidate.sending')}
                </>
              ) : (
                t('invites.candidate.sendButton')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
