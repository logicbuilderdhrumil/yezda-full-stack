/**
 * PostgresBillingLedgerRepository — Clean Architecture implementation
 * Migrated from legacy billing-ledger.repository.ts
 */
import { query, getClient } from '../../../../shared/infrastructure/database/index.js';
import type { IBillingLedgerRepository } from '../../domain/ports/IBillingLedgerRepository.js';
import type {
  LedgerEntry,
  LedgerEntryStatus,
  LedgerEntryType,
  LedgerFilterOptions,
  LedgerTotals,
} from '../../domain/entities/ledger.entity.js';

type LedgerEntryRow = {
  id: string;
  tenant_id: string;
  organization_id: string;
  entry_type: string;
  status: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  currency: string;
  reference_id: string | null;
  reference_type: string | null;
  billed_at: Date | null;
  invoice_id: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  created_by_type: string;
  finalized_at: Date | null;
  metadata: string | null;
};

function rowToLedgerEntry(row: LedgerEntryRow): LedgerEntry {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    organizationId: row.organization_id,
    entryType: row.entry_type as LedgerEntryType,
    status: row.status as LedgerEntryStatus,
    description: row.description,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    totalAmount: row.total_amount,
    currency: row.currency,
    referenceId: row.reference_id ?? undefined,
    referenceType: row.reference_type ?? undefined,
    billedAt: row.billed_at ?? undefined,
    invoiceId: row.invoice_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    createdByType: row.created_by_type as 'user' | 'system',
    finalizedAt: row.finalized_at ?? undefined,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  };
}

