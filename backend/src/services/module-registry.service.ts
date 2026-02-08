/**
 * Module Registry
 * Validates module configs by type using a registry pattern.
 * Extensible — register new module types without schema migrations.
 */

import { z } from 'zod';
import type { ModuleType } from '../models/screening-pipeline.model.js';
import {
  FormModuleConfigSchema,
  ExternalServiceModuleConfigSchema,
  InternalProcessingModuleConfigSchema,
  HumanReviewModuleConfigSchema,
  NotificationModuleConfigSchema,
} from '../models/screening-pipeline.model.js';

/** Module validator entry */
interface ModuleRegistryEntry {
  type: ModuleType;
  schema: z.ZodSchema;
  label: string;
}

/**
 * ModuleRegistry — central registry for pipeline module type validators.
 */
class ModuleRegistryClass {
  private entries = new Map<ModuleType, ModuleRegistryEntry>();

  /**
   * Register a module type with its validation schema.
   */
  register(entry: ModuleRegistryEntry): void {
    this.entries.set(entry.type, entry);
  }

  /**
   * Validate a moduleConfig against the registered schema for its type.
   * @returns null if valid, or a string error message.
   */
  validate(type: ModuleType, config: unknown): string | null {
    const entry = this.entries.get(type);
    if (!entry) {
      return `Unknown module type: ${type}`;
    }
    const result = entry.schema.safeParse(config);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      return `Invalid ${type} config: ${issues}`;
    }
    return null;
  }

  /**
   * Get the Zod schema for a module type.
   */
  getSchema(type: ModuleType): z.ZodSchema | undefined {
    return this.entries.get(type)?.schema;
  }

  /**
   * List all registered module types.
   */
  listTypes(): ModuleType[] {
    return Array.from(this.entries.keys());
  }

  /**
   * Check if a module type is registered.
   */
  has(type: ModuleType): boolean {
    return this.entries.has(type);
  }
}

/** Singleton module registry instance */
export const moduleRegistry = new ModuleRegistryClass();

// Register built-in module types
moduleRegistry.register({
  type: 'form',
  schema: FormModuleConfigSchema,
  label: 'Form',
});

moduleRegistry.register({
  type: 'external_service',
  schema: ExternalServiceModuleConfigSchema,
  label: 'External Service',
});

moduleRegistry.register({
  type: 'internal_processing',
  schema: InternalProcessingModuleConfigSchema,
  label: 'Internal Processing',
});

moduleRegistry.register({
  type: 'human_review',
  schema: HumanReviewModuleConfigSchema,
  label: 'Human Review',
});

moduleRegistry.register({
  type: 'notification',
  schema: NotificationModuleConfigSchema,
  label: 'Notification',
});
