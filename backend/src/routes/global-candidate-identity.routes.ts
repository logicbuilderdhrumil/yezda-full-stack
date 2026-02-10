/**
 * Global Candidate Identity Routes
 * API endpoints for global candidate identity and cross-org consent.
 */

import { Router } from 'express';
import * as ctrl from '../controllers/global-candidate-identity.controller.js';
import { requireAuthGuard, requireRoleGuard } from '../middleware/route-guards.middleware.js';

const router = Router();

// All routes require authentication
const authGuard = [requireAuthGuard];
const adminOnly = [requireAuthGuard, requireRoleGuard('platform_admin')];
const adminOrManager = [requireAuthGuard, requireRoleGuard('platform_admin', 'platform_manager')];

// ── Lookup (admin only) ──────────────────────────────────────────────────────
// GET /api/v1/global-candidates/lookup?email=
router.get('/lookup', ...adminOnly, ctrl.lookupByEmail);

// ── Consent action routes (must be before /:id to avoid param collision) ─────
// PATCH /api/v1/global-candidates/consent/:id/grant
router.patch('/consent/:id/grant', ...authGuard, ctrl.grantConsent);

// PATCH /api/v1/global-candidates/consent/:id/deny
router.patch('/consent/:id/deny', ...authGuard, ctrl.denyConsent);

// PATCH /api/v1/global-candidates/consent/:id/revoke
router.patch('/consent/:id/revoke', ...authGuard, ctrl.revokeConsent);

// ── Global candidate CRUD ────────────────────────────────────────────────────
// GET /api/v1/global-candidates/:id
router.get('/:id', ...adminOrManager, ctrl.getGlobalIdentity);

// GET /api/v1/global-candidates/:id/orgs
router.get('/:id/orgs', ...adminOrManager, ctrl.getOrganizations);

// POST /api/v1/global-candidates/:id/consent  — request cross-org consent
router.post('/:id/consent', ...authGuard, ctrl.requestConsent);

// GET /api/v1/global-candidates/:id/data-reuse/:sourceOrgId
router.get('/:id/data-reuse/:sourceOrgId', ...adminOrManager, ctrl.checkDataReuse);

export default router;
