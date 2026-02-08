/**
 * Forms module mock fixtures.
 * Provides fake data for form builder endpoints.
 * Matches frontend Form, FormField, FormSchema, and FormListResponse types.
 */

import type { Form, FormField, FormSchema, FormStatus } from '@/@types/form';

/** Generate a mock form with given id. */
export function createMockForm(id: string, overrides?: Partial<Form>): Form {
  return {
    id,
    name: `Form ${id}`,
    description: `Description for form ${id}`,
    status: 'draft' as FormStatus,
    schema: { fields: [], version: 1 },
    createdAt: '2025-11-01T10:00:00.000Z',
    updatedAt: '2026-01-20T14:00:00.000Z',
    ...overrides,
  };
}

/** Helper to build FormField entries from simplified definitions. */
function field(
  id: string,
  label: string,
  type: FormField['type'],
  opts?: { required?: boolean; options?: Array<{ value: string; label: string }>; placeholder?: string },
): FormField {
  const f: FormField = { id, type, label };
  if (opts?.placeholder) f.placeholder = opts.placeholder;
  if (opts?.required) f.validation = { required: true };
  if (opts?.options) f.options = opts.options;
  return f;
}

/** Helper to build a select option pair. */
function opt(value: string, label?: string): { value: string; label: string } {
  return { value, label: label ?? value };
}

/** Predefined mock forms matching the Form type. */
export const mockForms: Form[] = [
  createMockForm('form-001', {
    name: 'Candidate Intake Form',
    description: 'Collects basic information from new candidates during onboarding.',
    status: 'published',
    schema: {
      fields: [
        field('field-001', 'Full Name', 'text', { required: true }),
        field('field-002', 'Email Address', 'text', { required: true, placeholder: 'email@example.com' }),
        field('field-003', 'Date of Birth', 'date', { required: true }),
        field('field-004', 'Position Applied For', 'select', {
          required: true,
          options: [opt('engineer', 'Engineer'), opt('designer', 'Designer'), opt('manager', 'Manager'), opt('other', 'Other')],
        }),
        field('field-005', 'Resume / CV', 'file', { required: true }),
        field('field-006', 'Additional Notes', 'text', { placeholder: 'Any extra information…' }),
      ],
      version: 1,
    } satisfies FormSchema,
  }),
  createMockForm('form-002', {
    name: 'Reference Check Questionnaire',
    description: 'Questionnaire sent to candidate references for employment verification.',
    status: 'published',
    schema: {
      fields: [
        field('field-007', 'Reference Name', 'text', { required: true }),
        field('field-008', 'Relationship to Candidate', 'select', {
          required: true,
          options: [opt('manager', 'Manager'), opt('colleague', 'Colleague'), opt('hr', 'HR'), opt('other', 'Other')],
        }),
        field('field-009', 'Employment Dates Accurate?', 'select', {
          required: true,
          options: [opt('yes', 'Yes'), opt('no', 'No')],
        }),
        field('field-010', 'Would you rehire this person?', 'select', {
          required: true,
          options: [opt('yes', 'Yes'), opt('no', 'No'), opt('unsure', 'Unsure')],
        }),
        field('field-011', 'Additional Comments', 'text', { placeholder: 'Optional comments…' }),
      ],
      version: 1,
    } satisfies FormSchema,
  }),
  createMockForm('form-003', {
    name: 'Consent & Disclosure',
    description: 'GDPR-compliant consent form for background screening.',
    status: 'draft',
    schema: {
      fields: [
        field('field-012', 'I consent to a background check', 'select', {
          required: true,
          options: [opt('yes', 'Yes'), opt('no', 'No')],
        }),
        field('field-013', 'Electronic Signature', 'text', { required: true }),
        field('field-014', 'Date Signed', 'date', { required: true }),
      ],
      version: 1,
    } satisfies FormSchema,
  }),
];

/** Strip schema from forms for list view (lighter payload). */
function toListForm(form: Form): Omit<Form, 'schema'> & { schema: FormSchema } {
  return form;
}

/** Mock forms list response matching FormListResponse. */
export const formsListResponse = {
  data: mockForms.map(toListForm),
  meta: {
    page: 1,
    pageSize: 10,
    totalItems: mockForms.length,
    totalPages: 1,
  },
};

/** Get a single form by ID (with full schema). */
export function getFormById(id: string): Form | undefined {
  return mockForms.find((f) => f.id === id);
}

/** Mock form creation response. */
export function createFormResponse(data: Partial<Form>): Form {
  const id = `form-${String(mockForms.length + 1).padStart(3, '0')}`;
  return createMockForm(id, {
    ...data,
    schema: data.schema ?? { fields: [], version: 1 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
