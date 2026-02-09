/**
 * In-Memory Form Builder Repository
 *
 * Replace with PostgreSQL adapter in production.
 * Matches the legacy in-memory Map store behaviour.
 */
import type {
  IFormBuilderRepository,
} from '../../domain/ports/form-builder-repository.port.js';
import type {
  FormDefinition,
  FormStatus,
  ListFormsQuery,
} from '../../domain/entities/form-builder.entity.js';

const formStore = new Map<string, FormDefinition>();

export class InMemoryFormBuilderRepository implements IFormBuilderRepository {
  async findAll(tenantId: string, query: ListFormsQuery): Promise<{ forms: FormDefinition[]; total: number }> {
    let forms = Array.from(formStore.values()).filter((f) => f.tenantId === tenantId);

    if (query.status) {
      forms = forms.filter((f) => f.status === query.status);
    }
    if (query.search) {
      const s = query.search.toLowerCase();
      forms = forms.filter(
        (f) => f.name.toLowerCase().includes(s) || f.description?.toLowerCase().includes(s),
      );
    }

    const sortBy = query.sortBy ?? 'updatedAt';
    const sortOrder = query.sortOrder ?? 'desc';
    forms.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'createdAt': cmp = a.createdAt.getTime() - b.createdAt.getTime(); break;
        case 'updatedAt': cmp = a.updatedAt.getTime() - b.updatedAt.getTime(); break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    const total = forms.length;
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const paginated = forms.slice(offset, offset + limit);

    return { forms: paginated, total };
  }

  async findById(id: string): Promise<FormDefinition | undefined> {
    return formStore.get(id);
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<FormDefinition | undefined> {
    const form = formStore.get(id);
    if (!form || form.tenantId !== tenantId) return undefined;
    return form;
  }

  async create(form: FormDefinition): Promise<FormDefinition> {
    formStore.set(form.id, form);
    return form;
  }

  async update(id: string, data: Partial<FormDefinition>): Promise<FormDefinition | undefined> {
    const existing = formStore.get(id);
    if (!existing) return undefined;
    const updated: FormDefinition = { ...existing, ...data };
    formStore.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: FormStatus): Promise<FormDefinition | undefined> {
    const existing = formStore.get(id);
    if (!existing) return undefined;
    existing.status = status;
    existing.version += 1;
    existing.updatedAt = new Date();
    formStore.set(id, existing);
    return existing;
  }

  async delete(id: string): Promise<boolean> {
    return formStore.delete(id);
  }
}
