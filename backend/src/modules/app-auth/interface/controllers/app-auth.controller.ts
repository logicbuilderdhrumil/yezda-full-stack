/**
 * App Auth Controller (Clean Architecture)
 * Delegates to AppAuthUseCases for mobile app authentication
 */

import type { Request, Response } from 'express';
import type { AppAuthUseCases } from '../../application/use-cases/app-auth-use-cases.js';
import type { AuthenticatedRequest } from '../../../../middleware/auth.middleware.js';

function getClientIp(req: Request): string | undefined {
  return req.ip || req.socket.remoteAddress;
}

export class AppAuthController {
  constructor(private readonly useCases: AppAuthUseCases) {}

  appSignIn = async (req: Request, res: Response): Promise<void> => {
    const { email, password, deviceId, deviceName, platform, appVersion, osVersion, model, mfaCode } = req.body;
    const ipAddress = getClientIp(req);

    const result = await this.useCases.signIn(
      { email, password, deviceId, deviceName, platform, appVersion, osVersion, model, mfaCode },
      ipAddress
    );

    if (!result.success && !result.requiresMfa) {
      res.status(401).json({ error: result.error, code: result.errorCode });
      return;
    }

    if (result.requiresMfa) {
      res.status(200).json({ requiresMfa: true, mfaSessionToken: result.mfaSessionToken });
      return;
    }

    res.status(200).json({
      accessToken: result.tokenPair!.accessToken,
      refreshToken: result.tokenPair!.refreshToken,
      expiresIn: result.tokenPair!.expiresIn,
      tokenType: result.tokenPair!.tokenType,
      sessionId: result.sessionId,
    });
  };

  appVerifyMfa = async (req: Request, res: Response): Promise<void> => {
    const { mfaSessionToken, mfaCode } = req.body;
    const ipAddress = getClientIp(req);

    const result = await this.useCases.completeMfaSignIn(mfaSessionToken, mfaCode, ipAddress);

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
  };

  appRefreshToken = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken, deviceId, appVersion } = req.body;
    const ipAddress = getClientIp(req);

    const result = await this.useCases.refreshTokens({ refreshToken, deviceId, appVersion }, ipAddress);

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
  };

  appSignOut = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const revokeAll = req.query.all === 'true';

    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const result = await this.useCases.signOut(req.user.sub, req.user.jti, revokeAll);

    res.status(200).json({ message: 'Signed out successfully', revokedSessions: result.revokedCount });
  };

  getAppSessions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const sessions = await this.useCases.getActiveSessions(req.user.sub, req.user.jti);
    res.status(200).json({ sessions });
  };

  revokeAppSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const { sessionId } = req.params;
    const sessions = await this.useCases.getActiveSessions(req.user.sub);
    const targetSession = sessions.find((s) => s.sessionId === sessionId);

    if (!targetSession) {
      res.status(404).json({ error: 'Session not found', code: 'SESSION_NOT_FOUND' });
      return;
    }

    await this.useCases.revokeSession(sessionId);
    res.status(200).json({ message: 'Session revoked successfully' });
  };
}
