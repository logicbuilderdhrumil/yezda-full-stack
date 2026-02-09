/**
 * Form Builder Repository Port
 */
import type {
  FormDefinition,
  FormStatus,
  ListFormsQuery,
} from '../entities/form-builder.entity.js';

export interface IFormBuilderRepository {
  findAll(tenantId: string, query: ListFormsQuery): Promise<{ forms: FormDefinition[]; total: number }>;
  findById(id: string): Promise<FormDefinition | undefined>;
  findByIdAndTenant(id: string, tenantId: string): Promise<FormDefinition | undefined>;
  create(form: FormDefinition): Promise<FormDefinition>;
  update(id: string, data: Partial<FormDefinition>): Promise<FormDefinition | undefined>;
  updateStatus(id: string, status: FormStatus): Promise<FormDefinition | undefined>;
  delete(id: string): Promise<boolean>;
}
