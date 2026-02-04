/**
 * Organizations service for API interactions.
 */
import { ApiService } from './ApiService';
import type {
  Organization,
  OrganizationListParams,
  OrganizationListResponse,
  CreateOrganizationPayload,
  UpdateOrganizationPayload,
} from '@/@types/organization';

/**
 * OrganizationsService provides methods for organization CRUD operations.
 */
export const OrganizationsService = {
  /**
   * Fetches a paginated list of organizations.
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of organizations
   */
  async list(params?: OrganizationListParams): Promise<OrganizationListResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.page !== undefined) queryParams.page = String(params.page);
    if (params?.pageSize !== undefined) queryParams.pageSize = String(params.pageSize);
    if (params?.search) queryParams.search = params.search;
    if (params?.status) queryParams.status = params.status;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;

    const response = await ApiService.get<OrganizationListResponse>('organizations.list', {
      params: queryParams,
    });
    return response.data;
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
