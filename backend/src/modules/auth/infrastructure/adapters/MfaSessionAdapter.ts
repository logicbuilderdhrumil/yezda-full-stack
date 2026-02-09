/**
 * MFA Session Adapter
 * Wraps Redis MFA session storage behind a clean interface
 */
import { storeMfaSession, consumeMfaSession, type MfaSession } from '../../../../shared/infrastructure/database/redis.js';
import type { IMfaSessionStore, MfaSessionData } from '../../domain/ports/IMfaSessionStore.js';

export class RedisMfaSessionAdapter implements IMfaSessionStore {
  async store(token: string, session: MfaSessionData): Promise<void> {
    return storeMfaSession(token, session as MfaSession);
  }

  async consume(token: string): Promise<MfaSessionData | null> {
    return consumeMfaSession(token);
  }
}
