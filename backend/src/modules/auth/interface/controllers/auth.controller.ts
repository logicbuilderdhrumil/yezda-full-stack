/**
 * Auth Controller (Clean Architecture)
 * HTTP request handlers delegating to use cases via constructor injection
 */
import type { Request, Response } from 'express';
import type { SignUpUseCase } from '../../application/use-cases/SignUpUseCase.js';
import type { SignInUseCase } from '../../application/use-cases/SignInUseCase.js';
import type { CompleteMfaSignInUseCase } from '../../application/use-cases/CompleteMfaSignInUseCase.js';
import type { RefreshTokenUseCase } from '../../application/use-cases/RefreshTokenUseCase.js';
import type { SignOutUseCase } from '../../application/use-cases/SignOutUseCase.js';
import type { RequestPasswordResetUseCase } from '../../application/use-cases/RequestPasswordResetUseCase.js';
import type { CompletePasswordResetUseCase } from '../../application/use-cases/CompletePasswordResetUseCase.js';
import type { StartMfaEnrollmentUseCase } from '../../application/use-cases/StartMfaEnrollmentUseCase.js';
import type { CompleteMfaEnrollmentUseCase } from '../../application/use-cases/CompleteMfaEnrollmentUseCase.js';
import type { DisableMfaUseCase } from '../../application/use-cases/DisableMfaUseCase.js';
import type { GetCurrentUserUseCase } from '../../application/use-cases/GetCurrentUserUseCase.js';
import type { AccessTokenPayload } from '../../domain/value-objects/AccessTokenPayload.js';

interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

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
 * External dependency for resolving user from managed_users.
 * Injected via constructor to avoid coupling.
 */
export interface IUserManagementQueryService {
  findByIdWithoutTenantScope(id: string): Promise<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    roles: string[];
    mfaEnabled: boolean;
    tenantId?: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | undefined>;
}

export class AuthController {
  constructor(
    private readonly signUpUseCase: SignUpUseCase,
    private readonly signInUseCase: SignInUseCase,
    private readonly completeMfaSignInUseCase: CompleteMfaSignInUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly signOutUseCase: SignOutUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly completePasswordResetUseCase: CompletePasswordResetUseCase,
    private readonly startMfaEnrollmentUseCase: StartMfaEnrollmentUseCase,
    private readonly completeMfaEnrollmentUseCase: CompleteMfaEnrollmentUseCase,
    private readonly disableMfaUseCase: DisableMfaUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly userManagementQuery: IUserManagementQueryService,
  ) {}

