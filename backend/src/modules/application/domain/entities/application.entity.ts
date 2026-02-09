/**
 * Application domain entity.
 */
export type ApplicationStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected';

export interface Application {
  id: string;
  tenantId: string;
  userId: string;
  status: ApplicationStatus;
  formData: Record<string, unknown>;
  draftData?: Record<string, unknown>;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
