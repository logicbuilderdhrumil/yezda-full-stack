/**
 * ClientProfileView displays the current client user's profile information.
 * Shows display name, email, role, and basic profile settings.
 */

import type { ReactNode } from 'react';
import { User, Mail, Shield } from 'lucide-react';
import { PageContainer } from '@/components/layouts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
} from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Formats a role string for display. */
function formatRole(role: string): string {
  return role
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Maps a role to a badge variant. */
function roleBadgeVariant(
  role: string
): 'default' | 'secondary' | 'success' {
  switch (role) {
    case 'org_admin':
      return 'default';
    case 'org_viewer':
      return 'success';
    default:
      return 'secondary';
  }
}

// -----------------------------------------------------------------------------
// Main View
// -----------------------------------------------------------------------------

/**
 * ClientProfileView shows the authenticated user's profile details
 * within the client portal context.
 */
export function ClientProfileView(): ReactNode {
  const { user } = useAuth();

  const displayName =
    user?.displayName ??
    ([user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User');

  return (
    <PageContainer title="My Profile" description="Your account information">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <User className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {displayName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {user?.email}
              </p>
              <div className="flex flex-wrap gap-1 mt-3 justify-center">
                {user?.roles?.map((role) => (
                  <Badge key={role} variant={roleBadgeVariant(role)}>
                    {formatRole(role)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow
                icon={<User className="h-4 w-4" />}
                label="Full Name"
                value={displayName}
              />
              <Separator />
              <DetailRow
                icon={<Mail className="h-4 w-4" />}
                label="Email Address"
                value={user?.email ?? '—'}
              />
              <Separator />
              <DetailRow
                icon={<Shield className="h-4 w-4" />}
                label="Role"
                value={user?.roles?.map(formatRole).join(', ') ?? '—'}
              />
              {user?.tenantId && (
                <>
                  <Separator />
                  <DetailRow
                    label="Organisation ID"
                    value={user.tenantId}
                  />
                </>
              )}
              {user?.createdAt && (
                <>
                  <Separator />
                  <DetailRow
                    label="Member Since"
                    value={formatDate(user.createdAt)}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

// -----------------------------------------------------------------------------
// Utility Components
// -----------------------------------------------------------------------------

interface DetailRowProps {
  icon?: ReactNode;
  label: string;
  value: string;
}

/** A label-value detail row with optional icon. */
function DetailRow({ icon, label, value }: DetailRowProps): ReactNode {
  return (
    <div className="flex items-center gap-3">
      {icon && (
        <div className="text-gray-400 dark:text-gray-500 shrink-0">{icon}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{value}</p>
      </div>
    </div>
  );
}

/** Formats an ISO date string. */
function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
