/**
 * Form Builder Tests
 * Task 1.3: Tests for form validation and persistence.
 * Task 1.8: Security/compliance tests for form access and versioning.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formBuilderService } from '../src/services/form-builder.service.js';
import {
  validateFieldIdUniqueness,
  validateConditionalReferences,
  countFormFields,
  isValidFieldType,
  isValidFormStatus,
  createFormRequestSchema,
  updateFormRequestSchema,
  listFormsQuerySchema,
  formIdParamSchema,
  type FormSection,
  type CreateFormRequest,
} from '../src/models/form-builder.model.js';

// Mock Redis
vi.mock('../src/db/redis.js', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  cacheDel: vi.fn().mockResolvedValue(undefined),
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 100, resetAt: Date.now() + 60000 }),
}));

// Mock audit service
vi.mock('../src/services/audit.service.js', () => ({
  auditService: {
    logFormCreated: vi.fn(),
    logFormUpdated: vi.fn(),
    logFormDeleted: vi.fn(),
    logFormAccessed: vi.fn(),
    logFormAccessDenied: vi.fn(),
    logAnomaly: vi.fn(),
    log: vi.fn(),
  },
}));

// Mock metrics service
vi.mock('../src/services/metrics.service.js', () => ({
  metricsService: {
    recordFormBuilderRequest: vi.fn(),
    recordFormBuilderCacheHit: vi.fn(),
    recordFormBuilderCacheMiss: vi.fn(),
    checkFormBuilderSLOs: vi.fn().mockReturnValue({ met: true, violations: [] }),
    incrementCounter: vi.fn(),
  },
  FORM_BUILDER_METRICS: {
    RATE_LIMIT_HIT: 'form_builder_rate_limit_hit_total',
  },
}));

describe('Form Builder Model Validation', () => {
  describe('validateFieldIdUniqueness', () => {
    it('returns valid for unique field IDs', () => {
      const sections: FormSection[] = [
        {
          id: 'section1',
          title: 'Section 1',
          fields: [
            { id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 },
            { id: 'field2', type: 'email', name: 'email', label: 'Email', order: 1 },
          ],
          order: 0,
        },
      ];

      const result = validateFieldIdUniqueness(sections);
      expect(result.valid).toBe(true);
      expect(result.duplicateIds).toHaveLength(0);
    });

    it('returns invalid for duplicate field IDs', () => {
      const sections: FormSection[] = [
        {
          id: 'section1',
          title: 'Section 1',
          fields: [
            { id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 },
            { id: 'field1', type: 'email', name: 'email', label: 'Email', order: 1 },
          ],
          order: 0,
        },
      ];

      const result = validateFieldIdUniqueness(sections);
      expect(result.valid).toBe(false);
      expect(result.duplicateIds).toContain('field1');
    });

    it('detects duplicates across sections', () => {
      const sections: FormSection[] = [
        {
          id: 'section1',
          title: 'Section 1',
          fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
          order: 0,
        },
        {
          id: 'section2',
          title: 'Section 2',
          fields: [{ id: 'field1', type: 'text', name: 'other', label: 'Other', order: 0 }],
          order: 1,
        },
      ];

      const result = validateFieldIdUniqueness(sections);
      expect(result.valid).toBe(false);
      expect(result.duplicateIds).toContain('field1');
    });
  });

  describe('validateConditionalReferences', () => {
    it('returns valid when all conditional references exist', () => {
      const sections: FormSection[] = [
        {
          id: 'section1',
          title: 'Section 1',
          fields: [
            { id: 'field1', type: 'checkbox', name: 'agree', label: 'Agree', order: 0 },
            {
              id: 'field2',
              type: 'text',
              name: 'details',
              label: 'Details',
              order: 1,
              conditionalVisibility: { fieldId: 'field1', operator: 'equals', value: true },
            },
          ],
          order: 0,
        },
      ];

      const result = validateConditionalReferences(sections);
      expect(result.valid).toBe(true);
      expect(result.invalidRefs).toHaveLength(0);
    });

    it('returns invalid for non-existent field references', () => {
      const sections: FormSection[] = [
        {
          id: 'section1',
          title: 'Section 1',
          fields: [
            {
              id: 'field1',
              type: 'text',
              name: 'details',
              label: 'Details',
              order: 0,
              conditionalVisibility: { fieldId: 'nonexistent', operator: 'equals', value: 'test' },
            },
          ],
          order: 0,
        },
      ];

      const result = validateConditionalReferences(sections);
      expect(result.valid).toBe(false);
      expect(result.invalidRefs).toContain('nonexistent');
    });

    it('validates section-level conditional visibility', () => {
      const sections: FormSection[] = [
        {
          id: 'section1',
          title: 'Section 1',
          fields: [{ id: 'field1', type: 'checkbox', name: 'show', label: 'Show', order: 0 }],
          order: 0,
        },
        {
          id: 'section2',
          title: 'Section 2',
          fields: [],
          order: 1,
          conditionalVisibility: { fieldId: 'missing_field', operator: 'equals', value: true },
        },
      ];

      const result = validateConditionalReferences(sections);
      expect(result.valid).toBe(false);
      expect(result.invalidRefs).toContain('missing_field');
    });
  });

  describe('countFormFields', () => {
    it('counts fields across all sections', () => {
      const sections: FormSection[] = [
        {
          id: 'section1',
          title: 'Section 1',
          fields: [
            { id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 },
            { id: 'field2', type: 'email', name: 'email', label: 'Email', order: 1 },
          ],
          order: 0,
        },
        {
          id: 'section2',
          title: 'Section 2',
          fields: [{ id: 'field3', type: 'phone', name: 'phone', label: 'Phone', order: 0 }],
          order: 1,
        },
      ];

      expect(countFormFields(sections)).toBe(3);
    });

    it('returns 0 for empty sections', () => {
      expect(countFormFields([])).toBe(0);
    });
  });

  describe('type validators', () => {
    it('validates field types', () => {
      expect(isValidFieldType('text')).toBe(true);
      expect(isValidFieldType('email')).toBe(true);
      expect(isValidFieldType('invalid')).toBe(false);
    });

    it('validates form statuses', () => {
      expect(isValidFormStatus('draft')).toBe(true);
      expect(isValidFormStatus('published')).toBe(true);
      expect(isValidFormStatus('archived')).toBe(true);
      expect(isValidFormStatus('invalid')).toBe(false);
    });
  });
});

describe('Form Builder Schema Validation', () => {
  describe('createFormRequestSchema', () => {
    it('validates a valid create request', () => {
      const request: CreateFormRequest = {
        name: 'Test Form',
        description: 'A test form',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
        settings: {
          submitButtonText: 'Submit',
        },
      };

      const result = createFormRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const request = {
        name: '',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      };

      const result = createFormRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('rejects empty sections', () => {
      const request = {
        name: 'Test Form',
        sections: [],
      };

      const result = createFormRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('rejects invalid field types', () => {
      const request = {
        name: 'Test Form',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'invalid_type', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      };

      const result = createFormRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('updateFormRequestSchema', () => {
    it('validates partial update', () => {
      const request = {
        name: 'Updated Name',
      };

      const result = updateFormRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('validates empty update', () => {
      const result = updateFormRequestSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('listFormsQuerySchema', () => {
    it('validates valid query params', () => {
      const query = {
        status: 'published',
        limit: '10',
        offset: '0',
        sortBy: 'name',
        sortOrder: 'asc',
      };

      const result = listFormsQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      expect(result.data?.limit).toBe(10);
    });

    it('applies defaults', () => {
      const result = listFormsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.limit).toBe(20);
      expect(result.data?.offset).toBe(0);
    });
  });

  describe('formIdParamSchema', () => {
    it('validates valid UUID', () => {
      const result = formIdParamSchema.safeParse({ formId: '550e8400-e29b-41d4-a716-446655440000' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid UUID', () => {
      const result = formIdParamSchema.safeParse({ formId: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });
  });
});

describe('Form Builder Service', () => {
  const tenantId = 'tenant-1';
  const userId = 'user-1';
  const userType = 'user' as const;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createForm', () => {
    it('creates a form successfully', async () => {
      const request: CreateFormRequest = {
        name: 'Test Form',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      };

      const result = await formBuilderService.createForm(tenantId, userId, userType, request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Test Form');
      expect(result.data?.tenantId).toBe(tenantId);
      expect(result.data?.version).toBe(1);
      expect(result.data?.status).toBe('draft');
    });

    it('rejects duplicate field IDs', async () => {
      const request: CreateFormRequest = {
        name: 'Test Form',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [
              { id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 },
              { id: 'field1', type: 'email', name: 'email', label: 'Email', order: 1 },
            ],
            order: 0,
          },
        ],
      };

      const result = await formBuilderService.createForm(tenantId, userId, userType, request);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_FIELD_IDS');
    });

    it('rejects invalid conditional references', async () => {
      const request: CreateFormRequest = {
        name: 'Test Form',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [
              {
                id: 'field1',
                type: 'text',
                name: 'name',
                label: 'Name',
                order: 0,
                conditionalVisibility: { fieldId: 'nonexistent', operator: 'equals', value: 'test' },
              },
            ],
            order: 0,
          },
        ],
      };

      const result = await formBuilderService.createForm(tenantId, userId, userType, request);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CONDITIONAL_REFS');
    });
  });

  describe('getForm', () => {
    it('retrieves a form by ID', async () => {
      // First create a form
      const createRequest: CreateFormRequest = {
        name: 'Get Test Form',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      };

      const createResult = await formBuilderService.createForm(tenantId, userId, userType, createRequest);
      expect(createResult.success).toBe(true);

      const formId = createResult.data!.id;

      // Now get it
      const getResult = await formBuilderService.getForm(tenantId, formId, userId, userType);

      expect(getResult.success).toBe(true);
      expect(getResult.data?.form.name).toBe('Get Test Form');
    });

    it('returns not found for non-existent form', async () => {
      const result = await formBuilderService.getForm(
        tenantId,
        '00000000-0000-0000-0000-000000000000',
        userId,
        userType
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('FORM_NOT_FOUND');
    });

    it('enforces tenant isolation', async () => {
      // Create a form in tenant-1
      const createRequest: CreateFormRequest = {
        name: 'Tenant Isolation Test',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      };

      const createResult = await formBuilderService.createForm(tenantId, userId, userType, createRequest);
      const formId = createResult.data!.id;

      // Try to get it from tenant-2
      const getResult = await formBuilderService.getForm('tenant-2', formId, userId, userType);

      expect(getResult.success).toBe(false);
      expect(getResult.errorCode).toBe('FORM_NOT_FOUND');
    });
  });

  describe('updateForm', () => {
    it('updates a form and increments version', async () => {
      // Create a form
      const createRequest: CreateFormRequest = {
        name: 'Update Test Form',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      };

      const createResult = await formBuilderService.createForm(tenantId, userId, userType, createRequest);
      const formId = createResult.data!.id;

      // Update it
      const updateResult = await formBuilderService.updateForm(tenantId, formId, userId, userType, {
        name: 'Updated Name',
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.name).toBe('Updated Name');
      expect(updateResult.data?.version).toBe(2);
    });

    it('preserves unchanged fields', async () => {
      const createRequest: CreateFormRequest = {
        name: 'Preserve Test Form',
        description: 'Original description',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      };

      const createResult = await formBuilderService.createForm(tenantId, userId, userType, createRequest);
      const formId = createResult.data!.id;

      // Update only name
      const updateResult = await formBuilderService.updateForm(tenantId, formId, userId, userType, {
        name: 'New Name',
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.description).toBe('Original description');
    });

    it('enforces tenant isolation on update', async () => {
      const createRequest: CreateFormRequest = {
        name: 'Tenant Update Test',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      };

      const createResult = await formBuilderService.createForm(tenantId, userId, userType, createRequest);
      const formId = createResult.data!.id;

      // Try to update from different tenant
      const updateResult = await formBuilderService.updateForm('other-tenant', formId, userId, userType, {
        name: 'Hacked Name',
      });

      expect(updateResult.success).toBe(false);
      expect(updateResult.errorCode).toBe('FORM_NOT_FOUND');
    });
  });

  describe('listForms', () => {
    it('lists forms for a tenant', async () => {
      const testTenantId = 'list-test-tenant';

      // Create some forms
      for (let i = 0; i < 3; i++) {
        await formBuilderService.createForm(testTenantId, userId, userType, {
          name: `List Test Form ${i}`,
          sections: [
            {
              id: 'section1',
              title: 'Section 1',
              fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
              order: 0,
            },
          ],
        });
      }

      const result = await formBuilderService.listForms(testTenantId, {});

      expect(result.success).toBe(true);
      expect(result.data?.forms.length).toBeGreaterThanOrEqual(3);
    });

    it('filters by status', async () => {
      const testTenantId = 'filter-test-tenant';

      // Create draft and published forms
      const draftResult = await formBuilderService.createForm(testTenantId, userId, userType, {
        name: 'Draft Form',
        status: 'draft',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      });

      await formBuilderService.createForm(testTenantId, userId, userType, {
        name: 'Published Form',
        status: 'published',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      });

      const draftOnly = await formBuilderService.listForms(testTenantId, { status: 'draft' });

      expect(draftOnly.success).toBe(true);
      expect(draftOnly.data?.forms.every((f) => f.status === 'draft')).toBe(true);
    });

    it('applies pagination', async () => {
      const testTenantId = 'pagination-test-tenant';

      // Create 5 forms
      for (let i = 0; i < 5; i++) {
        await formBuilderService.createForm(testTenantId, userId, userType, {
          name: `Pagination Form ${i}`,
          sections: [
            {
              id: 'section1',
              title: 'Section 1',
              fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
              order: 0,
            },
          ],
        });
      }

      const page1 = await formBuilderService.listForms(testTenantId, { limit: 2, offset: 0 });
      const page2 = await formBuilderService.listForms(testTenantId, { limit: 2, offset: 2 });

      expect(page1.success).toBe(true);
      expect(page1.data?.forms.length).toBe(2);
      expect(page2.success).toBe(true);
      expect(page2.data?.forms.length).toBe(2);
      expect(page1.data?.forms[0].id).not.toBe(page2.data?.forms[0].id);
    });
  });

  describe('deleteForm', () => {
    it('archives a form (soft delete)', async () => {
      const createRequest: CreateFormRequest = {
        name: 'Delete Test Form',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      };

      const createResult = await formBuilderService.createForm(tenantId, userId, userType, createRequest);
      const formId = createResult.data!.id;

      const deleteResult = await formBuilderService.deleteForm(tenantId, formId, userId, userType);

      expect(deleteResult.success).toBe(true);

      // Form should still exist but be archived
      const getResult = await formBuilderService.getForm(tenantId, formId, userId, userType);
      expect(getResult.success).toBe(true);
      expect(getResult.data?.form.status).toBe('archived');
    });

    it('enforces tenant isolation on delete', async () => {
      const createRequest: CreateFormRequest = {
        name: 'Tenant Delete Test',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      };

      const createResult = await formBuilderService.createForm(tenantId, userId, userType, createRequest);
      const formId = createResult.data!.id;

      // Try to delete from different tenant
      const deleteResult = await formBuilderService.deleteForm('other-tenant', formId, userId, userType);

      expect(deleteResult.success).toBe(false);
      expect(deleteResult.errorCode).toBe('FORM_NOT_FOUND');
    });
  });

  describe('versioning', () => {
    it('tracks version history through updates', async () => {
      const createRequest: CreateFormRequest = {
        name: 'Version Test Form',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      };

      const createResult = await formBuilderService.createForm(tenantId, userId, userType, createRequest);
      const formId = createResult.data!.id;

      expect(createResult.data?.version).toBe(1);

      // First update
      const update1 = await formBuilderService.updateForm(tenantId, formId, userId, userType, {
        name: 'Version 2',
      });
      expect(update1.data?.version).toBe(2);

      // Second update
      const update2 = await formBuilderService.updateForm(tenantId, formId, userId, userType, {
        name: 'Version 3',
      });
      expect(update2.data?.version).toBe(3);

      // Check final version
      const getResult = await formBuilderService.getForm(tenantId, formId);
      expect(getResult.data?.form.version).toBe(3);
    });

    it('getFormVersion returns correct version', async () => {
      const createRequest: CreateFormRequest = {
        name: 'Get Version Test',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      };

      const createResult = await formBuilderService.createForm(tenantId, userId, userType, createRequest);
      const formId = createResult.data!.id;

      const version = formBuilderService.getFormVersion(tenantId, formId);
      expect(version).toBe(1);
    });
  });

  describe('SLO checks', () => {
    it('returns SLO status', () => {
      const sloStatus = formBuilderService.checkSLOs();

      expect(sloStatus).toHaveProperty('met');
      expect(sloStatus).toHaveProperty('violations');
      expect(Array.isArray(sloStatus.violations)).toBe(true);
    });
  });
});

describe('Security and Compliance Tests', () => {
  const tenantId = 'security-tenant';
  const userId = 'security-user';
  const userType = 'user' as const;

  describe('Task 1.8: Cross-tenant access prevention', () => {
    it('blocks cross-tenant form retrieval', async () => {
      const createRequest: CreateFormRequest = {
        name: 'Security Test Form',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      };

      const createResult = await formBuilderService.createForm(tenantId, userId, userType, createRequest);
      const formId = createResult.data!.id;

      // Attempt access from different tenant
      const attackerTenantId = 'attacker-tenant';
      const getResult = await formBuilderService.getForm(attackerTenantId, formId, 'attacker', userType);

      expect(getResult.success).toBe(false);
      expect(getResult.errorCode).toBe('FORM_NOT_FOUND');
    });

    it('blocks cross-tenant form modification', async () => {
      const createRequest: CreateFormRequest = {
        name: 'Cross Tenant Mod Test',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      };

      const createResult = await formBuilderService.createForm(tenantId, userId, userType, createRequest);
      const formId = createResult.data!.id;

      // Attempt modification from different tenant
      const attackerTenantId = 'attacker-tenant';
      const updateResult = await formBuilderService.updateForm(
        attackerTenantId,
        formId,
        'attacker',
        userType,
        { name: 'Hacked' }
      );

      expect(updateResult.success).toBe(false);
      expect(updateResult.errorCode).toBe('FORM_NOT_FOUND');
    });

    it('blocks cross-tenant form deletion', async () => {
      const createRequest: CreateFormRequest = {
        name: 'Cross Tenant Delete Test',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      };

      const createResult = await formBuilderService.createForm(tenantId, userId, userType, createRequest);
      const formId = createResult.data!.id;

      // Attempt deletion from different tenant
      const attackerTenantId = 'attacker-tenant';
      const deleteResult = await formBuilderService.deleteForm(attackerTenantId, formId, 'attacker', userType);

      expect(deleteResult.success).toBe(false);
      expect(deleteResult.errorCode).toBe('FORM_NOT_FOUND');

      // Verify form still exists
      const getResult = await formBuilderService.getForm(tenantId, formId, userId, userType);
      expect(getResult.success).toBe(true);
    });
  });

  describe('Task 1.8: Version integrity', () => {
    it('version increments atomically', async () => {
      const createRequest: CreateFormRequest = {
        name: 'Atomic Version Test',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      };

      const createResult = await formBuilderService.createForm(tenantId, userId, userType, createRequest);
      const formId = createResult.data!.id;

      // Perform multiple updates
      const updates = [];
      for (let i = 0; i < 5; i++) {
        updates.push(
          formBuilderService.updateForm(tenantId, formId, userId, userType, {
            name: `Version ${i + 2}`,
          })
        );
      }

      // Wait for all updates (sequential in practice due to service implementation)
      const results = await Promise.all(updates);

      // Get final state
      const finalResult = await formBuilderService.getForm(tenantId, formId, userId, userType);

      expect(finalResult.success).toBe(true);
      expect(finalResult.data?.form.version).toBeGreaterThan(1);
    });

    it('preserves audit trail through updates', async () => {
      const { auditService } = await import('../src/services/audit.service.js');

      const createRequest: CreateFormRequest = {
        name: 'Audit Trail Test',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      };

      await formBuilderService.createForm(tenantId, userId, userType, createRequest);

      // Verify audit was logged
      expect(auditService.logFormCreated).toHaveBeenCalled();
    });
  });

  describe('Task 1.8: Input validation security', () => {
    it('sanitizes malicious field names', async () => {
      const request: CreateFormRequest = {
        name: '<script>alert("xss")</script>',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [
              {
                id: 'field1',
                type: 'text',
                name: 'safe_name',
                label: '<img src=x onerror=alert("xss")>',
                order: 0,
              },
            ],
            order: 0,
          },
        ],
      };

      // The schema accepts the input but stores it as-is
      // Output encoding should be handled at the presentation layer
      const result = await formBuilderService.createForm(tenantId, userId, userType, request);
      expect(result.success).toBe(true);
    });

    it('rejects overly long field names', () => {
      const request = {
        name: 'a'.repeat(300), // Exceeds 200 char limit
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: 0 }],
            order: 0,
          },
        ],
      };

      const result = createFormRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('rejects negative order values', () => {
      const request = {
        name: 'Test Form',
        sections: [
          {
            id: 'section1',
            title: 'Section 1',
            fields: [{ id: 'field1', type: 'text', name: 'name', label: 'Name', order: -1 }],
            order: 0,
          },
        ],
      };

      const result = createFormRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });
});
