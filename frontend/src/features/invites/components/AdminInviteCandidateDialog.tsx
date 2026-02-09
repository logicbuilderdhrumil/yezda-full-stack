/**
 * AdminInviteCandidateDialog — modal for admin inviting a candidate to an organization.
 *
 * Flow (per InviteFlows.md — admin candidate invite):
 * 1. Admin navigates to Organization page → Candidates tab
 * 2. Clicks "Invite Candidate" button
 * 3. Enters email → system checks global candidate identity
 *    - If identity exists: shows "Send Invite" immediately (no extra fields)
 *    - If identity doesn't exist: shows additional fields (name, phone, DOB, NI)
 * 4. System creates global identity (if new) + links to org + sends invite email
 */
import { useState, useCallback, type ReactNode, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
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
import type { AdminInviteCandidatePayload, GlobalIdentityLookupResult } from '@/@types/invite';

export interface AdminInviteCandidateDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Callback to close the dialog. */
  onOpenChange: (open: boolean) => void;
  /** Organization ID to assign the candidate to. */
  organizationId: string;
  /** Organization name for display. */
  organizationName: string;
  /** Called after a successful invite. */
  onSuccess?: () => void;
}

interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
}

type LookupState = 'idle' | 'loading' | 'found' | 'not-found' | 'error';

/**
 * AdminInviteCandidateDialog handles the admin invite flow with global identity lookup.
 */
