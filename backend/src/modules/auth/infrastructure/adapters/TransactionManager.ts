/**
 * TransactionManager Adapter
 * Wraps Postgres client pool transaction methods behind a clean interface
 */
import { getClient } from '../../../db/postgres.js';
import type { ITransactionManager } from '../../application/use-cases/CompletePasswordResetUseCase.js';

export class PostgresTransactionManager implements ITransactionManager {
  async getClient() {
    const pgClient = await getClient();
    return {
      client: {
        query: (text: string, values?: unknown[]) => pgClient.query(text, values),
      },
      begin: () => pgClient.query('BEGIN').then(() => {}),
      commit: () => pgClient.query('COMMIT').then(() => {}),
      rollback: () => pgClient.query('ROLLBACK').then(() => {}),
      release: () => pgClient.release(),
    };
  }
}
