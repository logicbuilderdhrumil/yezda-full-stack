import type { DeviceToken, NotificationDispatchRequest, NotificationDispatchResult } from '../../domain/entities/firebase.entity.js';
import type { IFirebaseRepository } from '../../domain/ports/IFirebaseRepository.js';

export class RegisterTokenUseCase {
  constructor(private readonly repo: IFirebaseRepository) {}
  async execute(token: DeviceToken): Promise<void> { return this.repo.registerToken(token); }
}
export class UnregisterTokenUseCase {
  constructor(private readonly repo: IFirebaseRepository) {}
  async execute(userId: string, token: string): Promise<void> { return this.repo.unregisterToken(userId, token); }
}
export class GetUserTokensUseCase {
  constructor(private readonly repo: IFirebaseRepository) {}
  async execute(userId: string): Promise<DeviceToken[]> { return this.repo.getTokensByUser(userId); }
}
export class DispatchNotificationUseCase {
  constructor(private readonly repo: IFirebaseRepository) {}
  async execute(request: NotificationDispatchRequest): Promise<NotificationDispatchResult> { return this.repo.dispatchNotification(request); }
}
