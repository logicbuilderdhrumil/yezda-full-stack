/**
 * Client Portal Routes
 * Wires HTTP endpoints to the client portal controller with guard middleware.
 */
import { Router } from 'express';
import type { ClientPortalController } from '../controllers/client-portal.controller.js';
import {
  requireAuthGuard,
  requireClientGuard,
  requireClientAdminGuard,
  requireTenantScopeGuard,
} from '../../../../middleware/route-guards.middleware.js';

export function createClientPortalRoutes(controller: ClientPortalController): Router {
  const router = Router();

  // Shared guard stacks
  const clientReadGuards = [requireAuthGuard, requireClientGuard, requireTenantScopeGuard];
  const clientAdminGuards = [requireAuthGuard, requireClientAdminGuard, requireTenantScopeGuard];

  // Dashboard
  router.get('/dashboard', ...clientReadGuards, controller.getDashboard);

  // Candidates
  router.get('/candidates', ...clientReadGuards, controller.listCandidates);
  router.get('/candidates/:id', ...clientReadGuards, controller.getCandidateDetail);

  // Screenings
  router.get('/screenings', ...clientReadGuards, controller.listScreenings);

  // Reports
  router.get('/reports', ...clientReadGuards, controller.getReport);

  // Org settings
  router.get('/org/settings', ...clientReadGuards, controller.getOrgSettings);
  router.put('/org/settings', ...clientAdminGuards, controller.updateOrgSettings);

  return router;
}
