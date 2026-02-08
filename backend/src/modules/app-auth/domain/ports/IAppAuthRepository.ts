/**
 * App Auth Repository Port
 * Domain contract for app authentication operations
 */

import type { AppSignInCredentials, AppSignInResult, AppRefreshRequest, AppSession, SignOutResult } from '../entities/app-auth.entity.js';

export interface IAppAuthRepository {
  signIn(credentials: AppSignInCredentials, ipAddress?: string): Promise<AppSignInResult>;
  completeMfaSignIn(mfaSessionToken: string, mfaCode: string, ipAddress?: string): Promise<AppSignInResult>;
  refreshTokens(request: AppRefreshRequest, ipAddress?: string): Promise<AppSignInResult>;
  signOut(userId: string, sessionJti?: string, revokeAll?: boolean): Promise<SignOutResult>;
  getActiveSessions(userId: string, currentJti?: string): Promise<AppSession[]>;
  revokeSession(sessionId: string): Promise<void>;
}
