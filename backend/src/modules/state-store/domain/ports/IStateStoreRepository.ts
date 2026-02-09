export interface IStateStoreRepository {
  findByKey(tenantId: string, userId: string, userType: string, key: string): Promise<{ value: string } | null>;
  upsert(entry: { tenantId: string; userId: string; userType: string; key: string; value: string; expiresAt?: Date }): Promise<void>;
  deleteAllByUser(tenantId: string, userId: string, userType: string): Promise<number>;
  cleanupExpired(): Promise<number>;
}
