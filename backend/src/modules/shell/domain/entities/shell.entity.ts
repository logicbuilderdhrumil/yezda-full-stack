// Shell Domain Entities
export interface ShellConfig { layout: string; sidebar: boolean; topbar: boolean; footer: boolean; }
export interface RoutePolicy { path: string; roles: string[]; public: boolean; }
export interface NavigationItem { label: string; path: string; icon?: string; children?: NavigationItem[]; roles?: string[]; }
export interface PreferenceDefaults { theme: string; locale: string; }
export interface UserShellPreferences { sidebarCollapsed?: boolean; theme?: string; locale?: string; }
