import type { IShellRepository } from '../../domain/ports/IShellRepository.js';
import type { ShellConfig, RoutePolicy, NavigationItem, PreferenceDefaults, UserShellPreferences } from '../../domain/entities/shell.entity.js';

export class GetShellConfigUseCase {
  constructor(private readonly repo: IShellRepository) {}
  execute(): ShellConfig { return this.repo.getConfig(); }
}
export class GetRoutePoliciesUseCase {
  constructor(private readonly repo: IShellRepository) {}
  execute(): RoutePolicy[] { return this.repo.getRoutePolicies(); }
}
export class GetNavigationUseCase {
  constructor(private readonly repo: IShellRepository) {}
  execute(userId: string, roles: string[]): NavigationItem[] { return this.repo.getNavigation(userId, roles); }
}
export class GetPreferenceDefaultsUseCase {
  constructor(private readonly repo: IShellRepository) {}
  execute(): PreferenceDefaults { return this.repo.getPreferenceDefaults(); }
}
export class GetUserPreferencesUseCase {
  constructor(private readonly repo: IShellRepository) {}
  execute(userId: string): UserShellPreferences { return this.repo.getUserPreferences(userId); }
}
export class UpdateUserPreferencesUseCase {
  constructor(private readonly repo: IShellRepository) {}
  execute(userId: string, prefs: Partial<UserShellPreferences>): UserShellPreferences { return this.repo.updateUserPreferences(userId, prefs); }
}
