/**
 * Organization details view.
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
import { OrganizationsService } from '@/services';
import { formatDate, handleApiError } from '@/utils';
import type { Organization, OrganizationStatus } from '@/@types/organization';

/**
 * Returns badge variant for organization status.
 */
function getStatusVariant(status: OrganizationStatus): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'suspended':
      return 'destructive';
    default:
      return 'secondary';
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
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm text-foreground">{value}</dd>
    </div>
  );
}

/**
 * OrganizationDetailsView displays the details of a single organization.
 */
export function OrganizationDetailsView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchOrganization = async () => {
      if (!id) {
        navigate('/admin/organizations');
        return;
      }

      try {
        const data = await OrganizationsService.get(id);
        if (isMounted) {
          setOrganization(data);
        }
      } catch (error) {
        handleApiError(error);
        toastError(t('organizations.details.fetchError'));
        navigate('/admin/organizations');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOrganization();

    return () => {
      isMounted = false;
    };
  }, [id, navigate, t]);

  const handleEdit = () => {
    if (id) {
      navigate(`/admin/organizations/${id}/edit`);
    }
  };

  const handleBack = () => {
    navigate('/admin/organizations');
  };

  if (isLoading) {
    return (
      <PageContainer title={t('organizations.details.title')}>
        <SkeletonCard />
      </PageContainer>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <PageContainer
      title={organization.name}
      description={t('organizations.details.description')}
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
                <CardTitle>{organization.name}</CardTitle>
                <CardDescription>{organization.slug}</CardDescription>
              </div>
              <Badge variant={getStatusVariant(organization.status)}>
                {t(`organizations.status.${organization.status}`)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              <DetailRow label={t('organizations.details.id')} value={organization.id} />
              <DetailRow
                label={t('organizations.details.createdAt')}
                value={formatDate(organization.createdAt)}
              />
              <DetailRow
                label={t('organizations.details.updatedAt')}
                value={formatDate(organization.updatedAt)}
              />
            </dl>
          </CardContent>
        </Card>

        {/* Contact info card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('organizations.details.contactTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              <DetailRow label={t('organizations.form.email')} value={organization.email} />
              <DetailRow label={t('organizations.form.phone')} value={organization.phone} />
              <DetailRow label={t('organizations.form.website')} value={organization.website} />
            </dl>
            {!organization.email && !organization.phone && !organization.website && (
              <p className="text-sm text-muted-foreground">
                {t('organizations.details.noContact')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Address card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('organizations.details.addressTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {organization.address ||
            organization.city ||
            organization.state ||
            organization.country ||
            organization.postalCode ? (
              <address className="text-sm text-foreground not-italic">
                {organization.address && <p>{organization.address}</p>}
                {(organization.city || organization.state || organization.postalCode) && (
                  <p>
                    {[organization.city, organization.state, organization.postalCode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
                {organization.country && <p>{organization.country}</p>}
              </address>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('organizations.details.noAddress')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