  /**
   * POST /api/v1/auth/sign-up
   */
  async signUp(req: Request, res: Response): Promise<void> {
    const { email, password, userType } = req.body;

    const result = await this.signUpUseCase.execute({ email, password, userType });

    if (!result.success) {
      res.status(400).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(201).json({ message: 'Account created successfully' });
  }

  /**
   * POST /api/v1/auth/sign-in
   */
  async signIn(req: Request, res: Response): Promise<void> {
    const { email, password, userType, mfaCode } = req.body;
    const { ipAddress, userAgent, deviceInfo, channel } = getClientInfo(req);

    const result = await this.signInUseCase.execute({
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
   */
  async verifyMfa(req: Request, res: Response): Promise<void> {
    const { mfaSessionToken, mfaCode } = req.body;
    const { ipAddress, userAgent, deviceInfo, channel } = getClientInfo(req);

    const result = await this.completeMfaSignInUseCase.execute(
      mfaSessionToken,
      mfaCode,
      deviceInfo,
      ipAddress,
      userAgent,
      channel,
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
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    const { ipAddress, deviceInfo } = getClientInfo(req);

    const result = await this.refreshTokenUseCase.execute(refreshToken, deviceInfo, ipAddress);

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
   * POST /api/v1/auth/sign-out
   */
  async signOut(req: AuthenticatedRequest, res: Response): Promise<void> {
    const revokeAll = req.query.all === 'true';

    if (req.user) {
      await this.signOutUseCase.execute(req.user.sub, req.user.type, req.user.jti, revokeAll);
    }

    res.status(200).json({ message: 'Signed out successfully' });
  }

  /**
   * POST /api/v1/auth/password/reset-request
   */
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    const { email, userType } = req.body;
    const { ipAddress, userAgent, channel } = getClientInfo(req);

    // Always return success to prevent email enumeration
    await this.requestPasswordResetUseCase.execute(email, userType, channel, ipAddress, userAgent);

    res.status(200).json({
      message: 'If an account exists with this email, reset instructions have been sent',
    });
  }

  /**
   * POST /api/v1/auth/password/reset-complete
   */
  async completePasswordReset(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = req.body;
    const { ipAddress, userAgent, channel } = getClientInfo(req);

    const result = await this.completePasswordResetUseCase.execute(
      token,
      newPassword,
      channel,
      ipAddress,
      userAgent,
    );

    if (!result.success) {
      res.status(400).json({ error: result.error, code: 'RESET_FAILED' });
      return;
    }

    res.status(200).json({ message: 'Password reset successfully' });
  }

  /**
   * POST /api/v1/auth/mfa/enroll
   */
  async startMfaEnrollment(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const user = await this.getCurrentUserUseCase.execute(req.user.sub, req.user.type);
    if (!user) {
      res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
      return;
    }

    const enrollment = await this.startMfaEnrollmentUseCase.execute(
      req.user.sub,
      req.user.type,
      user.email,
    );

    res.status(200).json({
      enrollmentId: enrollment.enrollmentId,
      qrCodeUrl: enrollment.qrCodeUrl,
      secret: enrollment.secret,
    });
  }

  /**
   * POST /api/v1/auth/mfa/enroll/verify
   */
  async completeMfaEnrollment(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const { enrollmentId, code } = req.body;
    const { ipAddress, userAgent, channel } = getClientInfo(req);

    const result = await this.completeMfaEnrollmentUseCase.execute(
      req.user.sub,
      req.user.type,
      enrollmentId,
      code,
      channel,
      ipAddress,
      userAgent,
    );

    if (!result.success) {
      const status = result.errorCode === 'MFA_ENABLE_FAILED' ? 500 : 400;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(200).json({
      message: 'MFA enabled successfully',
      backupCodes: result.backupCodes,
    });
  }

  /**
   * DELETE /api/v1/auth/mfa
   */
  async disableMfa(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const { ipAddress, channel } = getClientInfo(req);

    const result = await this.disableMfaUseCase.execute(
      req.user.sub,
      req.user.type,
      channel,
      ipAddress,
    );

    if (!result.success) {
      res.status(500).json({ error: 'Failed to disable MFA', code: 'MFA_DISABLE_FAILED' });
      return;
    }

    res.status(200).json({ message: 'MFA disabled successfully' });
  }

  /**
   * GET /api/v1/auth/me
   */
  async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    // For users, fetch from managed_users to get full profile with roles
    if (req.user.type === 'user') {
      const managedUser = await this.userManagementQuery.findByIdWithoutTenantScope(req.user.sub);
      if (!managedUser) {
        res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
        return;
      }

      res.status(200).json({
        id: managedUser.id,
        email: managedUser.email,
        firstName: managedUser.firstName,
        lastName: managedUser.lastName,
        displayName: managedUser.displayName,
        role: managedUser.roles[0] ?? 'viewer',
        roles: managedUser.roles,
        userType: 'user',
        mfaEnabled: managedUser.mfaEnabled,
        tenantId: managedUser.tenantId,
        status: managedUser.status,
        createdAt: managedUser.createdAt.toISOString(),
        updatedAt: managedUser.updatedAt.toISOString(),
      });
      return;
    }

    // For candidates, use the basic auth user data
    const user = await this.getCurrentUserUseCase.execute(req.user.sub, req.user.type);
    if (!user) {
      res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
      return;
    }

    res.status(200).json({
      ...user,
      userType: req.user.type,
      role: 'candidate',
    });
  }
}
