import type { IFirebaseRepository } from '../../domain/ports/IFirebaseRepository.js';
import type { DeviceToken, NotificationDispatchRequest, NotificationDispatchResult } from '../../domain/entities/firebase.entity.js';

const tokens = new Map<string, DeviceToken[]>();

export class InMemoryFirebaseRepository implements IFirebaseRepository {
  async registerToken(token: DeviceToken): Promise<void> { const list = tokens.get(token.userId) ?? []; list.push(token); tokens.set(token.userId, list); }
  async unregisterToken(userId: string, tokenStr: string): Promise<void> { const list = tokens.get(userId) ?? []; tokens.set(userId, list.filter((t) => t.token !== tokenStr)); }
  async getTokensByUser(userId: string): Promise<DeviceToken[]> { return tokens.get(userId) ?? []; }
  async dispatchNotification(_request: NotificationDispatchRequest): Promise<NotificationDispatchResult> { return { success: true, messageId: `mock-${Date.now()}` }; }
}
