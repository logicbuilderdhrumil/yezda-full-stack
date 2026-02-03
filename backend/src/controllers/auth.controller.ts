/**
 * Auth Controller
 * Task 1.2, 1.3, 1.4: Authentication endpoint handlers
 */

import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { mfaService } from '../services/mfa.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

/**
 * Get client info from request
 */
function getClientInfo(req: Request) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    deviceInfo: req.get('x-device-info'),
    channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api',
  };
}

/**
 * POST /api/v1/auth/signup
 * Create a new user or candidate account
 */
export async function signUp(req: Request, res: Response): Promise<void> {
  const { email, password, userType } = req.body;

  const result = await authService.signUp({ email, password, userType });

  if (!result.success) {
    res.status(400).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(201).json({ message: 'Account created successfully' });
}

/**
 * POST /api/v1/auth/signin
 * Sign in with email and password
 */
export async function signIn(req: Request, res: Response): Promise<void> {
  const { email, password, userType, mfaCode } = req.body;
  const { ipAddress, userAgent, deviceInfo, channel } = getClientInfo(req);

  const result = await authService.signIn({
    email,
    password,
    userType,
    mfaCode,
    deviceInfo,
    ipAddress,
    userAgent,
    channel,
  });

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
  });
}

/**
 * POST /api/v1/auth/mfa/verify
 * Complete MFA verification for sign-in
 */
export async function verifyMfa(req: Request, res: Response): Promise<void> {
  const { mfaSessionToken, mfaCode } = req.body;
  const { ipAddress, userAgent, deviceInfo, channel } = getClientInfo(req);

  const result = await authService.completeMfaSignIn(
    mfaSessionToken,
    mfaCode,
    deviceInfo,
    ipAddress,
    userAgent,
    channel
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
  });
}

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
export function refreshToken(req: Request, res: Response): void {
  const { refreshToken } = req.body;
  const { ipAddress, deviceInfo } = getClientInfo(req);

  const result = authService.refreshTokens(refreshToken, deviceInfo, ipAddress);

  if (!result.success) {
    res.status(401).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json({
    accessToken: result.tokenPair!.accessToken,
    refreshToken: result.tokenPair!.refreshToken,
    expiresIn: result.tokenPair!.expiresIn,
    tokenType: result.tokenPair!.tokenType,
  });
}

/**
 * POST /api/v1/auth/signout
 * Sign out the current session
 */
export function signOut(req: AuthenticatedRequest, res: Response): void {
  const revokeAll = req.query.all === 'true';

  if (req.user) {
    authService.signOut(req.user.sub, req.user.type, req.user.jti, revokeAll);
  }

  res.status(200).json({ message: 'Signed out successfully' });
}

/**
 * POST /api/v1/auth/password/reset-request
 * Request a password reset
 */
export async function requestPasswordReset(req: Request, res: Response): Promise<void> {
  const { email, userType } = req.body;
  const { ipAddress, userAgent, channel } = getClientInfo(req);

  // Always return success to prevent email enumeration
  await authService.requestPasswordReset(email, userType, channel, ipAddress, userAgent);

  res.status(200).json({
    message: 'If an account exists with this email, reset instructions have been sent',
  });
}

/**
 * POST /api/v1/auth/password/reset-complete
 * Complete password reset with token
 */
export async function completePasswordReset(req: Request, res: Response): Promise<void> {
  const { token, newPassword } = req.body;
  const { ipAddress, userAgent, channel } = getClientInfo(req);

  const result = await authService.completePasswordReset(
    token,
    newPassword,
    channel,
    ipAddress,
    userAgent
  );

  if (!result.success) {
    res.status(400).json({ error: result.error, code: 'RESET_FAILED' });
    return;
  }

  res.status(200).json({ message: 'Password reset successfully' });
}

/**
 * POST /api/v1/auth/mfa/enroll
 * Start MFA enrollment
 */
export async function startMfaEnrollment(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const user = authService.getUser(req.user.sub, req.user.type);
  if (!user) {
    res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    return;
  }

  const enrollment = await mfaService.startEnrollment(
    req.user.sub,
    req.user.type,
    user.email
  );

  res.status(200).json({
    enrollmentId: enrollment.enrollmentId,
    qrCodeUrl: enrollment.qrCodeUrl,
    secret: enrollment.secret,
  });
}

/**
 * POST /api/v1/auth/mfa/enroll/verify
 * Complete MFA enrollment
 */
export async function completeMfaEnrollment(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { enrollmentId, code } = req.body;
  const { ipAddress, userAgent, channel } = getClientInfo(req);

  const verifyResult = mfaService.verifyEnrollment(enrollmentId, code);
  if (!verifyResult.success) {
    res.status(400).json({ error: 'Invalid verification code', code: 'INVALID_CODE' });
    return;
  }

  const enableResult = await authService.enableMfa(
    req.user.sub,
    req.user.type,
    verifyResult.secret!,
    channel,
    ipAddress,
    userAgent
  );

  if (!enableResult.success) {
    res.status(500).json({ error: 'Failed to enable MFA', code: 'MFA_ENABLE_FAILED' });
    return;
  }

  // Generate backup codes
  const backupCodes = mfaService.generateBackupCodes();

  res.status(200).json({
    message: 'MFA enabled successfully',
    backupCodes,
  });
}

/**
 * DELETE /api/v1/auth/mfa
 * Disable MFA for user
 */
export async function disableMfa(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { ipAddress, channel } = getClientInfo(req);

  const result = await authService.disableMfa(
    req.user.sub,
    req.user.type,
    channel,
    ipAddress
  );

  if (!result.success) {
    res.status(500).json({ error: 'Failed to disable MFA', code: 'MFA_DISABLE_FAILED' });
    return;
  }

  res.status(200).json({ message: 'MFA disabled successfully' });
}

/**
 * GET /api/v1/auth/me
 * Get current user info
 */
export function getCurrentUser(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const user = authService.getUser(req.user.sub, req.user.type);
  if (!user) {
    res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    return;
  }

  res.status(200).json(user);
}
