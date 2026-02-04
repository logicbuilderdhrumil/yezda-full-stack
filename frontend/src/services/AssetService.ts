/**
 * Asset Service
 * Integration layer for asset management operations.
 */

import type { AxiosProgressEvent } from 'axios';
import { ApiService, type RequestOptions } from './ApiService';
import type { AssetDTO, AssetListResponseDTO, AssetType } from '@/@types/contracts';

/** Asset upload options. */
export interface AssetUploadOptions {
  name?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void;
}

/** Asset list options. */
export interface AssetListOptions {
  type?: AssetType;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

/** Asset update request. */
export interface AssetUpdateRequest {
  name?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * AssetService provides methods for asset management.
 */
export const AssetService = {
  /**
   * Uploads an asset.
   */
  async upload(file: File, options?: AssetUploadOptions): Promise<AssetDTO> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.name) formData.append('name', options.name);
    if (options?.tags) formData.append('tags', JSON.stringify(options.tags));
    if (options?.metadata) formData.append('metadata', JSON.stringify(options.metadata));

    const config: RequestOptions & {
      headers: Record<string, string>;
      onUploadProgress?: (event: AxiosProgressEvent) => void;
    } = {
      headers: { 'Content-Type': 'multipart/form-data' },
    };

    if (options?.onProgress) {
      config.onUploadProgress = (event: AxiosProgressEvent) => {
        const total = event.total ?? 0;
        options.onProgress!({
          loaded: event.loaded,
          total,
          percentage: total > 0 ? Math.round((event.loaded / total) * 100) : 0,
        });
      };
    }

    const response = await ApiService.post<AssetDTO>('assets.upload', formData, config);
    return response.data;
  },

  /**
   * Lists assets.
   */
  async list(options?: AssetListOptions): Promise<AssetListResponseDTO> {
    const params: Record<string, unknown> = {};
    if (options?.type) params.type = options.type;
    if (options?.tags?.length) params.tags = options.tags.join(',');
    if (options?.search) params.search = options.search;
    if (options?.limit) params.limit = options.limit;
    if (options?.offset) params.offset = options.offset;

    const response = await ApiService.get<AssetListResponseDTO>('assets.list', { params });
    return response.data;
  },

  /**
   * Gets an asset by ID.
   */
  async get(assetId: string): Promise<AssetDTO> {
    const response = await ApiService.get<AssetDTO>('assets.get', {
      pathParams: { id: assetId },
    });
    return response.data;
  },

  /**
   * Updates an asset.
   */
  async update(assetId: string, data: AssetUpdateRequest): Promise<AssetDTO> {
    const response = await ApiService.patch<AssetDTO>('assets.update', data, {
      pathParams: { id: assetId },
    });
    return response.data;
  },

  /**
   * Deletes an asset.
   */
  async delete(assetId: string): Promise<void> {
    await ApiService.delete<void>('assets.delete', {
      pathParams: { id: assetId },
    });
  },

  /**
   * Updates asset tags.
   */
  async updateTags(assetId: string, tags: string[]): Promise<AssetDTO> {
    const response = await ApiService.put<AssetDTO>(
      'assets.tags',
      { tags },
      { pathParams: { id: assetId } }
    );
    return response.data;
  },
};
