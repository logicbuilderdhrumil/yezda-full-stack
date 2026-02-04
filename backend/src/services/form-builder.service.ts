/**
 * Form Builder Service
 * Task 1.2: Implement form list, create, edit, and retrieve endpoints.
 * Task 1.4: Tenant scoping and RBAC for form management.
 * Task 1.5: Audit logging for form definition changes.
 * Task 1.6: Caching for form retrieval endpoints.
 * Task 1.7: SLO monitoring for form endpoints.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  FormDefinition,
  FormDefinitionSummary,
  CreateFormRequest,
  UpdateFormRequest,
  ListFormsQuery,
  ListFormsResponse,
  GetFormResponse,
} from '../models/form-builder.model.js';
import {
  validateFieldIdUniqueness,
  validateConditionalReferences,
  countFormFields,
} from '../models/form-builder.model.js';
import { auditService } from './audit.service.js';
import { metricsService } from './metrics.service.js';
import { cacheGet, cacheSet, cacheDel } from '../db/redis.js';

/**
 * Form configuration cache TTL (5 minutes)
 */
const FORM_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * In-memory form store (replace with database in production)
 */
const formStore = new Map<string, FormDefinition>();

/**
 * Generate cache key for form retrieval
 */
function getFormCacheKey(tenantId: string, formId: string): string {
  return `form:${tenantId}:${formId}`;
}

/**
 * Generate cache key for form list
 */
function getFormListCacheKey(tenantId: string, query: ListFormsQuery): string {
  const queryHash = JSON.stringify(query);
  return `form-list:${tenantId}:${queryHash}`;
}

export interface FormBuilderResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export class FormBuilderService {
  /**
   * Create a new form definition
   * Task 1.2: Create form
   * Task 1.4: Tenant scoping
   * Task 1.5: Audit logging
   */
  async createForm(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    request: CreateFormRequest,
    ipAddress?: string
  ): Promise<FormBuilderResult<FormDefinition>> {
    const startTime = Date.now();

    // Validate field ID uniqueness
    const uniquenessCheck = validateFieldIdUniqueness(request.sections);
    if (!uniquenessCheck.valid) {
      metricsService.recordFormBuilderRequest('create', false, Date.now() - startTime);
      return {
        success: false,
        error: `Duplicate field IDs: ${uniquenessCheck.duplicateIds.join(', ')}`,
        errorCode: 'DUPLICATE_FIELD_IDS',
      };
    }

    // Validate conditional references
    const refCheck = validateConditionalReferences(request.sections);
    if (!refCheck.valid) {
      metricsService.recordFormBuilderRequest('create', false, Date.now() - startTime);
      return {
        success: false,
        error: `Invalid conditional references: ${refCheck.invalidRefs.join(', ')}`,
        errorCode: 'INVALID_CONDITIONAL_REFS',
      };
    }

    const now = new Date();
    const formId = uuidv4();

    const form: FormDefinition = {
      id: formId,
      tenantId,
      name: request.name,
      description: request.description,
      version: 1,
      status: request.status ?? 'draft',
      sections: request.sections,
      settings: request.settings ?? {},
      metadata: request.metadata,
      createdAt: now,
      createdBy: userId,
      updatedAt: now,
      updatedBy: userId,
    };

    // Store form
    formStore.set(formId, form);

    // Task 1.5: Audit logging
    auditService.logFormCreated({
      userId,
      userType,
      tenantId,
      formId,
      formName: form.name,
      fieldCount: countFormFields(form.sections),
      channel: 'api',
      ipAddress,
    });

    // Invalidate list cache for tenant
    await this.invalidateListCache(tenantId);

    metricsService.recordFormBuilderRequest('create', true, Date.now() - startTime);
    return { success: true, data: form };
  }

