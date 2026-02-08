/**
 * App Auth Use Cases
 * Application-layer orchestration for mobile app authentication
 */

import type { IAppAuthRepository } from '../domain/ports/IAppAuthRepository.js';
import type { AppSignInCredentials, AppRefreshRequest } from '../domain/entities/app-auth.entity.js';

export class AppAuthUseCases {
  constructor(private readonly repo: IAppAuthRepository) {}

  async signIn(credentials: AppSignInCredentials, ipAddress?: string) {
    return this.repo.signIn(credentials, ipAddress);
  }

  async completeMfaSignIn(mfaSessionToken: string, mfaCode: string, ipAddress?: string) {
    return this.repo.completeMfaSignIn(mfaSessionToken, mfaCode, ipAddress);
  }

  async refreshTokens(request: AppRefreshRequest, ipAddress?: string) {
    return this.repo.refreshTokens(request, ipAddress);
  }

  async signOut(userId: string, sessionJti?: string, revokeAll?: boolean) {
    return this.repo.signOut(userId, sessionJti, revokeAll);
  }

  async getActiveSessions(userId: string, currentJti?: string) {
    return this.repo.getActiveSessions(userId, currentJti);
  }

  async revokeSession(sessionId: string) {
    return this.repo.revokeSession(sessionId);
  }
}
