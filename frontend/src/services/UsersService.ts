/**
 * Users service for API interactions.
 * Aligned with backend contract (user-management.controller.ts).
 */
import { ApiService } from './ApiService';
import type {
  ManagedUser,
  UserListParams,
  UserListResponse,
  UserListResult,
  CreateUserPayload,
  UpdateUserPayload,
} from '@/@types/user';

/** Default page size for user lists. */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Normalizes backend response to frontend format.
 * Converts UserListResult to UserListResponse.
 */
function normalizeListResponse(result: UserListResult): UserListResponse {
  return {
    data: result.users,
    meta: {
      page: result.page,
      pageSize: result.limit,
      totalItems: result.total,
      totalPages: result.totalPages,
    },
  };
}

/**
 * UsersService provides methods for user CRUD operations.
 */
export const UsersService = {
  /**
   * Fetches a paginated list of users.
   * Translates frontend pagination to backend format.
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of users
   */
  async list(params?: UserListParams): Promise<UserListResponse> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE;

    // Build query parameters matching backend UserSearchParams
    const queryParams: Record<string, string> = {};
    queryParams.page = String(page);
    queryParams.limit = String(pageSize);

    // Filter parameters - backend uses 'q' for search query
    if (params?.search) queryParams.q = params.search;
    if (params?.status) queryParams.status = params.status;
    if (params?.role) queryParams.role = params.role;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;

    const response = await ApiService.get<UserListResult>('users.list', {
      params: queryParams,
    });

    return normalizeListResponse(response.data);
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
