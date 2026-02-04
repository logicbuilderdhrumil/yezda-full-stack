import type { AxiosProgressEvent } from 'axios';
import { ApiService, type ApiResponse, type RequestOptions } from './ApiService';
import {
  extractFileMetadata,
  calculateUploadProgress,
  type FileMetadata,
  type UploadProgress,
} from '@/utils/fileUtils';

/** Response from file upload endpoint. */
export interface FileUploadResponse {
  /** Unique identifier for the uploaded file. */
  id: string;
  /** URL to access the file. */
  url: string;
  /** File metadata. */
  metadata: FileMetadata;
  /** Storage key (e.g., S3 key). */
  key: string;
}

/** Options for file upload. */
export interface UploadOptions extends Omit<RequestOptions, 'headers'> {
  /** Progress callback for upload tracking. */
  onProgress?: (progress: UploadProgress) => void;
  /** Additional form fields to include with the upload. */
  additionalFields?: Record<string, string>;
  /** Custom headers for the request. */
  headers?: Record<string, string>;
}

/** Options for file download. */
export interface DownloadOptions extends RequestOptions {
  /** Optional filename for the downloaded file. */
  filename?: string;
}

/** Signed URL response from backend. */
export interface SignedUrlResponse {
  /** Pre-signed URL for upload. */
  uploadUrl: string;
  /** Public URL after upload completes. */
  publicUrl: string;
  /** Storage key. */
  key: string;
  /** URL expiration timestamp. */
  expiresAt: number;
}

/**
 * FileService provides methods for file upload and download operations.
 * Supports both direct uploads and S3 pre-signed URL uploads.
 */
export const FileService = {
  /**
   * Uploads a file to the server.
   * @param file - The file to upload.
   * @param endpoint - The upload endpoint (default: '/api/v1/files/upload').
   * @param options - Upload options including progress callback.
   * @returns Promise resolving to the upload response.
   */
  async upload(
    file: File,
    endpoint = '/api/v1/files/upload',
    options?: UploadOptions
  ): Promise<ApiResponse<FileUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    // Add any additional fields
    if (options?.additionalFields) {
      for (const [key, value] of Object.entries(options.additionalFields)) {
        formData.append(key, value);
      }
    }

    // Add file metadata
    const metadata = extractFileMetadata(file);
    formData.append('metadata', JSON.stringify(metadata));

    const config: RequestOptions & { headers: Record<string, string>; onUploadProgress?: (event: AxiosProgressEvent) => void } = {
      ...options,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...options?.headers,
      },
    };

    // Add progress tracking if callback provided
    if (options?.onProgress) {
      config.onUploadProgress = (event: AxiosProgressEvent) => {
        const progress = calculateUploadProgress(event.loaded, event.total ?? 0);
        options.onProgress!(progress);
      };
    }

    return ApiService.post<FileUploadResponse>(endpoint, formData, config);
  },

  /**
   * Uploads multiple files.
   * @param files - Array of files to upload.
   * @param endpoint - The upload endpoint.
   * @param options - Upload options.
   * @returns Promise resolving to array of upload responses.
   */
  async uploadMultiple(
    files: File[],
    endpoint = '/api/v1/files/upload',
    options?: UploadOptions
  ): Promise<ApiResponse<FileUploadResponse>[]> {
    const uploads = files.map((file) => this.upload(file, endpoint, options));
    return Promise.all(uploads);
  },

  /**
   * Gets a pre-signed URL for direct S3 upload.
   * @param filename - The desired filename.
   * @param contentType - The file MIME type.
   * @returns Promise resolving to signed URL details.
   */
  async getSignedUploadUrl(
    filename: string,
    contentType: string
  ): Promise<ApiResponse<SignedUrlResponse>> {
    return ApiService.post<SignedUrlResponse>('/api/v1/files/signed-url', {
      filename,
      contentType,
    });
  },

  /**
   * Uploads a file directly to S3 using a pre-signed URL.
   * @param file - The file to upload.
   * @param signedUrl - The pre-signed S3 URL.
   * @param onProgress - Optional progress callback.
   * @returns Promise resolving when upload is complete.
   */
  async uploadToS3(
    file: File,
    signedUrl: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = calculateUploadProgress(event.loaded, event.total);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed due to network error'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was aborted'));
      });

      xhr.open('PUT', signedUrl, true);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  },

  /**
   * Downloads a file from the server.
   * @param fileId - The file ID to download.
   * @param options - Download options.
   * @returns Promise resolving to the file blob.
   */
  async download(
    fileId: string,
    options?: DownloadOptions
  ): Promise<ApiResponse<Blob>> {
    const response = await ApiService.get<Blob>(`/api/v1/files/${fileId}/download`, {
      ...options,
      responseType: 'blob',
    });

    // Trigger browser download if filename provided
    if (options?.filename) {
      this.triggerDownload(response.data, options.filename);
    }

    return response;
  },

  /**
   * Gets file metadata without downloading the file.
   * @param fileId - The file ID.
   * @returns Promise resolving to file metadata.
   */
  async getMetadata(
    fileId: string
  ): Promise<ApiResponse<FileMetadata & { id: string; url: string }>> {
    return ApiService.get<FileMetadata & { id: string; url: string }>(
      `/api/v1/files/${fileId}`
    );
  },

  /**
   * Deletes a file from the server.
   * @param fileId - The file ID to delete.
   * @returns Promise resolving when deletion is complete.
   */
  async delete(fileId: string): Promise<ApiResponse<void>> {
    return ApiService.delete<void>(`/api/v1/files/${fileId}`);
  },

  /**
   * Triggers a browser download for a blob.
   * @param blob - The file blob.
   * @param filename - The filename for the download.
   */
  triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
