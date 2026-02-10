/**
 * Application service for screening application intake.
 * Integration alignment: app/backend application flows.
 */

import type {
  ApplicationDTO,
  ApplicationSummaryDTO,
  ApplicationDraftDTO,
  ApplicationListResponseDTO,
  ApplicationDetailResponseDTO,
  ApplicationDraftResponseDTO,
  SaveDraftRequestDTO,
  SaveDraftResponseDTO,
  SubmitApplicationRequestDTO,
  SubmitApplicationResponseDTO,
  FormValues,
  FormSectionDTO,
  ValidationErrorDetail,
} from '../shared-types/application.types.js';

/** In-memory application store for development */
const applicationStore = new Map<string, ApplicationDTO>();
const draftStore = new Map<string, ApplicationDraftDTO>();

/** Sample form sections */
const sampleSections: FormSectionDTO[] = [
  {
    id: 'section-personal',
    title: 'Personal Information',
    description: 'Your basic contact information',
    order: 1,
    fields: [
      {
        id: 'firstName',
        label: 'First Name',
        type: 'text',
        required: true,
        order: 1,
        placeholder: 'Enter your first name',
        maxLength: 100,
      },
      {
        id: 'lastName',
        label: 'Last Name',
        type: 'text',
        required: true,
        order: 2,
        placeholder: 'Enter your last name',
        maxLength: 100,
      },
      {
        id: 'email',
        label: 'Email Address',
        type: 'email',
        required: true,
        order: 3,
        placeholder: 'you@example.com',
      },
      {
        id: 'phone',
        label: 'Phone Number',
        type: 'phone',
        required: true,
        order: 4,
        placeholder: '(555) 123-4567',
      },
    ],
  },
  {
    id: 'section-employment',
    title: 'Employment History',
    description: 'Your recent work experience',
    order: 2,
    fields: [
      {
        id: 'currentEmployer',
        label: 'Current Employer',
        type: 'text',
        required: false,
        order: 1,
        placeholder: 'Company name',
      },
      {
        id: 'jobTitle',
        label: 'Job Title',
        type: 'text',
        required: false,
        order: 2,
        placeholder: 'Your current role',
      },
      {
        id: 'startDate',
        label: 'Start Date',
        type: 'date',
        required: false,
        order: 3,
      },
    ],
  },
];

/** Initialize sample data */
function initSampleData(): void {
  if (applicationStore.size === 0) {
    const now = new Date().toISOString();
    applicationStore.set('app-001', {
      id: 'app-001',
      title: 'Background Check Application',
      description: 'Complete your background check for TechStart Inc',
      status: 'pending',
      lifecycleState: 'draft',
      dueDate: '2026-02-20',
      progress: 0,
      sections: sampleSections,
      createdAt: now,
      updatedAt: now,
    });
    applicationStore.set('app-002', {
      id: 'app-002',
      title: 'Reference Check Form',
      description: 'Provide your professional references',
      status: 'in_progress',
      lifecycleState: 'draft',
      dueDate: '2026-02-25',
      progress: 40,
      sections: sampleSections,
      createdAt: now,
      updatedAt: now,
    });
  }
}

initSampleData();

/**
 * Get all applications for a candidate.
 */
export async function getApplications(
  _candidateId: string
): Promise<ApplicationListResponseDTO> {
  const applications: ApplicationSummaryDTO[] = [];
  for (const app of applicationStore.values()) {
    applications.push({
      id: app.id,
      title: app.title,
      status: app.status,
      lifecycleState: app.lifecycleState,
      dueDate: app.dueDate,
      progress: app.progress,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    });
  }
  return { applications };
}

/**
 * Get a single application by ID.
 */
export async function getApplication(
  applicationId: string,
  _candidateId: string
): Promise<ApplicationDetailResponseDTO | null> {
  const app = applicationStore.get(applicationId);
  if (!app) {
    return null;
  }
  return { application: { ...app } };
}

/**
 * Get application draft.
 */
