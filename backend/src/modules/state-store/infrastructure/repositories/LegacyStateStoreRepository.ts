import type { IStateStoreRepository } from '../../domain/ports/IStateStoreRepository.js';
import { stateStoreRepository as legacyRepo } from '../../../../repositories/state-store.repository.js';

export class LegacyStateStoreRepository implements IStateStoreRepository {
  async findByKey(tenantId: string, userId: string, userType: string, key: string): Promise<{ value: string } | null> {
    const entry = await legacyRepo.findByKey(tenantId, userId, userType as 'user' | 'candidate', key);
    return entry ? { value: entry.value } : null;
  }
  async upsert(entry: { tenantId: string; userId: string; userType: string; key: string; value: string; expiresAt?: Date }): Promise<void> {
    await legacyRepo.upsert(entry as Parameters<typeof legacyRepo.upsert>[0]);
  }
  async deleteAllByUser(tenantId: string, userId: string, userType: string): Promise<number> {
    return legacyRepo.deleteAllByUser(tenantId, userId, userType as 'user' | 'candidate');
  }
  async cleanupExpired(): Promise<number> {
    return legacyRepo.cleanupExpired();
  }
}
