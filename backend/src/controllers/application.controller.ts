/**
 * Application controller for screening application endpoints.
 * Integration alignment: app/backend application flows.
 */

import type { Request, Response } from 'express';
import {
  getApplications,
  getApplication,
  getApplicationDraft,
  saveApplicationDraft,
  submitApplication,
} from '../services/application.service.js';
import type {
  SaveDraftRequestDTO,
  SubmitApplicationRequestDTO,
  ApiErrorResponse,
  SubmissionValidationErrorDTO,
} from '../../shared/@types/application.types.js';

/**
 * Get all applications for current user.
 * GET /api/v1/applications
 */
export async function list(req: Request, res: Response): Promise<void> {
  try {
    const candidateId = (req as any).user?.id;
    if (!candidateId) {
      const error: ApiErrorResponse = {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      };
      res.status(401).json(error);
      return;
    }
    const result = await getApplications(candidateId);
    res.json(result);
  } catch (error) {
    console.error('Error getting applications:', error);
    const errorResponse: ApiErrorResponse = {
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve applications',
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * Get a single application by ID.
 * GET /api/v1/applications/:applicationId
 */
export async function get(req: Request, res: Response): Promise<void> {
  try {
    const { applicationId } = req.params;
    const candidateId = (req as any).user?.id;
    if (!candidateId) {
      const error: ApiErrorResponse = {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      };
      res.status(401).json(error);
      return;
    }

    const result = await getApplication(applicationId, candidateId);

    if (!result) {
      const error: ApiErrorResponse = {
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found',
      };
      res.status(404).json(error);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting application:', error);
    const errorResponse: ApiErrorResponse = {
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve application',
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * Get application draft.
 * GET /api/v1/applications/:applicationId/draft
 */
export async function getDraft(req: Request, res: Response): Promise<void> {
  try {
    const { applicationId } = req.params;
    const candidateId = (req as any).user?.id;
    if (!candidateId) {
      const error: ApiErrorResponse = {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      };
      res.status(401).json(error);
      return;
    }

    const result = await getApplicationDraft(applicationId, candidateId);
    res.json(result);
  } catch (error) {
    console.error('Error getting draft:', error);
    const errorResponse: ApiErrorResponse = {
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve draft',
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * Save application draft.
 * PUT /api/v1/applications/:applicationId/draft
 */
export async function saveDraft(req: Request, res: Response): Promise<void> {
  try {
    const { applicationId } = req.params;
    const candidateId = (req as any).user?.id;
    if (!candidateId) {
      const error: ApiErrorResponse = {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      };
      res.status(401).json(error);
      return;
    }
    const data: SaveDraftRequestDTO = req.body;

    if (!data.values || typeof data.values !== 'object') {
      const error: ApiErrorResponse = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: [
          { field: 'values', message: 'Values object is required', code: 'REQUIRED' },
        ],
      };
      res.status(400).json(error);
      return;
    }

    const result = await saveApplicationDraft(applicationId, candidateId, data);
    res.json(result);
  } catch (error: any) {
    console.error('Error saving draft:', error);

    if (error.message === 'APPLICATION_NOT_FOUND') {
      const errorResponse: ApiErrorResponse = {
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found',
      };
      res.status(404).json(errorResponse);
      return;
    }

    const errorResponse: ApiErrorResponse = {
      code: 'INTERNAL_ERROR',
      message: 'Failed to save draft',
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * Submit application.
 * POST /api/v1/applications/:applicationId/submit
 */
export async function submit(req: Request, res: Response): Promise<void> {
  try {
    const { applicationId } = req.params;
    const candidateId = (req as any).user?.id;
    if (!candidateId) {
      const error: ApiErrorResponse = {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      };
      res.status(401).json(error);
      return;
    }
    const data: SubmitApplicationRequestDTO = req.body;

    if (!data.values || typeof data.values !== 'object') {
      const error: ApiErrorResponse = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: [
          { field: 'values', message: 'Values object is required', code: 'REQUIRED' },
        ],
      };
      res.status(400).json(error);
      return;
    }

    const result = await submitApplication(applicationId, candidateId, data);

    if (result.errors) {
      const error: SubmissionValidationErrorDTO = {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: result.errors,
      };
      res.status(400).json(error);
      return;
    }

    res.status(200).json(result.response);
  } catch (error: any) {
    console.error('Error submitting application:', error);

    if (error.message === 'APPLICATION_NOT_FOUND') {
      const errorResponse: ApiErrorResponse = {
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found',
      };
      res.status(404).json(errorResponse);
      return;
    }

    if (error.message === 'APPLICATION_ALREADY_SUBMITTED') {
      const errorResponse: ApiErrorResponse = {
        code: 'APPLICATION_ALREADY_SUBMITTED',
        message: 'This application has already been submitted',
      };
      res.status(409).json(errorResponse);
      return;
    }

    const errorResponse: ApiErrorResponse = {
      code: 'INTERNAL_ERROR',
      message: 'Failed to submit application',
    };
    res.status(500).json(errorResponse);
  }
}