export class PostgresBillingLedgerRepository implements IBillingLedgerRepository {
  async createEntry(entry: LedgerEntry): Promise<void> {
    await query(
      `INSERT INTO ledger_entries
        (id, tenant_id, organization_id, entry_type, status, description,
         quantity, unit_price, total_amount, currency, reference_id, reference_type,
         billed_at, invoice_id, created_at, updated_at, created_by, created_by_type,
         finalized_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
      [
        entry.id, entry.tenantId, entry.organizationId, entry.entryType, entry.status,
        entry.description, entry.quantity, entry.unitPrice, entry.totalAmount, entry.currency,
        entry.referenceId ?? null, entry.referenceType ?? null, entry.billedAt ?? null,
        entry.invoiceId ?? null, entry.createdAt, entry.updatedAt, entry.createdBy,
        entry.createdByType, entry.finalizedAt ?? null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
      ],
    );
  }

  async findById(tenantId: string, organizationId: string, id: string): Promise<LedgerEntry | undefined> {
    const result = await query<LedgerEntryRow>(
      `SELECT * FROM ledger_entries WHERE tenant_id = $1 AND organization_id = $2 AND id = $3`,
      [tenantId, organizationId, id],
    );
    return result.rows[0] ? rowToLedgerEntry(result.rows[0]) : undefined;
  }

  async findBilledEntries(
    tenantId: string,
    organizationId: string,
    filters: LedgerFilterOptions,
  ): Promise<{ entries: LedgerEntry[]; totalCount: number }> {
    return this.findEntriesByStatus(tenantId, organizationId, 'billed', filters);
  }

  async findUnbilledEntries(
    tenantId: string,
    organizationId: string,
    filters: LedgerFilterOptions,
  ): Promise<{ entries: LedgerEntry[]; totalCount: number }> {
    return this.findEntriesByStatus(tenantId, organizationId, 'unbilled', filters);
  }

  private async findEntriesByStatus(
    tenantId: string,
    organizationId: string,
    status: LedgerEntryStatus,
    filters: LedgerFilterOptions,
  ): Promise<{ entries: LedgerEntry[]; totalCount: number }> {
    const conditions: string[] = ['tenant_id = $1', 'organization_id = $2', 'status = $3'];
    const values: unknown[] = [tenantId, organizationId, status];
    let paramIndex = 4;

    if (filters.startDate) { conditions.push(`created_at >= $${paramIndex++}`); values.push(filters.startDate); }
    if (filters.endDate) { conditions.push(`created_at <= $${paramIndex++}`); values.push(filters.endDate); }
    if (filters.entryTypes?.length) { conditions.push(`entry_type = ANY($${paramIndex++})`); values.push(filters.entryTypes); }
    if (filters.minAmount !== undefined) { conditions.push(`total_amount >= $${paramIndex++}`); values.push(filters.minAmount); }
    if (filters.maxAmount !== undefined) { conditions.push(`total_amount <= $${paramIndex++}`); values.push(filters.maxAmount); }
    if (filters.invoiceId) { conditions.push(`invoice_id = $${paramIndex++}`); values.push(filters.invoiceId); }
    if (filters.referenceId) { conditions.push(`reference_id = $${paramIndex++}`); values.push(filters.referenceId); }
    if (filters.referenceType) { conditions.push(`reference_type = $${paramIndex++}`); values.push(filters.referenceType); }

    const whereClause = conditions.join(' AND ');

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ledger_entries WHERE ${whereClause}`,
      values,
    );
    const totalCount = parseInt(countResult.rows[0]?.count || '0', 10);

    const sortColumn = filters.sortBy === 'totalAmount' ? 'total_amount' : filters.sortBy === 'billedAt' ? 'billed_at' : 'created_at';
    const sortDirection = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const page = filters.page || 1;
    const pageSize = Math.min(filters.pageSize || 50, 100);
    const offset = (page - 1) * pageSize;

    const entriesResult = await query<LedgerEntryRow>(
      `SELECT * FROM ledger_entries WHERE ${whereClause} ORDER BY ${sortColumn} ${sortDirection} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...values, pageSize, offset],
    );

    return { entries: entriesResult.rows.map(rowToLedgerEntry), totalCount };
  }

  async calculateTotals(
    tenantId: string,
    organizationId: string,
    status: LedgerEntryStatus,
    filters: LedgerFilterOptions,
  ): Promise<LedgerTotals> {
    const conditions: string[] = ['tenant_id = $1', 'organization_id = $2', 'status = $3'];
    const values: unknown[] = [tenantId, organizationId, status];
    let paramIndex = 4;

    if (filters.startDate) { conditions.push(`created_at >= $${paramIndex++}`); values.push(filters.startDate); }
    if (filters.endDate) { conditions.push(`created_at <= $${paramIndex++}`); values.push(filters.endDate); }
    if (filters.entryTypes?.length) { conditions.push(`entry_type = ANY($${paramIndex++})`); values.push(filters.entryTypes); }
    if (filters.minAmount !== undefined) { conditions.push(`total_amount >= $${paramIndex++}`); values.push(filters.minAmount); }
    if (filters.maxAmount !== undefined) { conditions.push(`total_amount <= $${paramIndex++}`); values.push(filters.maxAmount); }

    const whereClause = conditions.join(' AND ');

    const totalsResult = await query<{ entry_count: string; total_amount: string; currency: string }>(
      `SELECT COUNT(*) as entry_count, COALESCE(SUM(total_amount), 0) as total_amount, COALESCE(MAX(currency), 'USD') as currency FROM ledger_entries WHERE ${whereClause}`,
      values,
    );

    const byTypeResult = await query<{ entry_type: string; count: string; amount: string }>(
      `SELECT entry_type, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as amount FROM ledger_entries WHERE ${whereClause} GROUP BY entry_type`,
      values,
    );

    const byType: LedgerTotals['byType'] = {
      screening: { count: 0, amount: 0 },
      verification: { count: 0, amount: 0 },
      document_review: { count: 0, amount: 0 },
      subscription: { count: 0, amount: 0 },
      addon: { count: 0, amount: 0 },
      adjustment: { count: 0, amount: 0 },
      credit: { count: 0, amount: 0 },
    };

    for (const row of byTypeResult.rows) {
      const type = row.entry_type as LedgerEntryType;
      if (type in byType) {
        byType[type] = { count: parseInt(row.count, 10), amount: parseInt(row.amount, 10) };
      }
    }

    return {
      entryCount: parseInt(totalsResult.rows[0]?.entry_count || '0', 10),
      totalAmount: parseInt(totalsResult.rows[0]?.total_amount || '0', 10),
      currency: totalsResult.rows[0]?.currency || 'USD',
      byType,
    };
  }

  async isEntryFinalized(tenantId: string, organizationId: string, id: string): Promise<boolean> {
    const result = await query<{ finalized_at: Date | null }>(
      `SELECT finalized_at FROM ledger_entries WHERE tenant_id = $1 AND organization_id = $2 AND id = $3`,
      [tenantId, organizationId, id],
    );
    return result.rows[0]?.finalized_at != null;
  }

  async finalizeEntry(
    tenantId: string,
    organizationId: string,
    id: string,
    invoiceId: string,
  ): Promise<LedgerEntry | undefined> {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const checkResult = await client.query<{ finalized_at: Date | null }>(
        `SELECT finalized_at FROM ledger_entries WHERE tenant_id = $1 AND organization_id = $2 AND id = $3 FOR UPDATE`,
        [tenantId, organizationId, id],
      );
      if (checkResult.rows[0]?.finalized_at) { await client.query('ROLLBACK'); return undefined; }

      const now = new Date();
      const result = await client.query<LedgerEntryRow>(
        `UPDATE ledger_entries SET status = 'billed', billed_at = $4, invoice_id = $5, finalized_at = $4, updated_at = $4 WHERE tenant_id = $1 AND organization_id = $2 AND id = $3 RETURNING *`,
        [tenantId, organizationId, id, now, invoiceId],
      );
      await client.query('COMMIT');
      return result.rows[0] ? rowToLedgerEntry(result.rows[0]) : undefined;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateEntry(
    tenantId: string,
    organizationId: string,
    id: string,
    updates: Partial<Pick<LedgerEntry, 'description' | 'metadata'>>,
  ): Promise<{ success: boolean; entry?: LedgerEntry; error?: string }> {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const checkResult = await client.query<{ finalized_at: Date | null; status: string }>(
        `SELECT finalized_at, status FROM ledger_entries WHERE tenant_id = $1 AND organization_id = $2 AND id = $3 FOR UPDATE`,
        [tenantId, organizationId, id],
      );
      if (!checkResult.rows[0]) { await client.query('ROLLBACK'); return { success: false, error: 'Entry not found' }; }
      if (checkResult.rows[0].finalized_at || checkResult.rows[0].status === 'billed') {
        await client.query('ROLLBACK');
        return { success: false, error: 'Cannot modify finalized ledger entry' };
      }

      const setClauses: string[] = [];
      const values: unknown[] = [tenantId, organizationId, id];
      let paramIndex = 4;
      if (updates.description !== undefined) { setClauses.push(`description = $${paramIndex++}`); values.push(updates.description); }
      if (updates.metadata !== undefined) { setClauses.push(`metadata = $${paramIndex++}`); values.push(JSON.stringify(updates.metadata)); }
      if (setClauses.length === 0) { await client.query('ROLLBACK'); const entry = await this.findById(tenantId, organizationId, id); return { success: true, entry }; }

      setClauses.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());

      const result = await client.query<LedgerEntryRow>(
        `UPDATE ledger_entries SET ${setClauses.join(', ')} WHERE tenant_id = $1 AND organization_id = $2 AND id = $3 RETURNING *`,
        values,
      );
      await client.query('COMMIT');
      return { success: true, entry: result.rows[0] ? rowToLedgerEntry(result.rows[0]) : undefined };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
