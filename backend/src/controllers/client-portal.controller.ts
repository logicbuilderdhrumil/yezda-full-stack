/**
 * Client Portal Controller
 * HTTP handlers for client-portal endpoints.
 */

import type { Response } from 'express';
import type { TenantScopedRequest } from '../middleware/route-guards.middleware.js';
import * as clientPortalService from '../services/client-portal.service.js';

/**
 * GET /api/v1/client/dashboard
 * Returns org-scoped screening summary metrics.
 */
export async function getDashboard(req: TenantScopedRequest, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantScope!;
    const result = clientPortalService.getDashboardSummary(tenantId);

    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(200).json(result.data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}

/**
 * GET /api/v1/client/candidates
 * Returns paginated, filterable candidate list scoped to the tenant.
 */
export async function listCandidates(req: TenantScopedRequest, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantScope!;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;

    const result = clientPortalService.listCandidates(tenantId, { page, limit, search, status });

    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(200).json(result.data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}

/**
 * GET /api/v1/client/candidates/:id
 * Returns candidate detail with screening progress.
 */
export async function getCandidateDetail(req: TenantScopedRequest, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantScope!;
    const { id } = req.params;

    const result = clientPortalService.getCandidateDetail(tenantId, id);

    if (!result.success) {
      const statusCode = result.errorCode === 'NOT_FOUND' ? 404 : 500;
      res.status(statusCode).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(200).json(result.data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}

/**
 * GET /api/v1/client/org/settings
 * Returns org settings for the tenant.
 */
export async function getOrgSettings(req: TenantScopedRequest, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantScope!;
    const result = clientPortalService.getOrgSettingsForTenant(tenantId);

    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(200).json(result.data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}

/**
 * PUT /api/v1/client/org/settings
 * Updates org settings (client_admin only).
 */
export async function updateOrgSettings(req: TenantScopedRequest, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantScope!;
    const { orgName, contactEmail, contactPhone, address, notificationPrefs } = req.body;

    const result = clientPortalService.updateOrgSettings(tenantId, {
      orgName,
      contactEmail,
      contactPhone,
      address,
      notificationPrefs,
    });

    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(200).json(result.data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}

/**
 * GET /api/v1/client/screenings
 * Returns paginated, filterable screening requests scoped to the tenant.
 */
export async function listScreenings(req: TenantScopedRequest, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantScope!;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;
    const candidateId = req.query.candidateId as string | undefined;

    const result = clientPortalService.listScreenings(tenantId, { page, limit, status, type, candidateId });

    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(200).json(result.data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}

/**
 * GET /api/v1/client/reports
 * Returns screening analytics / report for the tenant.
 */
export async function getReport(req: TenantScopedRequest, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantScope!;
    const result = clientPortalService.getReport(tenantId);

    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(200).json(result.data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}
