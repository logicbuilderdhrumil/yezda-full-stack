/**
 * InviteStatusBadge — displays invite status with appropriate styling.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui';
import type { InviteStatus } from '@/@types/invite';

export interface InviteStatusBadgeProps {
  status: InviteStatus;
  className?: string;
}

/**
 * Returns badge variant for invite status.
 */
function getInviteStatusVariant(
  status: InviteStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'accepted':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'expired':
      return 'destructive';
    case 'revoked':
      return 'outline';
    default:
      return 'outline';
  }
}

/**
 * InviteStatusBadge renders a colored badge indicating invite status.
 */
export function InviteStatusBadge({ status, className }: InviteStatusBadgeProps): ReactNode {
  const { t } = useTranslation();

  return (
    <Badge variant={getInviteStatusVariant(status)} className={className}>
      {t(`invites.status.${status}`)}
    </Badge>
  );
}
