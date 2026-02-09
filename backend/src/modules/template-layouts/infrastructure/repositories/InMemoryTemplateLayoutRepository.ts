import type { ITemplateLayoutRepository } from '../../domain/ports/ITemplateLayoutRepository.js';
import type { TemplateLayoutNavigation, GlobalControlSummary, LayoutAccessContext } from '../../domain/entities/template-layout.entity.js';

export class InMemoryTemplateLayoutRepository implements ITemplateLayoutRepository {
  async getNavigation(context: LayoutAccessContext): Promise<TemplateLayoutNavigation> {
    return {
      header: {
        title: 'Yezda', showSearch: true, showNotifications: true, showProfile: true,
        navItems: [
          { id: 'nav-dashboard', label: 'Dashboard', icon: 'home', path: '/dashboard', action: 'link' },
          { id: 'nav-candidates', label: 'Candidates', icon: 'users', path: '/candidates', action: 'link' },
          { id: 'nav-screening', label: 'Screening', icon: 'shield', path: '/screening', action: 'link' },
        ],
      },
      sideNav: {
        visible: true, collapsible: true, defaultCollapsed: false, position: 'left',
        items: [
          { id: 'side-dashboard', label: 'Dashboard', icon: 'layout-dashboard', path: '/dashboard', order: 1 },
          { id: 'side-candidates', label: 'Candidates', icon: 'users', path: '/candidates', order: 2 },
          { id: 'side-settings', label: 'Settings', icon: 'settings', path: '/settings', order: 10, authorities: ['admin'] },
        ],
      },
      version: '1.0.0',
    };
  }

  async getGlobalControls(context: LayoutAccessContext): Promise<GlobalControlSummary> {
    return {
      profile: { id: context.userId, displayName: 'User', email: 'user@example.com', role: context.userType, tenantId: context.tenantId },
      notifications: { unreadCount: 3, hasUrgent: false, lastUpdated: new Date() },
    };
  }
}
