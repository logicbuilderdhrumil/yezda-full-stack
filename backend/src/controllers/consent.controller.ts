/**
 * Consent controller for data reuse consent endpoints.
 * Integration alignment: app/backend consent flows.
 */

import type { Request, Response } from 'express';
import {
  getConsentPrompt,
  submitConsent,
  getConsentStatus,
  getConsentById,
  updateConsent,
  validateConsentScopes,
} from '../services/consent.service.js';
import { getApplicationInternal } from '../services/application.service.js';
import type {
  ConsentSubmitDTO,
  ConsentUpdateDTO,
  ApiErrorResponse,
  ConsentErrorCodes,
} from '../../shared/@types/consent.types.js';

/**
 * Get consent prompt for an application.
 * GET /api/v1/consent/prompt/:applicationId
 */
export async function getPrompt(req: Request, res: Response): Promise<void> {
  try {
    const { applicationId } = req.params;
    const candidateId = (req as any).user?.id || 'candidate-001';

    const prompt = await getConsentPrompt(applicationId, candidateId);

    if (!prompt) {
      const error: ApiErrorResponse = {
        code: 'CONSENT_NOT_FOUND',
        message: 'No reusable data available for this application',
      };
      res.status(404).json(error);
      return;
    }

    res.json(prompt);
  } catch (error) {
    console.error('Error getting consent prompt:', error);
    const errorResponse: ApiErrorResponse = {
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve consent prompt',
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * Submit consent decision.
 * POST /api/v1/consent
 */
export async function submit(req: Request, res: Response): Promise<void> {
  try {
    const candidateId = (req as any).user?.id || 'candidate-001';
    const data: ConsentSubmitDTO = req.body;

    // Validate request
    if (!data.applicationId || !data.sourceApplicationId) {
      const error: ApiErrorResponse = {
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields',
        details: [
          ...(data.applicationId ? [] : [{ field: 'applicationId', message: 'Application ID is required', code: 'REQUIRED' }]),
          ...(data.sourceApplicationId ? [] : [{ field: 'sourceApplicationId', message: 'Source application ID is required', code: 'REQUIRED' }]),
        ],
      };
      res.status(400).json(error);
      return;
    }

    // Validate scopes if accepting
    if (data.accepted) {
      const prompt = await getConsentPrompt(data.applicationId, candidateId);
      if (!prompt) {
        const error: ApiErrorResponse = {
          code: 'SOURCE_APPLICATION_NOT_FOUND',
          message: 'Source application not found',
        };
        res.status(404).json(error);
        return;
      }

      const scopeValidation = validateConsentScopes(
        data.acceptedScopes || [],
        prompt.availableScopes
      );

      if (!scopeValidation.valid) {
        const error: ApiErrorResponse = {
          code: 'INVALID_CONSENT_SCOPE',
          message: 'One or more requested scopes are not available',
          details: scopeValidation.invalidScopes.map((scope) => ({
            field: 'acceptedScopes',
            message: `Scope '${scope}' is not available`,
            code: 'INVALID_SCOPE',
          })),
        };
        res.status(400).json(error);
        return;
      }
    }

    const result = await submitConsent(candidateId, data);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error submitting consent:', error);
    const errorResponse: ApiErrorResponse = {
      code: 'INTERNAL_ERROR',
      message: 'Failed to submit consent',
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * Get all consents for current user.
 * GET /api/v1/consent
 */
export async function getStatus(req: Request, res: Response): Promise<void> {
  try {
    const candidateId = (req as any).user?.id || 'candidate-001';
    const result = await getConsentStatus(candidateId);
    res.json(result);
  } catch (error) {
    console.error('Error getting consent status:', error);
    const errorResponse: ApiErrorResponse = {
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve consent status',
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * Get a single consent by ID.
 * GET /api/v1/consent/:consentId
 */
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const { consentId } = req.params;
    const candidateId = (req as any).user?.id || 'candidate-001';

    const consent = await getConsentById(consentId, candidateId);

    if (!consent) {
      const error: ApiErrorResponse = {
        code: 'CONSENT_NOT_FOUND',
        message: 'Consent not found',
      };
      res.status(404).json(error);
      return;
    }

    res.json(consent);
  } catch (error) {
    console.error('Error getting consent:', error);
    const errorResponse: ApiErrorResponse = {
      code: 'INTERNAL_ERROR',
      message: 'Failed to retrieve consent',
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * Update consent (modify scopes or withdraw).
 * PATCH /api/v1/consent/:consentId
 */
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { consentId } = req.params;
    const candidateId = (req as any).user?.id || 'candidate-001';
    const data: ConsentUpdateDTO = req.body;

    const consent = await updateConsent(consentId, candidateId, data);

    if (!consent) {
      const error: ApiErrorResponse = {
        code: 'CONSENT_NOT_FOUND',
        message: 'Consent not found',
      };
      res.status(404).json(error);
      return;
    }

    res.json(consent);
  } catch (error) {
    console.error('Error updating consent:', error);
    const errorResponse: ApiErrorResponse = {
      code: 'INTERNAL_ERROR',
      message: 'Failed to update consent',
    };
    res.status(500).json(errorResponse);
  }
}
