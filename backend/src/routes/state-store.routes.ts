/**
 * State Store Routes
 * Task 1.2: Define API routes for state store operations
 * Task 1.6: Apply rate limiting to state store endpoints
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  stateStoreReadRateLimiter,
  stateStoreWriteRateLimiter,
} from '../middleware/state-store-rate-limit.middleware.js';
import {
  getPreferences,
  updatePreferences,
  updatePreference,
  getSessionState,
  updateSessionState,
  getUserState,
  clearUserState,
} from '../controllers/state-store.controller.js';

const router = Router();

// All state routes require authentication
router.use(requireAuth);

// GET /api/v1/state - Get all user state
router.get('/', stateStoreReadRateLimiter, getUserState);

// DELETE /api/v1/state - Clear all user state
router.delete('/', stateStoreWriteRateLimiter, clearUserState);

// Preferences routes
// GET /api/v1/state/preferences - Get user preferences
router.get('/preferences', stateStoreReadRateLimiter, getPreferences);

// PUT /api/v1/state/preferences - Update user preferences
router.put('/preferences', stateStoreWriteRateLimiter, updatePreferences);

// PATCH /api/v1/state/preferences/:key - Update a single preference
router.patch('/preferences/:key', stateStoreWriteRateLimiter, updatePreference);

// Session state routes
// GET /api/v1/state/session - Get session state
router.get('/session', stateStoreReadRateLimiter, getSessionState);

// PUT /api/v1/state/session - Update session state
router.put('/session', stateStoreWriteRateLimiter, updateSessionState);

export default router;
