/**
 * Organization details view with tabbed layout for Users and Candidates.
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
import { InviteMemberDialog } from '@/features/invites/components/InviteMemberDialog';
import { AdminInviteCandidateDialog } from '@/features/invites/components/AdminInviteCandidateDialog';
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
 * OrganizationDetailsView displays the details of a single organization
 * with tabbed navigation for Users and Candidates management.
 */
export function OrganizationDetailsView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'users' | 'candidates'>('details');
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [isInviteCandidateOpen, setIsInviteCandidateOpen] = useState(false);

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

        {/* Tab navigation */}
        <div className="border-b border-border">
          <nav className="flex gap-6" aria-label="Organization sections">
            {(['details', 'users', 'candidates'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab(tab)}
                aria-selected={activeTab === tab}
                role="tab"
              >
                {t(`organizations.tabs.${tab}`)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab: Details */}
        {activeTab === 'details' && (
          <>
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
          </>
        )}

        {/* Tab: Users */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('organizations.tabs.users')}</CardTitle>
                  <CardDescription>
                    {t('organizations.users.description', { organization: organization.name })}
                  </CardDescription>
                </div>
                <Button onClick={() => setIsInviteMemberOpen(true)}>
                  {t('invites.member.inviteButton')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('organizations.users.viewAll')}
              </p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => navigate(`/admin/organizations/${id}/users`)}
              >
                {t('organizations.users.manageButton')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tab: Candidates */}
        {activeTab === 'candidates' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('organizations.tabs.candidates')}</CardTitle>
                  <CardDescription>
                    {t('organizations.candidates.description', { organization: organization.name })}
                  </CardDescription>
                </div>
                <Button onClick={() => setIsInviteCandidateOpen(true)}>
                  {t('invites.adminCandidate.inviteButton')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('organizations.candidates.viewAll')}
              </p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => navigate(`/admin/organizations/${id}/candidates`)}
              >
                {t('organizations.candidates.manageButton')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Invite Member Dialog */}
      <InviteMemberDialog
        open={isInviteMemberOpen}
        onOpenChange={setIsInviteMemberOpen}
        organizationId={organization.id}
        organizationName={organization.name}
      />

      {/* Admin Invite Candidate Dialog */}
      <AdminInviteCandidateDialog
        open={isInviteCandidateOpen}
        onOpenChange={setIsInviteCandidateOpen}
        organizationId={organization.id}
        organizationName={organization.name}
      />
    </PageContainer>
  );
}
