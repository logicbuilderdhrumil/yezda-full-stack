import type { OrganizationContextItem, OrganizationContextResponse, ThemePreferenceResponse, ThemeMode, CustomComponentsResult } from '../../domain/entities/custom-components.entity.js';
import type { ICustomComponentsRepository } from '../../domain/ports/ICustomComponentsRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';

interface ActorContext { userId: string; userType: 'user' | 'candidate' }
interface RequestContext { ipAddress?: string; userAgent?: string; channel: 'web' | 'mobile' | 'api' }

export class ListOrganizationsUseCase {
  constructor(private readonly repo: ICustomComponentsRepository, private readonly audit: IAuditService) {}
  async execute(actor: ActorContext, ctx: RequestContext): Promise<CustomComponentsResult<OrganizationContextResponse>> {
    try {
      const memberships = this.repo.getOrgMemberships(actor.userId);
      const activeOrgId = this.repo.getActiveOrganizationId(actor.userId);
      const organizations: OrganizationContextItem[] = memberships.map((m) => ({ id: m.orgId, name: m.orgName, logoUrl: m.logoUrl, role: m.role, isActive: m.orgId === activeOrgId }));
      this.audit.log({ eventType: 'COMPONENT_ORG_LISTED', actorId: actor.userId, actorType: actor.userType, channel: ctx.channel, ipAddress: ctx.ipAddress, success: true, metadata: { count: organizations.length } });
      return { success: true, data: { organizations, activeOrganizationId: activeOrgId } };
    } catch (err) { return { success: false, error: 'Failed to list organizations', errorCode: 'COMPONENT_ORG_LIST_ERROR' }; }
  }
}

export class SetActiveOrganizationUseCase {
  constructor(private readonly repo: ICustomComponentsRepository, private readonly audit: IAuditService) {}
  async execute(organizationId: string, actor: ActorContext, ctx: RequestContext): Promise<CustomComponentsResult<OrganizationContextItem>> {
    try {
      const memberships = this.repo.getOrgMemberships(actor.userId);
      const membership = memberships.find((m) => m.orgId === organizationId);
      if (!membership) {
        this.audit.log({ eventType: 'COMPONENT_ORG_SWITCH_DENIED', actorId: actor.userId, actorType: actor.userType, targetId: organizationId, channel: ctx.channel, success: false, errorMessage: 'Not a member' });
        return { success: false, error: 'You are not a member of this organization', errorCode: 'COMPONENT_ORG_NOT_MEMBER' };
      }
      const previousOrgId = this.repo.getActiveOrganizationId(actor.userId);
      this.repo.setActiveOrganizationId(actor.userId, organizationId);
      this.audit.log({ eventType: 'COMPONENT_ORG_SWITCHED', actorId: actor.userId, actorType: actor.userType, targetId: organizationId, channel: ctx.channel, success: true, metadata: { previousOrganizationId: previousOrgId, newOrganizationId: organizationId } });
      return { success: true, data: { id: membership.orgId, name: membership.orgName, logoUrl: membership.logoUrl, role: membership.role, isActive: true } };
    } catch (err) { return { success: false, error: 'Failed to set active organization', errorCode: 'COMPONENT_ORG_SWITCH_ERROR' }; }
  }
}

export class GetThemePreferenceUseCase {
  constructor(private readonly repo: ICustomComponentsRepository, private readonly audit: IAuditService) {}
  async execute(actor: ActorContext, ctx: RequestContext): Promise<CustomComponentsResult<ThemePreferenceResponse>> {
    try {
      const pref = this.repo.getThemePreference(actor.userId);
      const response: ThemePreferenceResponse = { mode: pref?.mode ?? 'system', updatedAt: pref?.updatedAt?.toISOString() ?? new Date().toISOString() };
      this.audit.log({ eventType: 'COMPONENT_THEME_READ', actorId: actor.userId, actorType: actor.userType, channel: ctx.channel, success: true, metadata: { mode: response.mode } });
      return { success: true, data: response };
    } catch (err) { return { success: false, error: 'Failed to get theme preference', errorCode: 'COMPONENT_THEME_READ_ERROR' }; }
  }
}

export class UpdateThemePreferenceUseCase {
  constructor(private readonly repo: ICustomComponentsRepository, private readonly audit: IAuditService) {}
  async execute(mode: ThemeMode, actor: ActorContext, ctx: RequestContext): Promise<CustomComponentsResult<ThemePreferenceResponse>> {
    try {
      const previous = this.repo.getThemePreference(actor.userId);
      const updatedAt = this.repo.setThemePreference(actor.userId, mode);
      this.audit.log({ eventType: 'COMPONENT_THEME_UPDATED', actorId: actor.userId, actorType: actor.userType, channel: ctx.channel, success: true, metadata: { previousMode: previous?.mode ?? 'system', newMode: mode } });
      return { success: true, data: { mode, updatedAt: updatedAt.toISOString() } };
    } catch (err) { return { success: false, error: 'Failed to update theme preference', errorCode: 'COMPONENT_THEME_UPDATE_ERROR' }; }
  }
}
