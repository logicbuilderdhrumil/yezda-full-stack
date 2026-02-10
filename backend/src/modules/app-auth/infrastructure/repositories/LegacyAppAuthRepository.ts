/**
 * Legacy App Auth Repository Adapter
 * Wraps the existing appAuthService for Clean Architecture compatibility
 */

import type { IAppAuthRepository } from '../../domain/ports/IAppAuthRepository.js';
import type { AppSignInCredentials, AppSignInResult, AppRefreshRequest, AppSession, SignOutResult } from '../../domain/entities/app-auth.entity.js';
import type { AppSignInRequest, AppRefreshRequest as ModelRefreshRequest } from '../../../../models/app-auth.model.js';
import { appAuthService } from '../../../../services/app-auth.service.js';

export class LegacyAppAuthRepository implements IAppAuthRepository {
  async signIn(credentials: AppSignInCredentials, ipAddress?: string): Promise<AppSignInResult> {
    return appAuthService.signIn(credentials as unknown as AppSignInRequest, ipAddress) as Promise<AppSignInResult>;
  }

  async completeMfaSignIn(mfaSessionToken: string, mfaCode: string, ipAddress?: string): Promise<AppSignInResult> {
    return appAuthService.completeMfaSignIn(mfaSessionToken, mfaCode, ipAddress) as Promise<AppSignInResult>;
  }

  async refreshTokens(request: AppRefreshRequest, ipAddress?: string): Promise<AppSignInResult> {
    return appAuthService.refreshTokens(request as unknown as ModelRefreshRequest, ipAddress) as Promise<AppSignInResult>;
  }

  async signOut(userId: string, sessionJti?: string, revokeAll?: boolean): Promise<SignOutResult> {
    return appAuthService.signOut(userId, sessionJti, revokeAll) as Promise<SignOutResult>;
  }

  async getActiveSessions(userId: string, currentJti?: string): Promise<AppSession[]> {
    return appAuthService.getActiveSessions(userId, currentJti) as Promise<AppSession[]>;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await appAuthService.revokeSession(sessionId);
  }
}
