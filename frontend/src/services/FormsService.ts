/**
 * Forms service for API interactions.
 */
import { ApiService } from './ApiService';
import type {
  Form,
  FormListParams,
  FormListResponse,
  CreateFormPayload,
  UpdateFormPayload,
} from '@/@types/form';

/**
 * FormsService provides methods for form CRUD operations.
 */
export const FormsService = {
  /**
   * Fetches a paginated list of forms.
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of forms
   */
  async list(params?: FormListParams): Promise<FormListResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.page !== undefined) queryParams.page = String(params.page);
    if (params?.pageSize !== undefined) queryParams.pageSize = String(params.pageSize);
    if (params?.search) queryParams.search = params.search;
    if (params?.status) queryParams.status = params.status;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;

    const response = await ApiService.get<FormListResponse>('forms.list', {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Fetches a single form by ID.
   * @param id - Form ID
   * @returns Form details
   */
  async get(id: string): Promise<Form> {
    const response = await ApiService.get<Form>('forms.get', {
      pathParams: { id },
    });
    return response.data;
  },

  /**
   * Creates a new form.
   * @param payload - Form data
   * @returns Created form
   */
  async create(payload: CreateFormPayload): Promise<Form> {
    const response = await ApiService.post<Form, CreateFormPayload>(
      'forms.create',
      payload
    );
    return response.data;
  },

  /**
   * Updates an existing form.
   * @param id - Form ID
   * @param payload - Updated form data
   * @returns Updated form
   */
  async update(id: string, payload: UpdateFormPayload): Promise<Form> {
    const response = await ApiService.patch<Form, UpdateFormPayload>(
      'forms.update',
      payload,
      { pathParams: { id } }
    );
    return response.data;
  },

  /**
   * Deletes a form.
   * @param id - Form ID
   */
  async delete(id: string): Promise<void> {
    await ApiService.delete('forms.delete', {
      pathParams: { id },
    });
  },
};