export function AdminInviteCandidateDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
  onSuccess,
}: AdminInviteCandidateDialogProps): ReactNode {
  const { t } = useTranslation();

  // Email & lookup state
  const [email, setEmail] = useState('');
  const [lookupState, setLookupState] = useState<LookupState>('idle');
  const [lookupResult, setLookupResult] = useState<GlobalIdentityLookupResult | null>(null);

  // Additional fields (shown only when identity doesn't exist)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationalInsuranceNumber, setNationalInsuranceNumber] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const resetForm = () => {
    setEmail('');
    setLookupState('idle');
    setLookupResult(null);
    setFirstName('');
    setLastName('');
    setPhone('');
    setDateOfBirth('');
    setNationalInsuranceNumber('');
    setErrors({});
  };

  /** Look up global candidate identity by email. */
  const handleLookup = useCallback(async () => {
    if (!email.trim()) {
      setErrors({ email: t('invites.adminCandidate.emailRequired') });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors({ email: t('invites.adminCandidate.emailInvalid') });
      return;
    }

    setErrors({});
    setLookupState('loading');
    try {
      const result = await InviteService.lookupGlobalIdentity(email.trim().toLowerCase());
      setLookupResult(result);
      setLookupState(result.exists ? 'found' : 'not-found');
    } catch {
      setLookupState('error');
      toastError(t('invites.adminCandidate.lookupError'));
    }
  }, [email, t]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = t('invites.adminCandidate.emailRequired');
    }

    // Only validate extra fields when identity doesn't exist
    if (lookupState === 'not-found') {
      if (!firstName.trim()) {
        newErrors.firstName = t('invites.adminCandidate.firstNameRequired');
      }
      if (!lastName.trim()) {
        newErrors.lastName = t('invites.adminCandidate.lastNameRequired');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: AdminInviteCandidatePayload = {
        email: email.trim().toLowerCase(),
        organizationId,
      };

      // Only include additional fields when creating new identity
      if (lookupState === 'not-found') {
        payload.firstName = firstName.trim();
        payload.lastName = lastName.trim();
        payload.phone = phone.trim() || undefined;
        payload.dateOfBirth = dateOfBirth || undefined;
        payload.nationalInsuranceNumber = nationalInsuranceNumber.trim() || undefined;
      }

      await InviteService.sendAdminCandidateInvite(payload);
      toastSuccess(t('invites.adminCandidate.success', { email: payload.email }));
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const err = error as { response?: { data?: { code?: string } } };
      const code = err?.response?.data?.code;
      if (code === 'DUPLICATE_EMAIL') {
        setErrors({ email: t('invites.adminCandidate.duplicateEmail') });
      } else if (code === 'INVITE_ALREADY_PENDING') {
        setErrors({ email: t('invites.adminCandidate.alreadyPending') });
      } else if (code === 'ALREADY_ASSIGNED') {
        setErrors({ email: t('invites.adminCandidate.alreadyAssigned') });
      } else {
        toastError(t('invites.adminCandidate.error'));
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

  const showAdditionalFields = lookupState === 'not-found';
  const canSubmit = lookupState === 'found' || lookupState === 'not-found';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('invites.adminCandidate.title')}</DialogTitle>
          <DialogDescription>
            {t('invites.adminCandidate.description', { organization: organizationName })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email + Lookup */}
          <div className="space-y-2">
            <label htmlFor="admin-invite-email" className="text-sm font-medium text-foreground">
              {t('invites.adminCandidate.emailLabel')} *
            </label>
            <div className="flex gap-2">
              <Input
                id="admin-invite-email"
                type="email"
                placeholder={t('invites.adminCandidate.emailPlaceholder')}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  // Reset lookup state when email changes
                  if (lookupState !== 'idle') {
                    setLookupState('idle');
                    setLookupResult(null);
                  }
                }}
                aria-invalid={!!errors.email}
                disabled={isSubmitting}
                className="flex-1"
                autoFocus
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleLookup}
                disabled={isSubmitting || lookupState === 'loading' || !email.trim()}
              >
                {lookupState === 'loading' ? (
                  <LoadingSpinner className="h-4 w-4" />
                ) : (
                  t('invites.adminCandidate.lookupButton')
                )}
              </Button>
            </div>
            {errors.email && (
              <p className="text-sm text-destructive" role="alert">{errors.email}</p>
            )}
          </div>

          {/* Lookup status indicator */}
          {lookupState === 'found' && lookupResult && (
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">{t('invites.adminCandidate.identityFound')}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('invites.adminCandidate.identityFoundDescription', {
                  name: `${lookupResult.firstName ?? ''} ${lookupResult.lastName ?? ''}`.trim() || email,
                })}
              </p>
            </div>
          )}

          {lookupState === 'not-found' && (
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{t('invites.adminCandidate.newIdentity')}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('invites.adminCandidate.newIdentityDescription')}
              </p>
            </div>
          )}

          {lookupState === 'error' && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">
                {t('invites.adminCandidate.lookupError')}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleLookup}
              >
                {t('invites.adminCandidate.retryLookup')}
              </Button>
            </div>
          )}

          {/* Additional fields for new identity */}
          {showAdditionalFields && (
            <div className="space-y-4 border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground">
                {t('invites.adminCandidate.additionalInfoTitle')}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="admin-invite-fname" className="text-sm font-medium text-foreground">
                    {t('invites.adminCandidate.firstNameLabel')} *
                  </label>
                  <Input
                    id="admin-invite-fname"
                    type="text"
                    placeholder={t('invites.adminCandidate.firstNamePlaceholder')}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    aria-invalid={!!errors.firstName}
                    disabled={isSubmitting}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive" role="alert">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="admin-invite-lname" className="text-sm font-medium text-foreground">
                    {t('invites.adminCandidate.lastNameLabel')} *
                  </label>
                  <Input
                    id="admin-invite-lname"
                    type="text"
                    placeholder={t('invites.adminCandidate.lastNamePlaceholder')}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    aria-invalid={!!errors.lastName}
                    disabled={isSubmitting}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive" role="alert">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="admin-invite-phone" className="text-sm font-medium text-foreground">
                  {t('invites.adminCandidate.phoneLabel')}
                </label>
                <Input
                  id="admin-invite-phone"
                  type="tel"
                  placeholder={t('invites.adminCandidate.phonePlaceholder')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="admin-invite-dob" className="text-sm font-medium text-foreground">
                  {t('invites.adminCandidate.dobLabel')}
                </label>
                <Input
                  id="admin-invite-dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="admin-invite-ni" className="text-sm font-medium text-foreground">
                  {t('invites.adminCandidate.niLabel')}
                </label>
                <Input
                  id="admin-invite-ni"
                  type="text"
                  placeholder={t('invites.adminCandidate.niPlaceholder')}
                  value={nationalInsuranceNumber}
                  onChange={(e) => setNationalInsuranceNumber(e.target.value.toUpperCase())}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !canSubmit}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  {t('invites.adminCandidate.sending')}
                </>
              ) : (
                t('invites.adminCandidate.sendButton')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
