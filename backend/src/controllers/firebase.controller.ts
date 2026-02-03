/**
 * Firebase Controller
 * Task 1.2: Device token registration endpoints
 * Task 1.3: Notification dispatch endpoints
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { firebaseDeviceTokenService } from '../services/firebase-device-token.service.js';

/**
 * Get client info from request
 */
function getClientInfo(req: AuthenticatedRequest) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api',
  };
}

/**
 * POST /api/v1/firebase/tokens
 * Register a device token for push notifications
 */
export async function registerDeviceToken(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { token, platform, deviceId, deviceName, appVersion } = req.body;
  const { ipAddress, userAgent, channel } = getClientInfo(req);

  // Get tenant ID from header or default
  const tenantId = req.get('x-tenant-id') || 'default';

  const result = await firebaseDeviceTokenService.registerToken(
    {
      userId: req.user.sub,
      userType: req.user.type,
      tenantId,
      token,
      platform,
      deviceId,
      deviceName,
      appVersion,
    },
    { channel, ipAddress, userAgent }
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'CROSS_TENANT_REGISTRATION' ? 403 : 400;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(201).json({
    message: 'Device token registered successfully',
    tokenId: result.tokenId,
  });
}

/**
 * DELETE /api/v1/firebase/tokens
 * Unregister a device token
 */
export async function unregisterDeviceToken(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { token } = req.body;
  const { ipAddress, channel } = getClientInfo(req);
  const tenantId = req.get('x-tenant-id') || 'default';

  const result = await firebaseDeviceTokenService.unregisterToken(
    token,
    {
      userId: req.user.sub,
      userType: req.user.type,
      tenantId,
    },
    { channel, ipAddress }
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'CROSS_TENANT_UNREGISTRATION' ? 403 : 
                       result.errorCode === 'TOKEN_NOT_FOUND' ? 404 : 400;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json({ message: 'Device token unregistered successfully' });
}

/**
 * DELETE /api/v1/firebase/tokens/all
 * Unregister all device tokens for the current user
 */
export async function unregisterAllDeviceTokens(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { ipAddress, channel } = getClientInfo(req);
  const tenantId = req.get('x-tenant-id') || 'default';

  const result = await firebaseDeviceTokenService.unregisterAllForUser(
    {
      userId: req.user.sub,
      userType: req.user.type,
      tenantId,
    },
    { channel, ipAddress }
  );

  res.status(200).json({
    message: 'All device tokens unregistered successfully',
    count: result.count,
  });
}

/**
 * GET /api/v1/firebase/tokens
 * Get all active device tokens for the current user
 */
export async function getActiveDeviceTokens(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = req.get('x-tenant-id') || 'default';

  const tokens = await firebaseDeviceTokenService.getActiveTokens(
    req.user.sub,
    req.user.type,
    tenantId
  );

  // Return sanitized token info (don't expose full token)
  const sanitizedTokens = tokens.map((t) => ({
    id: t.id,
    platform: t.platform,
    deviceId: t.deviceId,
    deviceName: t.deviceName,
    appVersion: t.appVersion,
    createdAt: t.createdAt,
    lastUsedAt: t.lastUsedAt,
  }));

  res.status(200).json({ tokens: sanitizedTokens });
}

/**
 * POST /api/v1/firebase/notifications/dispatch
 * Dispatch a notification to a user's devices (internal/admin use)
 */
export async function dispatchNotification(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { recipientId, recipientType, title, body, data, imageUrl, type } = req.body;
  const { ipAddress, channel } = getClientInfo(req);
  const tenantId = req.get('x-tenant-id') || 'default';

  const result = await firebaseDeviceTokenService.dispatchToUser(
    {
      type: type || 'general',
      recipientId,
      recipientType,
      tenantId,
      payload: {
        title,
        body,
        data,
        imageUrl,
      },
    },
    {
      actorId: req.user.sub,
      actorType: req.user.type,
      channel,
      ipAddress,
    }
  );

  res.status(200).json({
    successCount: result.successCount,
    failureCount: result.failureCount,
  });
}