  /**
   * Update an existing form definition
   * Task 1.2: Edit form
   * Task 1.4: Tenant scoping
   * Task 1.5: Audit logging
   */
  async updateForm(
    tenantId: string,
    formId: string,
    userId: string,
    userType: 'user' | 'candidate',
    request: UpdateFormRequest,
    ipAddress?: string
  ): Promise<FormBuilderResult<FormDefinition>> {
    const startTime = Date.now();

    // Get existing form
    const existing = formStore.get(formId);
    if (!existing) {
      metricsService.recordFormBuilderRequest('update', false, Date.now() - startTime);
      return {
        success: false,
        error: 'Form not found',
        errorCode: 'FORM_NOT_FOUND',
      };
    }

    // Task 1.4: Tenant isolation
    if (existing.tenantId !== tenantId) {
      // Log unauthorized access attempt
      auditService.logFormAccessDenied({
        userId,
        userType,
        tenantId,
        formId,
        reason: 'Cross-tenant form update attempt',
        channel: 'api',
        ipAddress,
      });

      metricsService.recordFormBuilderRequest('update', false, Date.now() - startTime);
      return {
        success: false,
        error: 'Form not found',
        errorCode: 'FORM_NOT_FOUND',
      };
    }

    // Validate sections if provided
    if (request.sections) {
      const uniquenessCheck = validateFieldIdUniqueness(request.sections);
      if (!uniquenessCheck.valid) {
        metricsService.recordFormBuilderRequest('update', false, Date.now() - startTime);
        return {
          success: false,
          error: `Duplicate field IDs: ${uniquenessCheck.duplicateIds.join(', ')}`,
          errorCode: 'DUPLICATE_FIELD_IDS',
        };
      }

      const refCheck = validateConditionalReferences(request.sections);
      if (!refCheck.valid) {
        metricsService.recordFormBuilderRequest('update', false, Date.now() - startTime);
        return {
          success: false,
          error: `Invalid conditional references: ${refCheck.invalidRefs.join(', ')}`,
          errorCode: 'INVALID_CONDITIONAL_REFS',
        };
      }
    }

    const now = new Date();
    const previousVersion = existing.version;

    // Update form
    const updated: FormDefinition = {
      ...existing,
      name: request.name ?? existing.name,
      description: request.description !== undefined ? request.description : existing.description,
      sections: request.sections ?? existing.sections,
      settings: request.settings ? { ...existing.settings, ...request.settings } : existing.settings,
      status: request.status ?? existing.status,
      metadata: request.metadata !== undefined ? request.metadata : existing.metadata,
      version: existing.version + 1,
      updatedAt: now,
      updatedBy: userId,
    };

    formStore.set(formId, updated);

    // Task 1.5: Audit logging
    auditService.logFormUpdated({
      userId,
      userType,
      tenantId,
      formId,
      formName: updated.name,
      previousVersion,
      newVersion: updated.version,
      changes: Object.keys(request).filter((key) => request[key as keyof UpdateFormRequest] !== undefined),
      channel: 'api',
      ipAddress,
    });

    // Invalidate caches
    await this.invalidateFormCache(tenantId, formId);
    await this.invalidateListCache(tenantId);

    metricsService.recordFormBuilderRequest('update', true, Date.now() - startTime);
    return { success: true, data: updated };
  }

  /**
   * Get a form definition by ID
   * Task 1.2: Retrieve form
   * Task 1.4: Tenant scoping
   * Task 1.6: Caching
   */
  async getForm(
    tenantId: string,
    formId: string,
    userId?: string,
    userType?: 'user' | 'candidate',
    ipAddress?: string
  ): Promise<FormBuilderResult<GetFormResponse>> {
    const startTime = Date.now();
    const cacheKey = getFormCacheKey(tenantId, formId);

    // Task 1.6: Check cache first
    try {
      const cached = await cacheGet<FormDefinition>(cacheKey);
      if (cached) {
        metricsService.recordFormBuilderCacheHit();
        metricsService.recordFormBuilderRequest('get', true, Date.now() - startTime);

        // Audit log for authenticated access
        if (userId) {
          auditService.logFormAccessed({
            userId,
            userType: userType ?? 'user',
            tenantId,
            formId,
            cached: true,
            channel: 'api',
            ipAddress,
          });
        }

        return { success: true, data: { form: cached, cachedAt: new Date() } };
      }
    } catch (error) {
      console.warn('[FormBuilderService] Cache error:', error);
    }

    metricsService.recordFormBuilderCacheMiss();

    // Get from store
    const form = formStore.get(formId);
    if (!form) {
      metricsService.recordFormBuilderRequest('get', false, Date.now() - startTime);
      return {
        success: false,
        error: 'Form not found',
        errorCode: 'FORM_NOT_FOUND',
      };
    }

    // Task 1.4: Tenant isolation
    if (form.tenantId !== tenantId) {
      if (userId) {
        auditService.logFormAccessDenied({
          userId,
          userType: userType ?? 'user',
          tenantId,
          formId,
          reason: 'Cross-tenant form access attempt',
          channel: 'api',
          ipAddress,
        });
      }

      metricsService.recordFormBuilderRequest('get', false, Date.now() - startTime);
      return {
        success: false,
        error: 'Form not found',
        errorCode: 'FORM_NOT_FOUND',
      };
    }

    // Task 1.6: Cache the response
    try {
      await cacheSet(cacheKey, form, FORM_CACHE_TTL_MS);
    } catch (error) {
      console.warn('[FormBuilderService] Failed to cache form:', error);
    }

    // Audit log for authenticated access
    if (userId) {
      auditService.logFormAccessed({
        userId,
        userType: userType ?? 'user',
        tenantId,
        formId,
        cached: false,
        channel: 'api',
        ipAddress,
      });
    }

    metricsService.recordFormBuilderRequest('get', true, Date.now() - startTime);
    return { success: true, data: { form } };
  }

