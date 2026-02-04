/**
 * App Auth Controller
 * Task 1.1: App authentication endpoint handlers for mobile flows
 */

import type { Request, Response } from 'express';
import { appAuthService } from '../services/app-auth.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

/**
 * Get client info from request
 */
function getClientInfo(req: Request) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
  };
}

/**
 * POST /api/v1/app/auth/signin
 * App sign-in for candidates
 */
export async function appSignIn(req: Request, res: Response): Promise<void> {
  const {
    email,
    password,
    deviceId,
    deviceName,
    platform,
    appVersion,
    osVersion,
    model,
    mfaCode,
  } = req.body;
  const { ipAddress } = getClientInfo(req);

  const result = await appAuthService.signIn(
    {
      email,
      password,
      deviceId,
      deviceName,
      platform,
      appVersion,
      osVersion,
      model,
      mfaCode,
    },
    ipAddress
  );

  if (!result.success && !result.requiresMfa) {
    res.status(401).json({ error: result.error, code: result.errorCode });
    return;
  }

  if (result.requiresMfa) {
    res.status(200).json({
      requiresMfa: true,
      mfaSessionToken: result.mfaSessionToken,
    });
    return;
  }

  res.status(200).json({
    accessToken: result.tokenPair!.accessToken,
    refreshToken: result.tokenPair!.refreshToken,
    expiresIn: result.tokenPair!.expiresIn,
    tokenType: result.tokenPair!.tokenType,
    sessionId: result.sessionId,
  });
}

/**
 * POST /api/v1/app/auth/mfa/verify
 * Complete MFA verification for app sign-in
 */
export async function appVerifyMfa(req: Request, res: Response): Promise<void> {
  const { mfaSessionToken, mfaCode } = req.body;
  const { ipAddress } = getClientInfo(req);

  const result = await appAuthService.completeMfaSignIn(
    mfaSessionToken,
    mfaCode,
    ipAddress
  );

  if (!result.success) {
    res.status(401).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json({
    accessToken: result.tokenPair!.accessToken,
    refreshToken: result.tokenPair!.refreshToken,
    expiresIn: result.tokenPair!.expiresIn,
    tokenType: result.tokenPair!.tokenType,
    sessionId: result.sessionId,
  });
}

/**
 * POST /api/v1/app/auth/refresh
 * Refresh app session tokens
 */
export async function appRefreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken, deviceId, appVersion } = req.body;
  const { ipAddress } = getClientInfo(req);

  const result = await appAuthService.refreshTokens(
    { refreshToken, deviceId, appVersion },
    ipAddress
  );

  if (!result.success) {
    res.status(401).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json({
    accessToken: result.tokenPair!.accessToken,
    refreshToken: result.tokenPair!.refreshToken,
    expiresIn: result.tokenPair!.expiresIn,
    tokenType: result.tokenPair!.tokenType,
    sessionId: result.sessionId,
  });
}

/**
 * POST /api/v1/app/auth/signout
 * Sign out from the current app session
 */
export async function appSignOut(req: AuthenticatedRequest, res: Response): Promise<void> {
  const revokeAll = req.query.all === 'true';

  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const result = await appAuthService.signOut(
    req.user.sub,
    req.user.jti,
    revokeAll
  );

  res.status(200).json({
    message: 'Signed out successfully',
    revokedSessions: result.revokedCount,
  });
}

/**
 * GET /api/v1/app/auth/sessions
 * Get all active sessions for the authenticated user
 */
export async function getAppSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const sessions = await appAuthService.getActiveSessions(req.user.sub, req.user.jti);

  res.status(200).json({ sessions });
}

/**
 * DELETE /api/v1/app/auth/sessions/:sessionId
 * Revoke a specific session
 */
export async function revokeAppSession(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { sessionId } = req.params;

  // Verify the session belongs to the user
  const sessions = await appAuthService.getActiveSessions(req.user.sub);
  const targetSession = sessions.find((s) => s.sessionId === sessionId);

  if (!targetSession) {
    res.status(404).json({ error: 'Session not found', code: 'SESSION_NOT_FOUND' });
    return;
  }

  await appAuthService.revokeSession(sessionId);

  res.status(200).json({ message: 'Session revoked successfully' });
}
