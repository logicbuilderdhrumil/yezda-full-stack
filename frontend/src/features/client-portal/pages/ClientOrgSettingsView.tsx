/**
 * ClientOrgSettingsView displays and allows editing of organisation settings.
 * Editable for client_admin users; read-only for regular client users.
 */

import { useState, useEffect, useCallback, type ReactNode, type FormEvent } from 'react';
import { PageContainer } from '@/components/layouts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Label,
  Button,
  Skeleton,
  Switch,
  Separator,
  toastSuccess,
  toastError,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { ClientPortalService } from '@/services/ClientPortalService';
import type { ClientOrgSettings } from '@/services/ClientPortalService';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Checks if the user has client_admin role. */
function isClientAdmin(roles: string[] | undefined): boolean {
  return roles?.includes('client_admin') ?? false;
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

/** Loading skeleton for the settings form. */
function SettingsSkeleton(): ReactNode {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/** Read-only field display. */
function ReadOnlyField({ label, value }: { label: string; value?: string }): ReactNode {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm text-gray-900 dark:text-gray-100">{value || '—'}</p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main View
// -----------------------------------------------------------------------------

/**
 * ClientOrgSettingsView shows organisation settings.
 * client_admin users can edit settings; regular client users see read-only display.
 */
export function ClientOrgSettingsView(): ReactNode {
  const { user } = useAuth();
  const canEdit = isClientAdmin(user?.roles);

  const [settings, setSettings] = useState<ClientOrgSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable form state
  const [formName, setFormName] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [emailOnComplete, setEmailOnComplete] = useState(false);
  const [emailOnSubmission, setEmailOnSubmission] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const populateForm = (data: ClientOrgSettings) => {
    setFormName(data.name);
    setFormContactEmail(data.contactEmail ?? '');
    setFormContactPhone(data.contactPhone ?? '');
    setFormAddress(data.address ?? '');
    setEmailOnComplete(data.notificationPreferences.emailOnScreeningComplete);
    setEmailOnSubmission(data.notificationPreferences.emailOnCandidateSubmission);
    setWeeklyDigest(data.notificationPreferences.weeklyDigest);
  };

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await ClientPortalService.getOrgSettings();
      setSettings(result);
      populateForm(result);
    } catch {
      setError('Failed to load organisation settings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setIsSaving(true);
    try {
      const updated = await ClientPortalService.updateOrgSettings({
        name: formName,
        contactEmail: formContactEmail || undefined,
        contactPhone: formContactPhone || undefined,
        address: formAddress || undefined,
        notificationPreferences: {
          emailOnScreeningComplete: emailOnComplete,
          emailOnCandidateSubmission: emailOnSubmission,
          weeklyDigest,
        },
      });
      setSettings(updated);
      populateForm(updated);
      toastSuccess('Settings updated successfully.');
    } catch {
      toastError('Failed to update settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Error state
  if (error && !settings) {
    return (
      <PageContainer title="Organisation Settings" description="Manage your organisation details">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button variant="outline" onClick={() => void fetchSettings()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <PageContainer title="Organisation Settings" description="Manage your organisation details">
        <SettingsSkeleton />
      </PageContainer>
    );
  }

  // Read-only view for non-admin users
  if (!canEdit) {
    return (
      <PageContainer title="Organisation Settings" description="Your organisation details">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Organisation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ReadOnlyField label="Organisation Name" value={settings?.name ?? ''} />
              <ReadOnlyField label="Contact Email" value={settings?.contactEmail ?? ''} />
              <ReadOnlyField label="Contact Phone" value={settings?.contactPhone ?? ''} />
              <ReadOnlyField label="Address" value={settings?.address ?? ''} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <NotificationRow
                label="Email on screening complete"
                enabled={settings?.notificationPreferences.emailOnScreeningComplete ?? false}
              />
              <NotificationRow
                label="Email on candidate submission"
                enabled={settings?.notificationPreferences.emailOnCandidateSubmission ?? false}
              />
              <NotificationRow
                label="Weekly digest"
                enabled={settings?.notificationPreferences.weeklyDigest ?? false}
              />
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  // Editable form view for client_admin
  return (
    <PageContainer title="Organisation Settings" description="Manage your organisation details">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organisation Details</CardTitle>
            <CardDescription>
              Update your organisation&apos;s contact information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organisation Name</Label>
              <Input
                id="org-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={formContactEmail}
                  onChange={(e) => setFormContactEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Contact Phone</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  value={formContactPhone}
                  onChange={(e) => setFormContactPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Configure when you receive email notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SwitchRow
              id="email-on-complete"
              label="Email on screening complete"
              description="Receive an email when a candidate screening is completed."
              checked={emailOnComplete}
              onCheckedChange={setEmailOnComplete}
            />
            <Separator />
            <SwitchRow
              id="email-on-submission"
              label="Email on candidate submission"
              description="Receive an email when a new candidate is submitted."
              checked={emailOnSubmission}
              onCheckedChange={setEmailOnSubmission}
            />
            <Separator />
            <SwitchRow
              id="weekly-digest"
              label="Weekly digest"
              description="Receive a weekly summary of screening activity."
              checked={weeklyDigest}
              onCheckedChange={setWeeklyDigest}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

// -----------------------------------------------------------------------------
// Utility Components
// -----------------------------------------------------------------------------

/** Read-only notification status row. */
function NotificationRow({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}): ReactNode {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      <span className={enabled ? 'text-green-600' : 'text-gray-400'}>
        {enabled ? 'Enabled' : 'Disabled'}
      </span>
    </div>
  );
}

/** Editable switch row for notification preferences. */
function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}): ReactNode {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
