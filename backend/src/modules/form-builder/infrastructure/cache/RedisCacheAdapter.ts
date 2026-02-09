/**
 * Redis Cache Adapter
 *
 * Implements ICacheService using the shared Redis infrastructure.
 */
import type { ICacheService } from '../../domain/ports/cache-service.port.js';
import { cacheGet, cacheSet, cacheDel } from '../../../../shared/infrastructure/database/index.js';

export class RedisCacheAdapter implements ICacheService {
  async get<T>(key: string): Promise<T | null> {
    return cacheGet<T>(key);
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    await cacheSet(key, value, ttlMs);
  }

  async del(key: string): Promise<void> {
    await cacheDel(key);
  }
}
