/**
 * App Application Intake Service
 * Task 1.2-1.6: Business logic for app application intake
 */

import type {
  AssignedApplication,
  ApplicationFormWithResponses,
  SaveDraftResponse,
  SubmitApplicationResponse,
  SubmissionValidationResult,
  FieldValidationError,
} from '../models/app-application-intake.model.js';
import { appApplicationIntakeRepository } from '../repositories/app-application-intake.repository.js';
import { auditService } from './audit.service.js';

export interface ListApplicationsResult {
  success: boolean;
  applications?: AssignedApplication[];
  error?: string;
  errorCode?: string;
}

export interface LoadFormResult {
  success: boolean;
  data?: ApplicationFormWithResponses;
  error?: string;
  errorCode?: string;
}

export interface SaveDraftResult {
  success: boolean;
  data?: SaveDraftResponse;
  error?: string;
  errorCode?: string;
}

export interface SubmitResult {
  success: boolean;
  data?: SubmitApplicationResponse;
  validationErrors?: FieldValidationError[];
  error?: string;
  errorCode?: string;
}

export class AppApplicationIntakeService {
  /**
   * List all assigned applications for a candidate
   * Task 1.2: Implement assigned application listing
   */
  async listAssignedApplications(
    candidateId: string,
    tenantId: string,
    channel: 'web' | 'mobile' | 'api' = 'mobile',
    ipAddress?: string
  ): Promise<ListApplicationsResult> {
    try {
      const applications = await appApplicationIntakeRepository.findAssignedApplications(
        candidateId,
        tenantId
      );

      // Calculate completion percentage for each application
      const enrichedApplications = await Promise.all(
        applications.map(async (app) => {
          const completionPercentage =
            await appApplicationIntakeRepository.calculateCompletionPercentage(
              app.id,
              candidateId,
              app.formDefinitionId
            );
          return { ...app, completionPercentage };
        })
      );

      // Log audit event
      auditService.log({
        eventType: 'APP_APPLICATION_LIST_VIEWED',
        actorId: candidateId,
        actorType: 'candidate',
        channel,
        ipAddress,
        metadata: {
          tenantId,
          applicationCount: enrichedApplications.length,
        },
        success: true,
      });

      return { success: true, applications: enrichedApplications };
    } catch (error) {
      console.error('[AppApplicationIntakeService] Error listing applications:', error);
      return {
        success: false,
        error: 'Failed to retrieve applications',
        errorCode: 'LIST_FAILED',
      };
    }
  }

  /**
   * Load application form with saved responses
   * Task 1.3: Implement application form retrieval with saved responses
   */
  async loadApplicationForm(
    applicationId: string,
    candidateId: string,
    channel: 'web' | 'mobile' | 'api' = 'mobile',
    ipAddress?: string
  ): Promise<LoadFormResult> {
    try {
      // Verify application ownership
      const application = await appApplicationIntakeRepository.findApplicationById(
        applicationId,
        candidateId
      );

      if (!application) {
        return {
          success: false,
          error: 'Application not found',
          errorCode: 'NOT_FOUND',
        };
      }

      // Check if application is still editable
      if (['submitted', 'approved', 'rejected'].includes(application.status)) {
        return {
          success: false,
          error: 'Application is no longer editable',
          errorCode: 'NOT_EDITABLE',
        };
      }

      // Load form definition
      const formDefinition = await appApplicationIntakeRepository.findFormDefinitionById(
        application.formDefinitionId
      );

      if (!formDefinition) {
        return {
          success: false,
          error: 'Form definition not found',
          errorCode: 'FORM_NOT_FOUND',
        };
      }

      // Load saved responses
      const savedResponses = await appApplicationIntakeRepository.findSavedResponses(
        applicationId,
        candidateId
      );

      const lastSavedAt =
        savedResponses.length > 0
          ? savedResponses.reduce(
              (latest, r) => (r.updatedAt > latest ? r.updatedAt : latest),
              savedResponses[0].updatedAt
            )
          : undefined;

      // Log audit event
      auditService.log({
        eventType: 'APP_APPLICATION_FORM_LOADED',
        actorId: candidateId,
        actorType: 'candidate',
        channel,
        ipAddress,
        metadata: {
          applicationId,
          formDefinitionId: formDefinition.id,
          savedResponseCount: savedResponses.length,
        },
        success: true,
      });

      return {
        success: true,
        data: {
          application,
          formDefinition,
          savedResponses,
          lastSavedAt,
        },
      };
    } catch (error) {
      console.error('[AppApplicationIntakeService] Error loading form:', error);
      return {
        success: false,
        error: 'Failed to load application form',
        errorCode: 'LOAD_FAILED',
      };
    }
  }

