/**
 * User edit view.
 */
import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layouts';
import {
  Card,
  CardContent,
  SkeletonCard,
  toastSuccess,
  toastError,
} from '@/components/ui';
import { UsersService } from '@/services';
import { handleApiError } from '@/utils';
import type { ManagedUser, CreateUserPayload } from '@/@types/user';
import { UserForm } from './UserForm';

/**
 * UserEditView renders the form to edit an existing user.
 */
export function UserEditView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [user, setUser] = useState<ManagedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      if (!id) {
        navigate('/users');
        return;
      }

      try {
        const data = await UsersService.get(id);
        if (isMounted) {
          setUser(data);
        }
      } catch (error) {
        handleApiError(error);
        toastError(t('users.edit.fetchError'));
        navigate('/users');
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

  const handleSubmit = async (data: CreateUserPayload) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      await UsersService.update(id, data);
      toastSuccess(t('users.edit.success'));
      navigate(`/users/${id}`);
    } catch (error) {
      handleApiError(error);
      toastError(t('users.edit.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(id ? `/users/${id}` : '/users');
  };

  if (isLoading) {
    return (
      <PageContainer title={t('users.edit.title')}>
        <SkeletonCard />
      </PageContainer>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PageContainer
      title={t('users.edit.title')}
      description={t('users.edit.description', { name: `${user.firstName} ${user.lastName}` })}
    >
      <Card>
        <CardContent className="pt-6">
          <UserForm
            initialData={user}
            isEdit
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
