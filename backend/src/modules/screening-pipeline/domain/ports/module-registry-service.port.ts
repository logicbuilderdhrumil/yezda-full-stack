/**
 * Module Registry Service Port (Screening Pipeline)
 */
export interface IModuleRegistryService {
  validate(moduleType: string, config: Record<string, unknown>): {
    valid: boolean;
    errors?: string[];
  };
}
