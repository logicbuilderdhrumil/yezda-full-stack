/**
 * MFA Session Store port — domain interface for MFA session persistence
 */

export interface MfaSessionData {
  userId: string;
  userType: 'user' | 'candidate';
  expiresAt: number;
}

export interface IMfaSessionStore {
  store(token: string, session: MfaSessionData): Promise<void>;
  consume(token: string): Promise<MfaSessionData | null>;
}
