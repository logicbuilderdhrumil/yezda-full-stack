/**
 * Asset Management Domain Port — Cache Service Interface
 */
export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
}
