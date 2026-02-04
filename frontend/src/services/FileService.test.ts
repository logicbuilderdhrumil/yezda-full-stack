import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileService } from './FileService';

// Mock ApiService
vi.mock('./ApiService', () => ({
  ApiService: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock URL methods for jsdom environment
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

describe('FileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up URL mocks
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
    URL.createObjectURL = mockCreateObjectURL;
    URL.revokeObjectURL = mockRevokeObjectURL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('upload', () => {
    it('creates FormData with file and metadata', async () => {
      const { ApiService: MockApiService } = await import('./ApiService');
      const mockResponse = {
        data: {
          id: 'file-123',
          url: 'https://example.com/file.pdf',
          metadata: { name: 'test.pdf', size: 1000, type: 'application/pdf', lastModified: Date.now() },
          key: 'uploads/file-123.pdf',
        },
      };
      vi.mocked(MockApiService.post).mockResolvedValue(mockResponse);

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const result = await FileService.upload(file);

      expect(MockApiService.post).toHaveBeenCalledWith(
        '/api/v1/files/upload',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
          }),
        })
      );
      expect(result.data.id).toBe('file-123');
    });

    it('includes additional fields in FormData', async () => {
      const { ApiService: MockApiService } = await import('./ApiService');
      vi.mocked(MockApiService.post).mockResolvedValue({ data: {} });

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      await FileService.upload(file, '/api/v1/files/upload', {
        additionalFields: { category: 'documents', userId: '123' },
      });

      const formDataArg = vi.mocked(MockApiService.post).mock.calls[0][1] as FormData;
      expect(formDataArg.get('category')).toBe('documents');
      expect(formDataArg.get('userId')).toBe('123');
    });

    it('calls onProgress callback during upload', async () => {
      const { ApiService: MockApiService } = await import('./ApiService');
      vi.mocked(MockApiService.post).mockImplementation(async (_url: string, _data: unknown, config?: { onUploadProgress?: (event: ProgressEvent) => void }) => {
        // Simulate progress event
        if (config?.onUploadProgress) {
          config.onUploadProgress({ loaded: 50, total: 100 } as ProgressEvent);
          config.onUploadProgress({ loaded: 100, total: 100 } as ProgressEvent);
        }
        return { data: {} };
      });

      const progressCalls: Array<{ loaded: number; total: number; percentage: number }> = [];
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      await FileService.upload(file, '/api/v1/files/upload', {
        onProgress: (progress) => progressCalls.push(progress),
      });

      expect(progressCalls).toHaveLength(2);
      expect(progressCalls[0]).toEqual({ loaded: 50, total: 100, percentage: 50 });
      expect(progressCalls[1]).toEqual({ loaded: 100, total: 100, percentage: 100 });
    });

    it('uses custom endpoint when provided', async () => {
      const { ApiService: MockApiService } = await import('./ApiService');
      vi.mocked(MockApiService.post).mockResolvedValue({ data: {} });

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      await FileService.upload(file, '/custom/upload');

      expect(MockApiService.post).toHaveBeenCalledWith(
        '/custom/upload',
        expect.any(FormData),
        expect.any(Object)
      );
    });
  });

  describe('uploadMultiple', () => {
    it('uploads multiple files in parallel', async () => {
      const { ApiService: MockApiService } = await import('./ApiService');
      vi.mocked(MockApiService.post).mockResolvedValue({
        data: { id: 'file-123', url: '', metadata: {}, key: '' },
      });

      const files = [
        new File(['a'], 'a.txt', { type: 'text/plain' }),
        new File(['b'], 'b.txt', { type: 'text/plain' }),
        new File(['c'], 'c.txt', { type: 'text/plain' }),
      ];

      const results = await FileService.uploadMultiple(files);

      expect(MockApiService.post).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(3);
    });
  });

  describe('getSignedUploadUrl', () => {
    it('requests signed URL with filename and content type', async () => {
      const { ApiService: MockApiService } = await import('./ApiService');
      const mockResponse = {
        data: {
          uploadUrl: 'https://s3.example.com/signed-url',
          publicUrl: 'https://cdn.example.com/file.pdf',
          key: 'uploads/file.pdf',
          expiresAt: Date.now() + 3600000,
        },
      };
      vi.mocked(MockApiService.post).mockResolvedValue(mockResponse);

      const result = await FileService.getSignedUploadUrl('document.pdf', 'application/pdf');

      expect(MockApiService.post).toHaveBeenCalledWith('/api/v1/files/signed-url', {
        filename: 'document.pdf',
        contentType: 'application/pdf',
      });
      expect(result.data.uploadUrl).toBe('https://s3.example.com/signed-url');
    });
  });

  describe('download', () => {
    it('downloads file with blob response type', async () => {
      const { ApiService: MockApiService } = await import('./ApiService');
      const blob = new Blob(['file content'], { type: 'text/plain' });
      vi.mocked(MockApiService.get).mockResolvedValue({ data: blob });

      const result = await FileService.download('file-123');

      expect(MockApiService.get).toHaveBeenCalledWith(
        '/api/v1/files/file-123/download',
        expect.objectContaining({ responseType: 'blob' })
      );
      expect(result.data).toBe(blob);
    });

    it('triggers browser download when filename provided', async () => {
      const { ApiService: MockApiService } = await import('./ApiService');
      const blob = new Blob(['content'], { type: 'text/plain' });
      vi.mocked(MockApiService.get).mockResolvedValue({ data: blob });

      // Mock DOM APIs
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as Node);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as Node);
      mockCreateObjectURL.mockReturnValue('blob:url');

      await FileService.download('file-123', { filename: 'downloaded.txt' });

      expect(mockLink.download).toBe('downloaded.txt');
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:url');
    });
  });

  describe('getMetadata', () => {
    it('fetches file metadata', async () => {
      const { ApiService: MockApiService } = await import('./ApiService');
      const mockMetadata = {
        id: 'file-123',
        name: 'document.pdf',
        size: 12345,
        type: 'application/pdf',
        lastModified: Date.now(),
        url: 'https://example.com/document.pdf',
      };
      vi.mocked(MockApiService.get).mockResolvedValue({ data: mockMetadata });

      const result = await FileService.getMetadata('file-123');

      expect(MockApiService.get).toHaveBeenCalledWith('/api/v1/files/file-123');
      expect(result.data.name).toBe('document.pdf');
    });
  });

  describe('delete', () => {
    it('deletes file by ID', async () => {
      const { ApiService: MockApiService } = await import('./ApiService');
      vi.mocked(MockApiService.delete).mockResolvedValue({ data: undefined });

      await FileService.delete('file-123');

      expect(MockApiService.delete).toHaveBeenCalledWith('/api/v1/files/file-123');
    });
  });

  describe('triggerDownload', () => {
    it('creates and clicks a download link', () => {
      const blob = new Blob(['content'], { type: 'text/plain' });
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as Node);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as Node);
      mockCreateObjectURL.mockReturnValue('blob:test-url');

      FileService.triggerDownload(blob, 'test-file.txt');

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('test-file.txt');
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });
  });
});
