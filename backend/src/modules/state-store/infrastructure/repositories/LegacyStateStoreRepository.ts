import type { IStateStoreRepository } from '../../domain/ports/IStateStoreRepository.js';
import { stateStoreRepository as legacyRepo } from '../../../../repositories/state-store.repository.js';

export class LegacyStateStoreRepository implements IStateStoreRepository {
  async findByKey(tenantId: string, userId: string, userType: string, key: string): Promise<{ value: string } | null> {
    return legacyRepo.findByKey(tenantId, userId, userType, key);
  }
  async upsert(entry: { tenantId: string; userId: string; userType: string; key: string; value: string; expiresAt?: Date }): Promise<void> {
    return legacyRepo.upsert(entry);
  }
  async deleteAllByUser(tenantId: string, userId: string, userType: string): Promise<number> {
    return legacyRepo.deleteAllByUser(tenantId, userId, userType);
  }
  async cleanupExpired(): Promise<number> {
    return legacyRepo.cleanupExpired();
  }
}