  /**
   * Save draft responses
   * Task 1.4: Implement draft save and resume persistence
   */
  async saveDraft(
    applicationId: string,
    candidateId: string,
    responses: { fieldId: string; value: unknown }[],
    channel: 'web' | 'mobile' | 'api' = 'mobile',
    ipAddress?: string
  ): Promise<SaveDraftResult> {
    try {
      // Verify application ownership
      const application = await appApplicationIntakeRepository.findApplicationById(
        applicationId,
        candidateId
      );

      if (!application) {
        return {
          success: false,
          error: 'Application not found',
          errorCode: 'NOT_FOUND',
        };
      }

      // Check if application is still editable
      if (['submitted', 'approved', 'rejected'].includes(application.status)) {
        return {
          success: false,
          error: 'Application is no longer editable',
          errorCode: 'NOT_EDITABLE',
        };
      }

      // Save draft
      const { savedAt } = await appApplicationIntakeRepository.saveDraftResponses(
        applicationId,
        candidateId,
        responses
      );

      // Calculate completion percentage
      const completionPercentage =
        await appApplicationIntakeRepository.calculateCompletionPercentage(
          applicationId,
          candidateId,
          application.formDefinitionId
        );

      // Log audit event
      auditService.log({
        eventType: 'APP_APPLICATION_DRAFT_SAVED',
        actorId: candidateId,
        actorType: 'candidate',
        channel,
        ipAddress,
        metadata: {
          applicationId,
          responseCount: responses.length,
          completionPercentage,
        },
        success: true,
      });

      return {
        success: true,
        data: {
          success: true,
          savedAt,
          completionPercentage,
        },
      };
    } catch (error) {
      console.error('[AppApplicationIntakeService] Error saving draft:', error);
      return {
        success: false,
        error: 'Failed to save draft',
        errorCode: 'SAVE_FAILED',
      };
    }
  }

  /**
   * Validate submission before final submit
   * Task 1.5: Implement final submission validation and status updates
   */
  async validateSubmission(
    applicationId: string,
    candidateId: string,
    responses: { fieldId: string; value: unknown }[]
  ): Promise<SubmissionValidationResult> {
    const application = await appApplicationIntakeRepository.findApplicationById(
      applicationId,
      candidateId
    );

    if (!application) {
      return { valid: false, errors: [{ fieldId: '', fieldName: '', message: 'Application not found' }] };
    }

    const requiredFields = await appApplicationIntakeRepository.getRequiredFields(
      application.formDefinitionId
    );

    const responseMap = new Map(responses.map((r) => [r.fieldId, r.value]));
    const errors: FieldValidationError[] = [];

    for (const field of requiredFields) {
      const value = responseMap.get(field.id);
      if (value === null || value === undefined || value === '') {
        errors.push({
          fieldId: field.id,
          fieldName: field.name,
          message: `${field.name} is required`,
        });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Submit final application
   * Task 1.5, 1.6: Final submission validation and audit logging
   */
  async submitApplication(
    applicationId: string,
    candidateId: string,
    responses: { fieldId: string; value: unknown }[],
    channel: 'web' | 'mobile' | 'api' = 'mobile',
    ipAddress?: string,
    userAgent?: string
  ): Promise<SubmitResult> {
    try {
      // Verify application ownership
      const application = await appApplicationIntakeRepository.findApplicationById(
        applicationId,
        candidateId
      );

      if (!application) {
        return {
          success: false,
          error: 'Application not found',
          errorCode: 'NOT_FOUND',
        };
      }

      // Check if application is still editable
      if (['submitted', 'approved', 'rejected'].includes(application.status)) {
        return {
          success: false,
          error: 'Application has already been submitted',
          errorCode: 'ALREADY_SUBMITTED',
        };
      }

      // Validate submission
      const validation = await this.validateSubmission(applicationId, candidateId, responses);

      if (!validation.valid) {
        // Log failed submission
        auditService.log({
          eventType: 'APP_APPLICATION_SUBMISSION_FAILED',
          actorId: candidateId,
          actorType: 'candidate',
          channel,
          ipAddress,
          userAgent,
          metadata: {
            applicationId,
            validationErrors: validation.errors,
          },
          success: false,
          errorMessage: 'Validation failed',
        });

        return {
          success: false,
          validationErrors: validation.errors,
          error: 'Validation failed',
          errorCode: 'VALIDATION_FAILED',
        };
      }

      // Submit application
      const { submittedAt, confirmationNumber } =
        await appApplicationIntakeRepository.submitFinalResponses(
          applicationId,
          candidateId,
          responses
        );

      // Log successful submission
      auditService.log({
        eventType: 'APP_APPLICATION_SUBMITTED',
        actorId: candidateId,
        actorType: 'candidate',
        targetId: applicationId,
        targetType: 'application',
        channel,
        ipAddress,
        userAgent,
        metadata: {
          applicationId,
          confirmationNumber,
          tenantId: application.tenantId,
        },
        success: true,
      });

      return {
        success: true,
        data: {
          success: true,
          submittedAt,
          applicationId,
          confirmationNumber,
        },
      };
    } catch (error) {
      console.error('[AppApplicationIntakeService] Error submitting application:', error);

      // Log error
      auditService.log({
        eventType: 'APP_APPLICATION_SUBMISSION_FAILED',
        actorId: candidateId,
        actorType: 'candidate',
        channel,
        ipAddress,
        userAgent,
        metadata: {
          applicationId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to submit application',
        errorCode: 'SUBMIT_FAILED',
      };
    }
  }
}

export const appApplicationIntakeService = new AppApplicationIntakeService();
