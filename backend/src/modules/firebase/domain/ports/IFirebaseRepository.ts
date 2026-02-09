import type { DeviceToken, NotificationDispatchRequest, NotificationDispatchResult } from '../entities/firebase.entity.js';
export interface IFirebaseRepository {
  registerToken(token: DeviceToken): Promise<void>;
  unregisterToken(userId: string, token: string): Promise<void>;
  getTokensByUser(userId: string): Promise<DeviceToken[]>;
  dispatchNotification(request: NotificationDispatchRequest): Promise<NotificationDispatchResult>;
}