  /**
   * List form definitions for a tenant
   * Task 1.2: List forms
   * Task 1.4: Tenant scoping
   * Task 1.6: Caching
   */
  async listForms(
    tenantId: string,
    query: ListFormsQuery,
    _userId?: string,
    _userType?: 'user' | 'candidate',
    _ipAddress?: string
  ): Promise<FormBuilderResult<ListFormsResponse>> {
    const startTime = Date.now();
    const cacheKey = getFormListCacheKey(tenantId, query);

    // Task 1.6: Check cache first
    try {
      const cached = await cacheGet<ListFormsResponse>(cacheKey);
      if (cached) {
        metricsService.recordFormBuilderCacheHit();
        metricsService.recordFormBuilderRequest('list', true, Date.now() - startTime);
        return { success: true, data: cached };
      }
    } catch (error) {
      console.warn('[FormBuilderService] Cache error:', error);
    }

    metricsService.recordFormBuilderCacheMiss();

    // Filter forms by tenant
    let forms = Array.from(formStore.values()).filter((f) => f.tenantId === tenantId);

    // Apply filters
    if (query.status) {
      forms = forms.filter((f) => f.status === query.status);
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      forms = forms.filter(
        (f) =>
          f.name.toLowerCase().includes(searchLower) ||
          f.description?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    const sortBy = query.sortBy ?? 'updatedAt';
    const sortOrder = query.sortOrder ?? 'desc';
    forms.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updatedAt':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    const total = forms.length;
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    // Paginate
    const paginatedForms = forms.slice(offset, offset + limit);

    // Convert to summaries
    const summaries: FormDefinitionSummary[] = paginatedForms.map((f) => ({
      id: f.id,
      tenantId: f.tenantId,
      name: f.name,
      description: f.description,
      version: f.version,
      status: f.status,
      fieldCount: countFormFields(f.sections),
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));

    const response: ListFormsResponse = {
      forms: summaries,
      total,
      limit,
      offset,
    };

    // Task 1.6: Cache the response
    try {
      await cacheSet(cacheKey, response, FORM_CACHE_TTL_MS);
    } catch (error) {
      console.warn('[FormBuilderService] Failed to cache form list:', error);
    }

    metricsService.recordFormBuilderRequest('list', true, Date.now() - startTime);
    return { success: true, data: response };
  }

  /**
   * Delete a form definition
   * Task 1.2: Delete form (soft delete via status change)
   * Task 1.4: Tenant scoping and RBAC
   * Task 1.5: Audit logging
   */
  async deleteForm(
    tenantId: string,
    formId: string,
    userId: string,
    userType: 'user' | 'candidate',
    ipAddress?: string
  ): Promise<FormBuilderResult<void>> {
    const startTime = Date.now();

    // Get existing form
    const existing = formStore.get(formId);
    if (!existing) {
      metricsService.recordFormBuilderRequest('delete', false, Date.now() - startTime);
      return {
        success: false,
        error: 'Form not found',
        errorCode: 'FORM_NOT_FOUND',
      };
    }

    // Task 1.4: Tenant isolation
    if (existing.tenantId !== tenantId) {
      auditService.logFormAccessDenied({
        userId,
        userType,
        tenantId,
        formId,
        reason: 'Cross-tenant form delete attempt',
        channel: 'api',
        ipAddress,
      });

      metricsService.recordFormBuilderRequest('delete', false, Date.now() - startTime);
      return {
        success: false,
        error: 'Form not found',
        errorCode: 'FORM_NOT_FOUND',
      };
    }

    // Soft delete: archive the form
    const now = new Date();
    const updated: FormDefinition = {
      ...existing,
      status: 'archived',
      version: existing.version + 1,
      updatedAt: now,
      updatedBy: userId,
    };

    formStore.set(formId, updated);

    // Task 1.5: Audit logging
    auditService.logFormDeleted({
      userId,
      userType,
      tenantId,
      formId,
      formName: existing.name,
      channel: 'api',
      ipAddress,
    });

    // Invalidate caches
    await this.invalidateFormCache(tenantId, formId);
    await this.invalidateListCache(tenantId);

    metricsService.recordFormBuilderRequest('delete', true, Date.now() - startTime);
    return { success: true };
  }

  /**
   * Get form version history (for audit compliance)
   */
  getFormVersion(tenantId: string, formId: string): number | undefined {
    const form = formStore.get(formId);
    if (!form || form.tenantId !== tenantId) {
      return undefined;
    }
    return form.version;
  }

  /**
   * Check SLO compliance
   * Task 1.7: SLO monitoring
   */
  checkSLOs(): { met: boolean; violations: string[] } {
    return metricsService.checkFormBuilderSLOs();
  }

  /**
   * Invalidate form cache
   */
  private async invalidateFormCache(tenantId: string, formId: string): Promise<void> {
    const cacheKey = getFormCacheKey(tenantId, formId);
    try {
      await cacheDel(cacheKey);
    } catch (error) {
      console.warn('[FormBuilderService] Failed to invalidate form cache:', error);
    }
  }

  /**
   * Invalidate list cache for a tenant
   */
  private async invalidateListCache(tenantId: string): Promise<void> {
    // In production, use pattern-based cache invalidation
    // For now, we'll rely on TTL-based expiration
    console.log(`[FormBuilderService] List cache invalidation requested for tenant: ${tenantId}`);
  }
}

export const formBuilderService = new FormBuilderService();
