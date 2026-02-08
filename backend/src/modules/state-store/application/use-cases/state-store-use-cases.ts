import type { UserPreferences, SessionState, PreferenceKey, StateOperationResult } from '../../domain/entities/state-store.entity.js';
import type { IStateStoreRepository } from '../../domain/ports/IStateStoreRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { ICryptoService } from '../../domain/ports/ICryptoService.js';

const STATE_KEYS = { PREFERENCES: 'preferences', SESSION_STATE: 'session_state' } as const;
const SESSION_STATE_TTL_MS = 24 * 60 * 60 * 1000;

interface RequestContext { ipAddress?: string; channel: 'web' | 'mobile' | 'api' }

export class GetPreferencesUseCase {
  constructor(private readonly repo: IStateStoreRepository, private readonly crypto: ICryptoService, private readonly audit: IAuditService) {}
  async execute(tenantId: string, userId: string, userType: 'user' | 'candidate', ctx: RequestContext): Promise<StateOperationResult> {
    try {
      const entry = await this.repo.findByKey(tenantId, userId, userType, STATE_KEYS.PREFERENCES);
      let prefs: UserPreferences = {};
      if (entry) { try { prefs = JSON.parse(this.crypto.decrypt(entry.value)) as UserPreferences; } catch { /* empty */ } }
      this.audit.log({ eventType: 'STATE_READ', actorId: userId, actorType: userType, channel: ctx.channel, ipAddress: ctx.ipAddress, metadata: { tenantId, stateKey: STATE_KEYS.PREFERENCES }, success: true });
      return { success: true, data: prefs };
    } catch { return { success: false, error: 'Failed to read preferences', errorCode: 'STATE_READ_ERROR' }; }
  }
}

export class UpdatePreferencesUseCase {
  constructor(private readonly repo: IStateStoreRepository, private readonly crypto: ICryptoService, private readonly audit: IAuditService) {}
  async execute(tenantId: string, userId: string, userType: 'user' | 'candidate', preferences: Partial<UserPreferences>, ctx: RequestContext): Promise<StateOperationResult> {
    try {
      const existing = await this.repo.findByKey(tenantId, userId, userType, STATE_KEYS.PREFERENCES);
      let existingPrefs: UserPreferences = {};
      if (existing) { try { existingPrefs = JSON.parse(this.crypto.decrypt(existing.value)) as UserPreferences; } catch { /* empty */ } }
      const merged = { ...existingPrefs, ...preferences };
      if (merged.theme && !['light', 'dark', 'system'].includes(merged.theme)) return { success: false, error: 'Invalid theme value', errorCode: 'INVALID_PREFERENCE' };
      if (merged.presence && !['online', 'away', 'busy', 'offline'].includes(merged.presence)) return { success: false, error: 'Invalid presence value', errorCode: 'INVALID_PREFERENCE' };
      await this.repo.upsert({ tenantId, userId, userType, key: STATE_KEYS.PREFERENCES, value: this.crypto.encrypt(JSON.stringify(merged)) });
      this.audit.log({ eventType: 'STATE_WRITE', actorId: userId, actorType: userType, channel: ctx.channel, ipAddress: ctx.ipAddress, metadata: { tenantId, stateKey: STATE_KEYS.PREFERENCES, updatedKeys: Object.keys(preferences) }, success: true });
      return { success: true, data: merged };
    } catch { return { success: false, error: 'Failed to update preferences', errorCode: 'STATE_WRITE_ERROR' }; }
  }
}

export class UpdateSinglePreferenceUseCase {
  constructor(private readonly updatePrefs: UpdatePreferencesUseCase) {}
  async execute(tenantId: string, userId: string, userType: 'user' | 'candidate', key: PreferenceKey, value: string, ctx: RequestContext): Promise<StateOperationResult> {
    return this.updatePrefs.execute(tenantId, userId, userType, { [key]: value }, ctx);
  }
}

