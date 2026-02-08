/**
 * Module Registry
 *
 * Central registry for pipeline module types.
 * Each module type has a Zod schema that validates its `moduleConfig` shape.
 * The registry supports `register()`, `validate()`, and `getSchema()`.
 */

import type { ZodSchema } from 'zod';
import type { ModuleType } from '../../../shared/@types/pipeline-modules.js';
import {
  FormModuleConfigSchema,
  ExternalServiceModuleConfigSchema,
  InternalProcessingModuleConfigSchema,
  HumanReviewModuleConfigSchema,
  NotificationModuleConfigSchema,
} from '../models/screening-pipeline.model.js';

export interface ModuleRegistryEntry {
  /** Human-readable label for admin UI */
  label: string;
  /** Whether the module produces candidate-visible stages */
  candidateVisible: boolean;
  /** Zod schema that validates the module-specific config object */
  configSchema: ZodSchema;
}

export interface ModuleValidationResult {
  valid: boolean;
  errors?: string[];
}

export class ModuleRegistry {
  private modules = new Map<ModuleType, ModuleRegistryEntry>();

  /**
   * Register a module type with its metadata and config validator.
   */
  register(
    moduleType: ModuleType,
    entry: ModuleRegistryEntry
  ): void {
    if (this.modules.has(moduleType)) {
      throw new Error(`Module type "${moduleType}" is already registered`);
    }
    this.modules.set(moduleType, entry);
  }

  /**
   * Validate a config object against the schema for the given module type.
   * Returns `{ valid: true }` on success or `{ valid: false, errors }`.
   */
  validate(
    moduleType: ModuleType,
    config: unknown
  ): ModuleValidationResult {
    const entry = this.modules.get(moduleType);
    if (!entry) {
      return {
        valid: false,
        errors: [`Unknown module type: ${moduleType}`],
      };
    }

    const result = entry.configSchema.safeParse(config);
    if (result.success) {
      return { valid: true };
    }

    return {
      valid: false,
      errors: result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      ),
    };
  }

  /**
   * Return the Zod schema for a given module type, or undefined if not found.
   */
  getSchema(moduleType: ModuleType): ZodSchema | undefined {
    return this.modules.get(moduleType)?.configSchema;
  }

  /**
   * Return the full registry entry, or undefined if not found.
   */
  getEntry(moduleType: ModuleType): ModuleRegistryEntry | undefined {
    return this.modules.get(moduleType);
  }

  /**
   * Check whether a module type is registered.
   */
  has(moduleType: ModuleType): boolean {
    return this.modules.has(moduleType);
  }

  /**
   * Return all registered module types.
   */
  listTypes(): ModuleType[] {
    return Array.from(this.modules.keys());
  }
}

// ---------------------------------------------------------------------------
// Singleton instance with built-in module types registered
// ---------------------------------------------------------------------------

export const moduleRegistry = new ModuleRegistry();

// Task 3.6 — register built-in module types
moduleRegistry.register('form', {
  label: 'Form',
  candidateVisible: true,
  configSchema: FormModuleConfigSchema,
});

moduleRegistry.register('external_service', {
  label: 'External Service',
  candidateVisible: false,
  configSchema: ExternalServiceModuleConfigSchema,
});

moduleRegistry.register('internal_processing', {
  label: 'Internal Processing',
  candidateVisible: false,
  configSchema: InternalProcessingModuleConfigSchema,
});

moduleRegistry.register('human_review', {
  label: 'Human Review',
  candidateVisible: false,
  configSchema: HumanReviewModuleConfigSchema,
});

moduleRegistry.register('notification', {
  label: 'Notification',
  candidateVisible: false,
  configSchema: NotificationModuleConfigSchema,
});
