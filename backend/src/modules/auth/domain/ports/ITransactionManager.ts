/**
 * Transaction Manager port — domain interface for atomic database operations.
 * Thin contract so the domain/application layers never depend on pg.
 */

export interface ITransactionClient {
  query(text: string, values?: unknown[]): Promise<unknown>;
}

export interface ITransactionManager {
  getClient(): Promise<{
    client: ITransactionClient;
    begin(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    release(): void;
  }>;
}