export async function getApplicationDraft(
  applicationId: string,
  _candidateId: string
): Promise<ApplicationDraftResponseDTO> {
  const draft = draftStore.get(applicationId);
  return { draft: draft ? { ...draft } : null };
}

/**
 * Save application draft.
 */
export async function saveApplicationDraft(
  applicationId: string,
  _candidateId: string,
  data: SaveDraftRequestDTO
): Promise<SaveDraftResponseDTO> {
  const app = applicationStore.get(applicationId);
  if (!app) {
    throw new Error('APPLICATION_NOT_FOUND');
  }

  const now = Date.now();
  const draft: ApplicationDraftDTO = {
    applicationId,
    values: data.values,
    savedAt: now,
  };

  draftStore.set(applicationId, draft);

  // Update application progress
  const completedFields = Object.keys(data.values).filter(
    (key) => data.values[key] !== '' && data.values[key] !== false
  ).length;
  const totalFields = app.sections.reduce(
    (sum, section) => sum + section.fields.length,
    0
  );
  app.progress = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  app.status = 'in_progress';
  app.updatedAt = new Date().toISOString();
  applicationStore.set(applicationId, app);

  return {
    success: true,
    savedAt: now,
    lifecycleState: 'draft',
  };
}

/**
 * Validate form values against form schema.
 */
export function validateFormValues(
  app: ApplicationDTO,
  values: FormValues
): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = [];

  for (const section of app.sections) {
    for (const field of section.fields) {
      const value = values[field.id];

      // Check required
      if (field.required) {
        if (value === undefined || value === '' || value === null) {
          errors.push({
            field: field.id,
            message: `${field.label} is required`,
            code: 'REQUIRED',
          });
          continue;
        }
      }

      // Skip validation if empty and not required
      if (!value) continue;

      // Validate string fields
      if (typeof value === 'string') {
        // Check maxLength
        if (field.maxLength && value.length > field.maxLength) {
          errors.push({
            field: field.id,
            message: `${field.label} must be ${field.maxLength} characters or less`,
            code: 'MAX_LENGTH',
          });
        }

        // Check minLength
        if (field.minLength && value.length < field.minLength) {
          errors.push({
            field: field.id,
            message: `${field.label} must be at least ${field.minLength} characters`,
            code: 'MIN_LENGTH',
          });
        }

        // Check pattern
        if (field.pattern && !new RegExp(field.pattern).test(value)) {
          errors.push({
            field: field.id,
            message: `${field.label} format is invalid`,
            code: 'PATTERN',
          });
        }

        // Check email format
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push({
            field: field.id,
            message: `${field.label} must be a valid email address`,
            code: 'INVALID_EMAIL',
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Submit application.
 */
export async function submitApplication(
  applicationId: string,
  _candidateId: string,
  data: SubmitApplicationRequestDTO
): Promise<{
  response?: SubmitApplicationResponseDTO;
  errors?: ValidationErrorDetail[];
}> {
  const app = applicationStore.get(applicationId);
  if (!app) {
    throw new Error('APPLICATION_NOT_FOUND');
  }

  if (app.status === 'submitted') {
    throw new Error('APPLICATION_ALREADY_SUBMITTED');
  }

  // Validate form values
  const validationErrors = validateFormValues(app, data.values);
  if (validationErrors.length > 0) {
    return { errors: validationErrors };
  }

  // Update application status
  const now = new Date().toISOString();
  app.status = 'submitted';
  app.lifecycleState = 'submitted';
  app.progress = 100;
  app.submittedAt = now;
  app.updatedAt = now;
  applicationStore.set(applicationId, app);

  // Clear draft
  draftStore.delete(applicationId);

  return {
    response: {
      success: true,
      submittedAt: now,
      message: 'Application submitted successfully',
      lifecycleState: 'submitted',
    },
  };
}

/**
 * Get application by ID (internal).
 */
export function getApplicationInternal(applicationId: string): ApplicationDTO | undefined {
  return applicationStore.get(applicationId);
}