export class GetSessionStateUseCase {
  constructor(private readonly repo: IStateStoreRepository, private readonly crypto: ICryptoService, private readonly audit: IAuditService) {}
  async execute(tenantId: string, userId: string, userType: 'user' | 'candidate', ctx: RequestContext): Promise<StateOperationResult> {
    try {
      const entry = await this.repo.findByKey(tenantId, userId, userType, STATE_KEYS.SESSION_STATE);
      let state: SessionState = {};
      if (entry) { try { state = JSON.parse(this.crypto.decrypt(entry.value)) as SessionState; } catch { /* empty */ } }
      this.audit.log({ eventType: 'STATE_READ', actorId: userId, actorType: userType, channel: ctx.channel, ipAddress: ctx.ipAddress, metadata: { tenantId, stateKey: STATE_KEYS.SESSION_STATE }, success: true });
      return { success: true, data: state };
    } catch { return { success: false, error: 'Failed to read session state', errorCode: 'STATE_READ_ERROR' }; }
  }
}

export class UpdateSessionStateUseCase {
  constructor(private readonly repo: IStateStoreRepository, private readonly crypto: ICryptoService, private readonly audit: IAuditService) {}
  async execute(tenantId: string, userId: string, userType: 'user' | 'candidate', sessionState: Partial<SessionState>, ctx: RequestContext): Promise<StateOperationResult> {
    try {
      const existing = await this.repo.findByKey(tenantId, userId, userType, STATE_KEYS.SESSION_STATE);
      let existingState: SessionState = {};
      if (existing) { try { existingState = JSON.parse(this.crypto.decrypt(existing.value)) as SessionState; } catch { /* empty */ } }
      const merged = { ...existingState, ...sessionState, lastActivity: new Date() };
      const expiresAt = new Date(Date.now() + SESSION_STATE_TTL_MS);
      await this.repo.upsert({ tenantId, userId, userType, key: STATE_KEYS.SESSION_STATE, value: this.crypto.encrypt(JSON.stringify(merged)), expiresAt });
      this.audit.log({ eventType: 'STATE_WRITE', actorId: userId, actorType: userType, channel: ctx.channel, ipAddress: ctx.ipAddress, metadata: { tenantId, stateKey: STATE_KEYS.SESSION_STATE, updatedKeys: Object.keys(sessionState) }, success: true });
      return { success: true, data: merged };
    } catch { return { success: false, error: 'Failed to update session state', errorCode: 'STATE_WRITE_ERROR' }; }
  }
}

export class GetUserStateUseCase {
  constructor(private readonly getPrefs: GetPreferencesUseCase, private readonly getSession: GetSessionStateUseCase) {}
  async execute(tenantId: string, userId: string, userType: 'user' | 'candidate', ctx: RequestContext): Promise<StateOperationResult> {
    const [prefsResult, sessionResult] = await Promise.all([this.getPrefs.execute(tenantId, userId, userType, ctx), this.getSession.execute(tenantId, userId, userType, ctx)]);
    if (!prefsResult.success || !sessionResult.success) return { success: false, error: 'Failed to retrieve user state', errorCode: 'STATE_READ_ERROR' };
    return { success: true, data: { preferences: prefsResult.data, sessionState: sessionResult.data } };
  }
}

export class ClearUserStateUseCase {
  constructor(private readonly repo: IStateStoreRepository, private readonly audit: IAuditService) {}
  async execute(tenantId: string, userId: string, userType: 'user' | 'candidate', ctx: RequestContext): Promise<StateOperationResult> {
    try {
      const deleted = await this.repo.deleteAllByUser(tenantId, userId, userType);
      this.audit.log({ eventType: 'STATE_DELETE', actorId: userId, actorType: userType, channel: ctx.channel, ipAddress: ctx.ipAddress, metadata: { tenantId, stateKey: 'all', deletedCount: deleted }, success: true });
      return { success: true, data: { deletedCount: deleted } };
    } catch { return { success: false, error: 'Failed to clear user state', errorCode: 'STATE_DELETE_ERROR' }; }
  }
}
