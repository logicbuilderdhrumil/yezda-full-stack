/**
 * App Profile Routes (Clean Architecture)
 */

import { Router } from 'express';
import type { AppProfileController } from '../controllers/app-profile.controller.js';
import { requireAuth, requireUserType } from '../../../../middleware/auth.middleware.js';
import { validateBody } from '../../../../middleware/validation.middleware.js';
import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().max(255).optional(),
  city: z.string().max(255).optional(),
  state: z.string().max(255).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().max(255).optional(),
}).optional();

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  phone: z.string().max(50).optional(),
  address: addressSchema,
}).refine(
  (data) => data.firstName !== undefined || data.lastName !== undefined || data.phone !== undefined || data.address !== undefined,
  { message: 'At least one field must be provided' }
);

export function createAppProfileRoutes(controller: AppProfileController): Router {
  const router = Router();

  router.use(requireAuth, requireUserType('candidate'));

  router.get('/', controller.getProfile);
  router.put('/', validateBody(updateProfileSchema), controller.updateProfile);

  return router;
}
