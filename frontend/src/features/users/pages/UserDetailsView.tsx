/**
 * User details view.
 */
import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layouts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  SkeletonCard,
  toastError,
} from '@/components/ui';
import { UsersService } from '@/services';
import { formatDate, handleApiError } from '@/utils';
import type { ManagedUser, UserStatus, UserRole } from '@/@types/user';

/**
 * Returns badge variant for user status.
 */
function getStatusVariant(status: UserStatus): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'inactive':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/**
 * Returns badge variant for user role.
 */
function getRoleVariant(role: UserRole): 'default' | 'secondary' | 'outline' {
  switch (role) {
    case 'admin':
      return 'default';
    case 'manager':
      return 'secondary';
    default:
      return 'outline';
  }
}

interface DetailRowProps {
  label: string;
  value: string | undefined;
}

function DetailRow({ label, value }: DetailRowProps): ReactNode {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 py-3">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="col-span-2 text-sm text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
  );
}

/**
 * UserDetailsView displays the details of a single user.
 */
export function UserDetailsView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [user, setUser] = useState<ManagedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      if (!id) {
        navigate('/admin/users');
        return;
      }

      try {
        const data = await UsersService.get(id);
        if (isMounted) {
          setUser(data);
        }
      } catch (error) {
        handleApiError(error);
        toastError(t('users.details.fetchError'));
        navigate('/admin/users');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [id, navigate, t]);

  const handleEdit = () => {
    if (id) {
      navigate(`/admin/users/${id}/edit`);
    }
  };

  const handleBack = () => {
    navigate('/admin/users');
  };

  if (isLoading) {
    return (
      <PageContainer title={t('users.details.title')}>
        <SkeletonCard />
      </PageContainer>
    );
  }

  if (!user) {
    return null;
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <PageContainer
      title={fullName || user.email}
      description={t('users.details.description')}
    >
      <div className="space-y-6">
        {/* Header actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBack}>
            ← {t('common.back')}
          </Button>
          <Button onClick={handleEdit}>{t('common.edit')}</Button>
        </div>

        {/* Basic info card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{fullName || user.email}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant={getRoleVariant(user.roles?.[0] || 'viewer')}>
                  {t(`users.role.${user.roles?.[0] || 'viewer'}`)}
                </Badge>
                <Badge variant={getStatusVariant(user.status)}>
                  {t(`users.status.${user.status}`)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-gray-200 dark:divide-gray-700">
              <DetailRow label={t('users.details.id')} value={user.id} />
              <DetailRow label={t('users.details.firstName')} value={user.firstName} />
              <DetailRow label={t('users.details.lastName')} value={user.lastName} />
              <DetailRow label={t('users.details.email')} value={user.email} />
              <DetailRow label={t('users.details.phone')} value={user.phone} />
              <DetailRow
                label={t('users.details.mfaEnabled')}
                value={user.mfaEnabled ? t('common.yes') : t('common.no')}
              />
              <DetailRow
                label={t('users.details.createdAt')}
                value={formatDate(user.createdAt)}
              />
              <DetailRow
                label={t('users.details.updatedAt')}
                value={formatDate(user.updatedAt)}
              />
            </dl>
          </CardContent>
        </Card>

        {/* Organization card (if applicable) */}
        {user.organizationName && (
          <Card>
            <CardHeader>
              <CardTitle>{t('users.details.organizationTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                <DetailRow
                  label={t('users.details.organization')}
                  value={user.organizationName}
                />
              </dl>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
