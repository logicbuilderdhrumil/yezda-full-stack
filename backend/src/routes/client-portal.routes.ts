/**
 * Client Portal Routes
 * API endpoints for the client-facing portal.
 * All routes are scoped to /api/v1/client.
 */

import { Router } from 'express';
import * as clientPortalController from '../controllers/client-portal.controller.js';
import {
  requireAuthGuard,
  requireClientGuard,
  requireClientAdminGuard,
  requireTenantScopeGuard,
} from '../middleware/route-guards.middleware.js';

const router = Router();

// ── Shared guard stacks ──────────────────────────────────────────

/** Read access: any client role + tenant scope */
const clientReadGuards = [
  requireAuthGuard,
  requireClientGuard,
  requireTenantScopeGuard,
];

/** Write access: client_admin only + tenant scope */
const clientAdminGuards = [
  requireAuthGuard,
  requireClientAdminGuard,
  requireTenantScopeGuard,
];

// ── Dashboard ────────────────────────────────────────────────────

/** GET /api/v1/client/dashboard */
router.get('/dashboard', ...clientReadGuards, clientPortalController.getDashboard);

// ── Candidates ───────────────────────────────────────────────────

/** GET /api/v1/client/candidates */
router.get('/candidates', ...clientReadGuards, clientPortalController.listCandidates);

/** GET /api/v1/client/candidates/:id */
router.get('/candidates/:id', ...clientReadGuards, clientPortalController.getCandidateDetail);

// ── Screenings ───────────────────────────────────────────────────

/** GET /api/v1/client/screenings */
router.get('/screenings', ...clientReadGuards, clientPortalController.listScreenings);

// ── Reports ──────────────────────────────────────────────────────

/** GET /api/v1/client/reports */
router.get('/reports', ...clientReadGuards, clientPortalController.getReport);

// ── Org settings ─────────────────────────────────────────────────

/** GET /api/v1/client/org/settings */
router.get('/org/settings', ...clientReadGuards, clientPortalController.getOrgSettings);

/** PUT /api/v1/client/org/settings (client_admin only) */
router.put('/org/settings', ...clientAdminGuards, clientPortalController.updateOrgSettings);

export default router;
