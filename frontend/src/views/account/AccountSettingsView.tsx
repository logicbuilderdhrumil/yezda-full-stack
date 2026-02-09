/**
 * Account Settings View
 * Task 1.2: Build account settings layout and sections
 * Task 1.3: Implement profile update form and validation
 * Task 1.8: Wire success and error toasts
 */
import { useState, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layouts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  SkeletonCard,
  toastSuccess,
  toastError,
  toastPromise,
} from '@/components/ui';
import { AccountService } from '@/services/AccountService';
import { handleApiError } from '@/utils';
import type { AccountProfile, UpdateProfilePayload } from '@/@types/account';
import { ProfileForm } from './ProfileForm';

/**
 * AccountSettingsView renders account settings with profile and preferences tabs.
 */
export function AccountSettingsView(): ReactNode {
  const { t } = useTranslation();

  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async (): Promise<void> => {
      try {
        const data = await AccountService.getProfile();
        if (isMounted) {
          setProfile(data);
        }
      } catch (error) {
        handleApiError(error);
        // t is stable enough for error messages; we fetch only on mount
        toastError(t('account.fetchError'));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchProfile();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProfileSubmit = async (data: UpdateProfilePayload): Promise<void> => {
    setIsSubmitting(true);
    try {
      const updated = await AccountService.updateProfile(data);
      setProfile(updated);
      toastSuccess(t('account.updateSuccess'));
    } catch (error) {
      handleApiError(error);
      toastError(t('account.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUpload = async (file: File): Promise<void> => {
    setIsAvatarLoading(true);
    try {
      const result = await toastPromise(
        AccountService.uploadAvatar(file),
        {
          loading: t('account.avatar.uploading'),
          success: t('account.avatar.uploadSuccess'),
          error: t('account.avatar.uploadError'),
        }
      );
      // Update profile with new avatar URL
      if (profile) {
        setProfile({ ...profile, avatarUrl: result.avatarUrl });
      }
    } catch {
      // Error handled by toastPromise
    } finally {
      setIsAvatarLoading(false);
    }
  };

  const handleAvatarRemove = async (): Promise<void> => {
    setIsAvatarLoading(true);
    try {
      await toastPromise(
        AccountService.removeAvatar(),
        {
          loading: t('account.avatar.removing'),
          success: t('account.avatar.removeSuccess'),
          error: t('account.avatar.removeError'),
        }
      );
      // Update profile to remove avatar URL
      if (profile) {
        setProfile({ ...profile, avatarUrl: undefined });
      }
    } catch {
      // Error handled by toastPromise
    } finally {
      setIsAvatarLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer
        title={t('account.title')}
        description={t('account.description')}
      >
        <SkeletonCard />
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer
        title={t('account.title')}
        description={t('account.description')}
      >
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">{t('account.loadError')}</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={t('account.title')}
      description={t('account.description')}
    >
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">{t('account.tabs.profile')}</TabsTrigger>
          <TabsTrigger value="security">{t('account.tabs.security')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('account.profile.title')}</CardTitle>
              <CardDescription>{t('account.profile.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm
                profile={profile}
                onSubmit={handleProfileSubmit}
                onAvatarUpload={handleAvatarUpload}
                onAvatarRemove={handleAvatarRemove}
                isSubmitting={isSubmitting}
                isLoading={isAvatarLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>{t('account.security.title')}</CardTitle>
              <CardDescription>{t('account.security.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('account.security.comingSoon')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
