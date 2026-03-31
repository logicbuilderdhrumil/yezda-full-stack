/**
 * InviteMemberDialog — modal for inviting a user to join an organization.
 *
 * Flow (per InviteFlows.md):
 * 1. Admin navigates to Organization → Users tab
 * 2. Clicks "Invite User" button
 * 3. Enters email and optional role
 * 4. System sends invite email with join link
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  LoadingSpinner,
  toastSuccess,
  toastError,
} from '@/components/ui';
import { InviteService } from '@/features/invites/services/InviteService';
import { extractApiError } from '@/utils';
import type { InviteMemberPayload } from '@/@types/invite';
import { useAuthStore } from '@/store';

export interface InviteMemberDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Callback to close the dialog. */
  onOpenChange: (open: boolean) => void;
  /** Organization ID to invite the member to. */
  organizationId: string;
  /** Organization name for display. */
  organizationName: string;
  /** Called after a successful invite. */
  onSuccess?: () => void;
}

type MemberRole = 'org_admin' | 'org_manager' | 'org_viewer';

/**
 * InviteMemberDialog presents a form for inviting a user to join an organization.
 */
export function InviteMemberDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
  onSuccess,
}: InviteMemberDialogProps): ReactNode {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('org_viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  const resetForm = () => {
    setEmail('');
    setRole('org_viewer');
    setEmailError('');
  };

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError(t('invites.member.emailRequired'));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError(t('invites.member.emailInvalid'));
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) return;

    setIsSubmitting(true);
    try {
      const inviterName = session?.displayName
        || [session?.firstName, session?.lastName].filter(Boolean).join(' ')
        || 'Admin';
      const payload: InviteMemberPayload = {
        email: email.trim().toLowerCase(),
        role,
        orgName: organizationName,
        inviterName,
      };
      await InviteService.sendMemberInvite(payload, organizationId);
      toastSuccess(t('invites.member.success', { email: payload.email }));
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const code = extractApiError(error).code;
      if (code === 'DUPLICATE_EMAIL') {
        setEmailError(t('invites.member.duplicateEmail'));
      } else if (code === 'INVITE_ALREADY_PENDING') {
        setEmailError(t('invites.member.alreadyPending'));
      } else {
        toastError(t('invites.member.error'));
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('invites.member.title')}</DialogTitle>
          <DialogDescription>
            {t('invites.member.description', { organization: organizationName })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div className="space-y-2">
            <label
              htmlFor="invite-member-email"
              className="text-sm font-medium text-foreground"
            >
              {t('invites.member.emailLabel')}
            </label>
            <Input
              id="invite-member-email"
              type="email"
              placeholder={t('invites.member.emailPlaceholder')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
              onBlur={() => email && validateEmail(email)}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'invite-member-email-error' : undefined}
              disabled={isSubmitting}
              autoFocus
            />
            {emailError && (
              <p
                id="invite-member-email-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {emailError}
              </p>
            )}
          </div>

          {/* Role select */}
          <div className="space-y-2">
            <label
              htmlFor="invite-member-role"
              className="text-sm font-medium text-foreground"
            >
              {t('invites.member.roleLabel')}
            </label>
            <Select value={role} onValueChange={(v) => setRole(v as MemberRole)}>
              <SelectTrigger id="invite-member-role" disabled={isSubmitting}>
                <SelectValue placeholder={t('invites.member.rolePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="org_viewer">{t('users.role.org_viewer')}</SelectItem>
                <SelectItem value="org_manager">{t('users.role.org_manager')}</SelectItem>
                <SelectItem value="org_admin">{t('users.role.org_admin')}</SelectItem>
              </SelectContent>
            </Select>
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
                  {t('invites.member.sending')}
                </>
              ) : (
                t('invites.member.sendButton')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
