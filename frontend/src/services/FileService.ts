/**
 * File Service
 * Integration layer for file upload and download operations.
 */

import type { AxiosProgressEvent } from 'axios';
import { ApiService, type RequestOptions } from './ApiService';
import type {
  FileMetadataDTO,
  FileUploadResponseDTO,
  FileListResponseDTO,
  StorageUsageDTO,
} from '@/@types/contracts';

/** Upload progress information. */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/** Options for file upload. */
export interface UploadOptions extends Omit<RequestOptions, 'headers'> {
  /** Progress callback for upload tracking. */
  onProgress?: (progress: UploadProgress) => void;
  /** Additional form fields to include with the upload. */
  additionalFields?: Record<string, string>;
  /** Custom headers for the request. */
  headers?: Record<string, string>;
  /** Expiration in days. */
  expiresInDays?: number;
}

/** Signed URL response from backend. */
export interface SignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresAt: number;
}

/**
 * FileService provides methods for file upload and download operations.
 */
export const FileService = {
  /**
   * Uploads a file to the server.
   */
  async upload(
    file: File,
    options?: UploadOptions
  ): Promise<FileUploadResponseDTO> {
    const formData = new FormData();
    formData.append('file', file);

    if (options?.expiresInDays) {
      formData.append('expiresInDays', String(options.expiresInDays));
    }

    if (options?.additionalFields) {
      for (const [key, value] of Object.entries(options.additionalFields)) {
        formData.append(key, value);
      }
    }

    const config: RequestOptions & {
      headers: Record<string, string>;
      onUploadProgress?: (event: AxiosProgressEvent) => void;
    } = {
      ...options,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...options?.headers,
      },
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

    const response = await ApiService.post<FileUploadResponseDTO>(
      'files.upload',
      formData,
      config
    );
    return response.data;
  },

  /**
   * Lists files.
   */
  async list(params?: {
    limit?: number;
    offset?: number;
    mimeType?: string;
    uploaderId?: string;
  }): Promise<FileListResponseDTO> {
    const response = await ApiService.get<FileListResponseDTO>('files.list', {
      params,
    });
    return response.data;
  },

  /**
   * Gets file metadata.
   */
  async get(fileId: string): Promise<FileMetadataDTO> {
    const response = await ApiService.get<FileMetadataDTO>('files.get', {
      pathParams: { id: fileId },
    });
    return response.data;
  },

  /**
   * Downloads a file.
   */
  async download(fileId: string, filename?: string): Promise<Blob> {
    const response = await ApiService.get<Blob>('files.download', {
      pathParams: { id: fileId },
      responseType: 'blob',
    });

    if (filename) {
      triggerDownload(response.data, filename);
    }

    return response.data;
  },

  /**
   * Deletes a file.
   */
  async delete(fileId: string): Promise<void> {
    await ApiService.delete<void>('files.delete', {
      pathParams: { id: fileId },
    });
  },

  /**
   * Gets storage usage.
   */
  async getStorageUsage(): Promise<StorageUsageDTO> {
    const response = await ApiService.get<StorageUsageDTO>('files.storageUsage');
    return response.data;
  },

  /**
   * Gets a pre-signed URL for direct S3 upload.
   */
  async getSignedUploadUrl(
    filename: string,
    contentType: string
  ): Promise<SignedUrlResponse> {
    const response = await ApiService.post<SignedUrlResponse>('files.signedUrl', {
      filename,
      contentType,
    });
    return response.data;
  },
};

/**
 * Triggers a browser download for a blob.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
