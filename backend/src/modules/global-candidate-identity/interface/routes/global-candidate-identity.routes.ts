import { Router } from 'express';
import type { GlobalCandidateIdentityController } from '../controllers/global-candidate-identity.controller.js';
import { requireAuthGuard, requireRoleGuard } from '../../../../middleware/route-guards.middleware.js';

export function createGlobalCandidateIdentityRoutes(controller: GlobalCandidateIdentityController): Router {
  const router = Router();
  const authGuard = [requireAuthGuard];
  const adminOnly = [requireAuthGuard, requireRoleGuard('admin')];
  const adminOrManager = [requireAuthGuard, requireRoleGuard('admin', 'manager')];

  router.get('/lookup', ...adminOnly, controller.lookupByEmail);
  router.patch('/consent/:id/grant', ...authGuard, controller.grantConsent);
  router.patch('/consent/:id/deny', ...authGuard, controller.denyConsent);
  router.patch('/consent/:id/revoke', ...authGuard, controller.revokeConsent);
  router.get('/:id', ...adminOrManager, controller.getGlobalIdentity);
  router.get('/:id/orgs', ...adminOrManager, controller.getOrganizations);
  router.post('/:id/consent', ...authGuard, controller.requestConsent);
  router.get('/:id/data-reuse/:sourceOrgId', ...adminOrManager, controller.checkDataReuse);

  return router;
}
