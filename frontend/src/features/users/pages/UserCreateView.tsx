/**
 * User create view.
 */
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/layouts';
import { Card, CardContent, toastSuccess, toastError } from '@/components/ui';
import { UsersService } from '@/services';
import { handleApiError } from '@/utils';
import type { CreateUserPayload } from '@/@types/user';
import { UserForm, type UserFormSubmitData } from './UserForm';

/**
 * Type guard to check if data is CreateUserPayload.
 */
function isCreatePayload(data: UserFormSubmitData): data is CreateUserPayload {
  return 'sendInvitation' in data || !('status' in data);
}

/**
 * UserCreateView renders the form to create a new user.
 */
export function UserCreateView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: UserFormSubmitData) => {
    if (!isCreatePayload(data)) {
      toastError(t('users.create.error'));
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await UsersService.create(data);
      toastSuccess(t('users.create.success'));
      navigate(`/admin/users/${created.id}`);
    } catch (error) {
      handleApiError(error);
      toastError(t('users.create.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/users');
  };

  return (
    <PageContainer
      title={t('users.create.title')}
      description={t('users.create.description')}
    >
      <Card>
        <CardContent className="pt-6">
          <UserForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
