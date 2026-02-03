/**
 * Mock API Routes
 * Provides mock endpoints for development and testing.
 * All routes are protected by requireMockMode middleware.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  requireMockMode,
  logMockFixtureAccess,
  logMockEndpointCall,
  addMockModeHeader,
} from '../middleware/mock-mode.middleware.js';
import { mockApiService } from '../services/mock-api.service.js';
import type { AuthenticatedRoleRequest } from '../middleware/route-guards.middleware.js';

const router = Router();

// Apply mock mode checks and headers to all routes
router.use(requireMockMode);
router.use(addMockModeHeader);
router.use(logMockEndpointCall);

/**
 * GET /mock/status
 * Get current mock mode status and available fixtures
 */
router.get('/status', (_req: Request, res: Response) => {
  const status = mockApiService.getStatus();
  const fixtures = mockApiService.getFixtureManifest();

  res.json({
    mockMode: status,
    fixtures,
    warning: 'Mock mode is enabled. All responses contain simulated data.',
  });
});

/**
 * GET /mock/fixtures
 * Get manifest of all available fixtures
 */
router.get('/fixtures', logMockFixtureAccess('manifest'), (_req: Request, res: Response) => {
  res.json({
    fixtures: mockApiService.getFixtureManifest(),
  });
});

// ============ Auth Mock Endpoints ============

/**
 * GET /mock/auth/users
 * Get all mock users (without sensitive data)
 */
router.get('/auth/users', logMockFixtureAccess('auth'), (_req: Request, res: Response) => {
  res.json({
    users: mockApiService.getAllUsers(),
    _mock: true,
  });
});

/**
 * POST /mock/auth/login
 * Simulate login with mock user
 */
router.post('/auth/login', logMockFixtureAccess('auth'), (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({
      error: 'Email is required',
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  const user = mockApiService.findUserByEmail(email);
  if (!user) {
    res.status(401).json({
      error: 'Invalid credentials (mock)',
      code: 'INVALID_CREDENTIALS',
      hint: 'Use one of the mock emails: admin@mock.yezda.dev, agent@mock.yezda.dev, candidate@mock.yezda.dev',
    });
    return;
  }

  const authResponse = mockApiService.getMockAuthResponse(user.id);
  res.json({
    ...authResponse,
    _mock: true,
  });
});

// ============ Profile Mock Endpoints ============

/**
 * GET /mock/profiles/:userId
 * Get mock user profile
 */
router.get('/profiles/:userId', logMockFixtureAccess('users'), (req: Request, res: Response) => {
  const { userId } = req.params;
  const profile = mockApiService.getUserProfile(userId);

  if (!profile) {
    res.status(404).json({
      error: 'Profile not found (mock)',
      code: 'NOT_FOUND',
    });
    return;
  }

  res.json({
    profile,
    _mock: true,
  });
});

/**
 * GET /mock/tenants/:tenantId/users
 * Get mock users for a tenant
 */
router.get('/tenants/:tenantId/users', logMockFixtureAccess('users'), (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const users = mockApiService.getUsersByTenant(tenantId);

  res.json({
    users,
    count: users.length,
    _mock: true,
  });
});

// ============ Notification Mock Endpoints ============

/**
 * GET /mock/notifications
 * Get mock notifications for current user
 */
router.get(
  '/notifications',
  logMockFixtureAccess('notifications'),
  (req: AuthenticatedRoleRequest, res: Response) => {
    // Use mock user if not authenticated
    const userId = req.user?.sub || 'mock-user-admin-001';
    const userType = req.user?.type || 'user';

    const notifications = mockApiService.getNotificationsForUser(userId, userType);
    const unreadCount = mockApiService.getUnreadCount(userId, userType);

    res.json({
      notifications,
      unreadCount,
      total: notifications.length,
      _mock: true,
    });
  }
);

/**
 * GET /mock/notifications/:id
 * Get mock notification by ID
 */
router.get('/notifications/:id', logMockFixtureAccess('notifications'), (req: Request, res: Response) => {
  const { id } = req.params;
  const notification = mockApiService.getNotificationById(id);

  if (!notification) {
    res.status(404).json({
      error: 'Notification not found (mock)',
      code: 'NOT_FOUND',
    });
    return;
  }

  res.json({
    notification,
    _mock: true,
  });
});

// ============ State Store Mock Endpoints ============

/**
 * GET /mock/state
 * Get mock state entries for current user
 */
router.get(
  '/state',
  logMockFixtureAccess('stateStore'),
  (req: AuthenticatedRoleRequest, res: Response) => {
    const userId = req.user?.sub || 'mock-user-admin-001';
    const userType = req.user?.type || 'user';
    const tenantId = 'mock-tenant-001';

    const entries = mockApiService.getStateEntriesForUser(userId, userType, tenantId);

    res.json({
      entries,
      count: entries.length,
      _mock: true,
    });
  }
);

/**
 * GET /mock/state/:key
 * Get mock state entry by key
 */
router.get(
  '/state/:key',
  logMockFixtureAccess('stateStore'),
  (req: AuthenticatedRoleRequest, res: Response) => {
    const { key } = req.params;
    const userId = req.user?.sub || 'mock-user-admin-001';
    const userType = req.user?.type || 'user';
    const tenantId = 'mock-tenant-001';

    const entry = mockApiService.getStateEntryByKey(userId, userType, tenantId, key);

    if (!entry) {
      res.status(404).json({
        error: 'State entry not found (mock)',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({
      entry,
      _mock: true,
    });
  }
);

// ============ Shell Mock Endpoints ============

/**
 * GET /mock/shell/config
 * Get mock shell config
 */
router.get('/shell/config', logMockFixtureAccess('shell'), (_req: Request, res: Response) => {
  const tenantId = 'mock-tenant-001';
  const config = mockApiService.getShellConfig(tenantId);

  if (!config) {
    res.status(404).json({
      error: 'Shell config not found (mock)',
      code: 'NOT_FOUND',
    });
    return;
  }

  res.json({
    config,
    _mock: true,
  });
});

/**
 * GET /mock/shell/navigation
 * Get mock navigation for user roles
 */
router.get(
  '/shell/navigation',
  logMockFixtureAccess('shell'),
  (req: AuthenticatedRoleRequest, res: Response) => {
    const tenantId = 'mock-tenant-001';
    const roles = (req.user?.roles as string[]) || ['admin'];

    const navigation = mockApiService.getNavigationForRoles(tenantId, roles);

    res.json({
      navigation,
      roles,
      _mock: true,
    });
  }
);

export default router;
