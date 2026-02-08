/**
 * App Profile Routes
 * Candidate profile retrieval and update endpoints (mobile app)
 */

import { Router } from 'express';
import * as appProfileController from '../controllers/app-profile.controller.js';
import { requireAuth, requireUserType } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { z } from 'zod';

const router = Router();

// Validation schema for address
const addressSchema = z.object({
  street: z.string().max(255).optional(),
  city: z.string().max(255).optional(),
  state: z.string().max(255).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().max(255).optional(),
}).optional();

// Validation schema for profile updates
const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  phone: z.string().max(50).optional(),
  address: addressSchema,
}).refine(
  (data) => data.firstName !== undefined || data.lastName !== undefined || data.phone !== undefined || data.address !== undefined,
  { message: 'At least one field must be provided' }
);

// All routes require authenticated candidate
router.use(requireAuth, requireUserType('candidate'));

/**
 * GET /api/v1/app/profile
 * Retrieve current candidate's profile
 */
router.get('/', appProfileController.getProfile);

/**
 * PUT /api/v1/app/profile
 * Update current candidate's profile
 */
router.put('/', validateBody(updateProfileSchema), appProfileController.updateProfile);

export default router;
