/**
 * Organizations service for API interactions.
 * Aligned with backend contract (org-management.controller.ts).
 */
import { ApiService } from './ApiService';
import type {
  Organization,
  OrganizationListParams,
  OrganizationListResponse,
  OrganizationListResult,
  CreateOrganizationPayload,
  UpdateOrganizationPayload,
} from '@/@types/organization';

/** Default page size for organization lists. */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Normalizes backend response to frontend format.
 * Converts OrganizationListResult to OrganizationListResponse.
 */
function normalizeListResponse(
  result: OrganizationListResult,
  page: number,
  pageSize: number
): OrganizationListResponse {
  const totalPages = Math.ceil(result.total / pageSize);
  return {
    data: result.organizations,
    meta: {
      page,
      pageSize,
      totalItems: result.total,
      totalPages,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    },
  };
}

/**
 * OrganizationsService provides methods for organization CRUD operations.
 */
export const OrganizationsService = {
  /**
   * Fetches a paginated list of organizations.
   * Translates frontend pagination (page/pageSize) to backend format (limit/offset).
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of organizations
   */
  async list(params?: OrganizationListParams): Promise<OrganizationListResponse> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE;

    // Convert to backend pagination format
    const queryParams: Record<string, string> = {};
    queryParams.limit = String(pageSize);
    queryParams.offset = String((page - 1) * pageSize);

    // Optional: use cursor if provided (for cursor-based pagination)
    if (params?.cursor) queryParams.cursor = params.cursor;

    // Filter parameters
    if (params?.search) queryParams.search = params.search;
    if (params?.status) queryParams.status = params.status;
    if (params?.plan) queryParams.plan = params.plan;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;
    if (params?.createdAfter) queryParams.createdAfter = params.createdAfter;
    if (params?.createdBefore) queryParams.createdBefore = params.createdBefore;

    const response = await ApiService.get<OrganizationListResult>('organizations.list', {
      params: queryParams,
    });

    return normalizeListResponse(response.data, page, pageSize);
  },

  /**
   * Fetches a single organization by ID.
   * @param id - Organization ID
   * @returns Organization details
   */
  async get(id: string): Promise<Organization> {
    const response = await ApiService.get<Organization>('organizations.get', {
      pathParams: { id },
    });
    return response.data;
  },

  /**
   * Creates a new organization.
   * @param payload - Organization data
   * @returns Created organization
   */
  async create(payload: CreateOrganizationPayload): Promise<Organization> {
    const response = await ApiService.post<Organization, CreateOrganizationPayload>(
      'organizations.create',
      payload
    );
    return response.data;
  },

  /**
   * Updates an existing organization.
   * @param id - Organization ID
   * @param payload - Updated organization data
   * @returns Updated organization
   */
  async update(id: string, payload: UpdateOrganizationPayload): Promise<Organization> {
    const response = await ApiService.patch<Organization, UpdateOrganizationPayload>(
      'organizations.update',
      payload,
      { pathParams: { id } }
    );
    return response.data;
  },

  /**
   * Deletes an organization.
   * @param id - Organization ID
   */
  async delete(id: string): Promise<void> {
    await ApiService.delete('organizations.delete', {
      pathParams: { id },
    });
  },
};
