/**
 * MFA Session Adapter
 * Wraps Redis MFA session storage behind a clean interface
 */
import { storeMfaSession, consumeMfaSession, type MfaSession } from '../../../db/redis.js';

export interface IMfaSessionStore {
  store(token: string, session: MfaSession): Promise<void>;
  consume(token: string): Promise<MfaSession | null>;
}

export class RedisMfaSessionAdapter implements IMfaSessionStore {
  async store(token: string, session: MfaSession): Promise<void> {
    return storeMfaSession(token, session);
  }

  async consume(token: string): Promise<MfaSession | null> {
    return consumeMfaSession(token);
  }
}
