/**
 * App Application Intake Tests
 * Task 1.7: Tests for app application intake flows
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appApplicationIntakeService } from '../src/services/app-application-intake.service.js';
import { appApplicationIntakeRepository } from '../src/repositories/app-application-intake.repository.js';
import type {
  Application,
  AssignedApplication,
  FormDefinition,
  FieldResponse,
} from '../src/models/app-application-intake.model.js';

// Mock the repository
vi.mock('../src/repositories/app-application-intake.repository.js', () => ({
  appApplicationIntakeRepository: {
    findAssignedApplications: vi.fn(),
    findApplicationById: vi.fn(),
    findFormDefinitionById: vi.fn(),
    findSavedResponses: vi.fn(),
    saveDraftResponses: vi.fn(),
    submitFinalResponses: vi.fn(),
    getRequiredFields: vi.fn(),
    calculateCompletionPercentage: vi.fn(),
  },
}));

// Mock the audit service
vi.mock('../src/services/audit.service.js', () => ({
  auditService: {
    log: vi.fn(),
  },
}));

const mockCandidateId = 'candidate-123';
const mockTenantId = 'tenant-456';
const mockApplicationId = 'app-789';

const mockApplication: Application = {
  id: mockApplicationId,
  candidateId: mockCandidateId,
  tenantId: mockTenantId,
  formDefinitionId: 'form-001',
  title: 'Test Application',
  description: 'A test application',
  status: 'pending',
  dueDate: new Date('2026-03-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAssignedApplication: AssignedApplication = {
  ...mockApplication,
  formTitle: 'Test Form',
  completionPercentage: 50,
  lastSavedAt: new Date(),
};

const mockFormDefinition: FormDefinition = {
  id: 'form-001',
  title: 'Test Form',
  description: 'A test form definition',
  sections: [
    {
      id: 'section-1',
      title: 'Personal Information',
      description: 'Basic personal details',
      order: 1,
      fields: [
        {
          id: 'field-1',
          name: 'firstName',
          label: 'First Name',
          type: 'text',
          required: true,
          order: 1,
        },
        {
          id: 'field-2',
          name: 'lastName',
          label: 'Last Name',
          type: 'text',
          required: true,
          order: 2,
        },
        {
          id: 'field-3',
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          order: 3,
        },
      ],
    },
  ],
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSavedResponses: FieldResponse[] = [
  { fieldId: 'field-1', value: 'John', updatedAt: new Date() },
  { fieldId: 'field-2', value: 'Doe', updatedAt: new Date() },
];

describe('AppApplicationIntakeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listAssignedApplications', () => {
    it('should return assigned applications for a candidate', async () => {
      vi.mocked(appApplicationIntakeRepository.findAssignedApplications).mockResolvedValue([
        mockAssignedApplication,
      ]);
      vi.mocked(appApplicationIntakeRepository.calculateCompletionPercentage).mockResolvedValue(50);

      const result = await appApplicationIntakeService.listAssignedApplications(
        mockCandidateId,
        mockTenantId
      );

      expect(result.success).toBe(true);
      expect(result.applications).toHaveLength(1);
      expect(result.applications?.[0].id).toBe(mockApplicationId);
      expect(result.applications?.[0].completionPercentage).toBe(50);
    });

    it('should return empty list when no applications assigned', async () => {
      vi.mocked(appApplicationIntakeRepository.findAssignedApplications).mockResolvedValue([]);

      const result = await appApplicationIntakeService.listAssignedApplications(
        mockCandidateId,
        mockTenantId
      );

      expect(result.success).toBe(true);
      expect(result.applications).toHaveLength(0);
    });
  });

  describe('loadApplicationForm', () => {
    it('should load application form with saved responses', async () => {
      vi.mocked(appApplicationIntakeRepository.findApplicationById).mockResolvedValue(mockApplication);
      vi.mocked(appApplicationIntakeRepository.findFormDefinitionById).mockResolvedValue(mockFormDefinition);
      vi.mocked(appApplicationIntakeRepository.findSavedResponses).mockResolvedValue(mockSavedResponses);

      const result = await appApplicationIntakeService.loadApplicationForm(
        mockApplicationId,
        mockCandidateId
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.application.id).toBe(mockApplicationId);
      expect(result.data?.formDefinition.id).toBe(mockFormDefinition.id);
      expect(result.data?.savedResponses).toHaveLength(2);
    });

    it('should return error for non-existent application', async () => {
      vi.mocked(appApplicationIntakeRepository.findApplicationById).mockResolvedValue(null);

      const result = await appApplicationIntakeService.loadApplicationForm(
        'non-existent-id',
        mockCandidateId
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should return error if application is already submitted', async () => {
      vi.mocked(appApplicationIntakeRepository.findApplicationById).mockResolvedValue({
        ...mockApplication,
        status: 'submitted',
      });

      const result = await appApplicationIntakeService.loadApplicationForm(
        mockApplicationId,
        mockCandidateId
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_EDITABLE');
    });
  });

  describe('saveDraft', () => {
    it('should save draft responses successfully', async () => {
      const savedAt = new Date();
      vi.mocked(appApplicationIntakeRepository.findApplicationById).mockResolvedValue(mockApplication);
      vi.mocked(appApplicationIntakeRepository.saveDraftResponses).mockResolvedValue({ savedAt });
      vi.mocked(appApplicationIntakeRepository.calculateCompletionPercentage).mockResolvedValue(67);

      const responses = [
        { fieldId: 'field-1', value: 'John' },
        { fieldId: 'field-2', value: 'Doe' },
      ];

      const result = await appApplicationIntakeService.saveDraft(
        mockApplicationId,
        mockCandidateId,
        responses
      );

      expect(result.success).toBe(true);
      expect(result.data?.savedAt).toEqual(savedAt);
      expect(result.data?.completionPercentage).toBe(67);
    });

    it('should return error for non-existent application', async () => {
      vi.mocked(appApplicationIntakeRepository.findApplicationById).mockResolvedValue(null);

      const result = await appApplicationIntakeService.saveDraft(
        'non-existent-id',
        mockCandidateId,
        [{ fieldId: 'field-1', value: 'test' }]
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should return error for already submitted application', async () => {
      vi.mocked(appApplicationIntakeRepository.findApplicationById).mockResolvedValue({
        ...mockApplication,
        status: 'submitted',
      });

      const result = await appApplicationIntakeService.saveDraft(
        mockApplicationId,
        mockCandidateId,
        [{ fieldId: 'field-1', value: 'test' }]
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_EDITABLE');
    });
  });

  describe('validateSubmission', () => {
    it('should pass validation when all required fields are filled', async () => {
      vi.mocked(appApplicationIntakeRepository.findApplicationById).mockResolvedValue(mockApplication);
      vi.mocked(appApplicationIntakeRepository.getRequiredFields).mockResolvedValue([
        { id: 'field-1', name: 'firstName' },
        { id: 'field-2', name: 'lastName' },
        { id: 'field-3', name: 'email' },
      ]);

      const responses = [
        { fieldId: 'field-1', value: 'John' },
        { fieldId: 'field-2', value: 'Doe' },
        { fieldId: 'field-3', value: 'john@example.com' },
      ];

      const result = await appApplicationIntakeService.validateSubmission(
        mockApplicationId,
        mockCandidateId,
        responses
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when required fields are missing', async () => {
      vi.mocked(appApplicationIntakeRepository.findApplicationById).mockResolvedValue(mockApplication);
      vi.mocked(appApplicationIntakeRepository.getRequiredFields).mockResolvedValue([
        { id: 'field-1', name: 'firstName' },
        { id: 'field-2', name: 'lastName' },
        { id: 'field-3', name: 'email' },
      ]);

      const responses = [
        { fieldId: 'field-1', value: 'John' },
        // Missing field-2 and field-3
      ];

      const result = await appApplicationIntakeService.validateSubmission(
        mockApplicationId,
        mockCandidateId,
        responses
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors.some((e) => e.fieldName === 'lastName')).toBe(true);
      expect(result.errors.some((e) => e.fieldName === 'email')).toBe(true);
    });
  });

  describe('submitApplication', () => {
    it('should submit application successfully when validation passes', async () => {
      const submittedAt = new Date();
      const confirmationNumber = 'APP-12345-ABCD';

      vi.mocked(appApplicationIntakeRepository.findApplicationById).mockResolvedValue(mockApplication);
      vi.mocked(appApplicationIntakeRepository.getRequiredFields).mockResolvedValue([
        { id: 'field-1', name: 'firstName' },
      ]);
      vi.mocked(appApplicationIntakeRepository.submitFinalResponses).mockResolvedValue({
        submittedAt,
        confirmationNumber,
      });

      const responses = [{ fieldId: 'field-1', value: 'John' }];

      const result = await appApplicationIntakeService.submitApplication(
        mockApplicationId,
        mockCandidateId,
        responses
      );

      expect(result.success).toBe(true);
      expect(result.data?.submittedAt).toEqual(submittedAt);
      expect(result.data?.confirmationNumber).toBe(confirmationNumber);
      expect(result.data?.applicationId).toBe(mockApplicationId);
    });

    it('should return validation errors when required fields are missing', async () => {
      vi.mocked(appApplicationIntakeRepository.findApplicationById).mockResolvedValue(mockApplication);
      vi.mocked(appApplicationIntakeRepository.getRequiredFields).mockResolvedValue([
        { id: 'field-1', name: 'firstName' },
        { id: 'field-2', name: 'lastName' },
      ]);

      const responses = [{ fieldId: 'field-1', value: 'John' }];

      const result = await appApplicationIntakeService.submitApplication(
        mockApplicationId,
        mockCandidateId,
        responses
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('VALIDATION_FAILED');
      expect(result.validationErrors).toHaveLength(1);
      expect(result.validationErrors?.[0].fieldName).toBe('lastName');
    });

    it('should return error for already submitted application', async () => {
      vi.mocked(appApplicationIntakeRepository.findApplicationById).mockResolvedValue({
        ...mockApplication,
        status: 'submitted',
      });

      const result = await appApplicationIntakeService.submitApplication(
        mockApplicationId,
        mockCandidateId,
        []
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ALREADY_SUBMITTED');
    });

    it('should return error for non-existent application', async () => {
      vi.mocked(appApplicationIntakeRepository.findApplicationById).mockResolvedValue(null);

      const result = await appApplicationIntakeService.submitApplication(
        'non-existent-id',
        mockCandidateId,
        []
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });
  });
});
