/**
 * Form Builder Service
 * Integration layer for form management operations.
 */

import { ApiService } from '@/services/ApiService';
import type {
  FormDTO,
  FormSubmissionDTO,
  FormStatus,
  ResponseMeta,
} from '@/@types/contracts';

/** Form list options. */
export interface FormListOptions {
  status?: FormStatus;
  limit?: number;
  offset?: number;
  search?: string;
}

/** Create form request. */
export interface CreateFormRequest {
  name: string;
  description?: string;
  fields: FormDTO['fields'];
  settings?: FormDTO['settings'];
}

/** Update form request. */
export interface UpdateFormRequest {
  name?: string;
  description?: string;
  fields?: FormDTO['fields'];
  settings?: FormDTO['settings'];
}

/**
 * FormService provides methods for form builder operations.
 */
export const FormService = {
  /**
   * Lists forms.
   */
  async list(options?: FormListOptions): Promise<{
    forms: FormDTO[];
    meta: ResponseMeta;
  }> {
    const response = await ApiService.get<{ forms: FormDTO[]; meta: ResponseMeta }>(
      'forms.list',
      { params: options }
    );
    return response.data;
  },

  /**
   * Gets a form by ID.
   */
  async get(formId: string): Promise<FormDTO> {
    const response = await ApiService.get<FormDTO>('forms.get', {
      pathParams: { id: formId },
    });
    return response.data;
  },

  /**
   * Creates a new form.
   */
  async create(data: CreateFormRequest): Promise<FormDTO> {
    const response = await ApiService.post<FormDTO>('forms.create', data);
    return response.data;
  },

  /**
   * Updates a form.
   */
  async update(formId: string, data: UpdateFormRequest): Promise<FormDTO> {
    const response = await ApiService.patch<FormDTO>('forms.update', data, {
      pathParams: { id: formId },
    });
    return response.data;
  },

  /**
   * Deletes a form.
   */
  async delete(formId: string): Promise<void> {
    await ApiService.delete<void>('forms.delete', {
      pathParams: { id: formId },
    });
  },

  /**
   * Publishes a form.
   */
  async publish(formId: string): Promise<FormDTO> {
    const response = await ApiService.post<FormDTO>('forms.publish', undefined, {
      pathParams: { id: formId },
    });
    return response.data;
  },

  /**
   * Gets form submissions.
   */
  async getSubmissions(
    formId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ submissions: FormSubmissionDTO[]; meta: ResponseMeta }> {
    const response = await ApiService.get<{
      submissions: FormSubmissionDTO[];
      meta: ResponseMeta;
    }>('forms.submissions', {
      pathParams: { id: formId },
      params: options,
    });
    return response.data;
  },
};
