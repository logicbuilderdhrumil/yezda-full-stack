/**
 * Users service for API interactions.
 */
import { ApiService } from './ApiService';
import type {
  ManagedUser,
  UserListParams,
  UserListResponse,
  CreateUserPayload,
  UpdateUserPayload,
} from '@/@types/user';

/**
 * UsersService provides methods for user CRUD operations.
 */
export const UsersService = {
  /**
   * Fetches a paginated list of users.
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of users
   */
  async list(params?: UserListParams): Promise<UserListResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.page !== undefined) queryParams.page = String(params.page);
    if (params?.pageSize !== undefined) queryParams.pageSize = String(params.pageSize);
    if (params?.search) queryParams.search = params.search;
    if (params?.status) queryParams.status = params.status;
    if (params?.role) queryParams.role = params.role;
    if (params?.organizationId) queryParams.organizationId = params.organizationId;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;

    const response = await ApiService.get<UserListResponse>('users.list', {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Fetches a single user by ID.
   * @param id - User ID
   * @returns User details
   */
  async get(id: string): Promise<ManagedUser> {
    const response = await ApiService.get<ManagedUser>('users.get', {
      pathParams: { id },
    });
    return response.data;
  },

  /**
   * Creates a new user.
   * @param payload - User data
   * @returns Created user
   */
  async create(payload: CreateUserPayload): Promise<ManagedUser> {
    const response = await ApiService.post<ManagedUser, CreateUserPayload>(
      'users.create',
      payload
    );
    return response.data;
  },

  /**
   * Updates an existing user.
   * @param id - User ID
   * @param payload - Updated user data
   * @returns Updated user
   */
  async update(id: string, payload: UpdateUserPayload): Promise<ManagedUser> {
    const response = await ApiService.patch<ManagedUser, UpdateUserPayload>(
      'users.update',
      payload,
      { pathParams: { id } }
    );
    return response.data;
  },

  /**
   * Deletes a user.
   * @param id - User ID
   */
  async delete(id: string): Promise<void> {
    await ApiService.delete('users.delete', {
      pathParams: { id },
    });
  },
};
