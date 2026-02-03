import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AxiosError, AxiosResponse } from 'axios';
import {
  extractApiError,
  isApiError,
  handleApiError,
  ErrorCodes,
  type ApiError,
} from '@/utils/errorHandler';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isApiError', () => {
    it('returns true for valid ApiError objects', () => {
      const error: ApiError = { code: 'TEST', message: 'Test message' };
      expect(isApiError(error)).toBe(true);
    });

    it('returns true for ApiError with optional fields', () => {
      const error: ApiError = {
        code: 'TEST',
        message: 'Test',
        field: 'email',
        status: 400,
      };
      expect(isApiError(error)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isApiError(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isApiError(undefined)).toBe(false);
    });

    it('returns false for primitives', () => {
      expect(isApiError('string')).toBe(false);
      expect(isApiError(123)).toBe(false);
      expect(isApiError(true)).toBe(false);
    });

    it('returns false for objects missing code', () => {
      expect(isApiError({ message: 'Test' })).toBe(false);
    });

    it('returns false for objects missing message', () => {
      expect(isApiError({ code: 'TEST' })).toBe(false);
    });

    it('returns false for objects with non-string code', () => {
      expect(isApiError({ code: 123, message: 'Test' })).toBe(false);
    });
  });

  describe('extractApiError', () => {
    it('returns ApiError as-is', () => {
      const error: ApiError = { code: 'TEST', message: 'Test message' };
      expect(extractApiError(error)).toEqual(error);
    });

    it('extracts error from Axios network error', () => {
      const axiosError = createAxiosError({});

      const result = extractApiError(axiosError);

      expect(result.code).toBe(ErrorCodes.NETWORK_ERROR);
      expect(result.message).toContain('connect');
    });

    it('extracts error from Axios timeout error', () => {
      const axiosError = createAxiosError({
        code: 'ECONNABORTED',
      });

      const result = extractApiError(axiosError);

      expect(result.code).toBe(ErrorCodes.TIMEOUT_ERROR);
      expect(result.message).toContain('timed out');
    });

    it('extracts error from 401 response', () => {
      const axiosError = createAxiosError({
        response: { status: 401, data: {} },
      });

      const result = extractApiError(axiosError);

      expect(result.code).toBe(ErrorCodes.UNAUTHORIZED);
      expect(result.status).toBe(401);
    });

    it('extracts error from 403 response', () => {
      const axiosError = createAxiosError({
        response: { status: 403, data: {} },
      });

      const result = extractApiError(axiosError);

      expect(result.code).toBe(ErrorCodes.FORBIDDEN);
      expect(result.status).toBe(403);
    });

    it('extracts error from 404 response', () => {
      const axiosError = createAxiosError({
        response: { status: 404, data: {} },
      });

      const result = extractApiError(axiosError);

      expect(result.code).toBe(ErrorCodes.NOT_FOUND);
      expect(result.status).toBe(404);
    });

    it('extracts error from 400 response', () => {
      const axiosError = createAxiosError({
        response: { status: 400, data: {} },
      });

      const result = extractApiError(axiosError);

      expect(result.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(result.status).toBe(400);
    });

    it('extracts error from 422 response', () => {
      const axiosError = createAxiosError({
        response: { status: 422, data: {} },
      });

      const result = extractApiError(axiosError);

      expect(result.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(result.status).toBe(422);
    });

    it('extracts error from 500 response', () => {
      const axiosError = createAxiosError({
        response: { status: 500, data: {} },
      });

      const result = extractApiError(axiosError);

      expect(result.code).toBe(ErrorCodes.SERVER_ERROR);
      expect(result.status).toBe(500);
    });

    it('uses server-provided error details', () => {
      const axiosError = createAxiosError({
        response: {
          status: 400,
          data: {
            code: 'CUSTOM_ERROR',
            message: 'Custom error message',
            field: 'email',
          },
        },
      });

      const result = extractApiError(axiosError);

      expect(result.code).toBe('CUSTOM_ERROR');
      expect(result.message).toBe('Custom error message');
      expect(result.field).toBe('email');
      expect(result.status).toBe(400);
    });

    it('extracts message from standard Error', () => {
      const error = new Error('Standard error');

      const result = extractApiError(error);

      expect(result.code).toBe(ErrorCodes.UNKNOWN_ERROR);
      expect(result.message).toBe('Standard error');
    });

    it('handles unknown error types', () => {
      const result = extractApiError('string error');

      expect(result.code).toBe(ErrorCodes.UNKNOWN_ERROR);
      expect(result.message).toContain('unexpected');
    });
  });

  describe('handleApiError', () => {
    it('extracts and returns ApiError', () => {
      const error = new Error('Test');

      const result = handleApiError(error, { silent: true });

      expect(result.code).toBe(ErrorCodes.UNKNOWN_ERROR);
      expect(result.message).toBe('Test');
    });

    it('shows toast by default', async () => {
      const toast = await import('react-hot-toast');
      const error = new Error('Display this');

      handleApiError(error);

      expect(toast.default.error).toHaveBeenCalledWith('Display this', expect.any(Object));
    });

    it('skips toast when silent', async () => {
      const toast = await import('react-hot-toast');
      const error = new Error('Silent error');

      handleApiError(error, { silent: true });

      expect(toast.default.error).not.toHaveBeenCalled();
    });

    it('calls onError callback', () => {
      const onError = vi.fn();
      const error = new Error('Callback test');

      handleApiError(error, { silent: true, onError });

      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        code: ErrorCodes.UNKNOWN_ERROR,
        message: 'Callback test',
      }));
    });
  });
});

// Helper to create mock AxiosError
function createAxiosError(options: {
  response?: { status: number; data: unknown };
  code?: string;
}): AxiosError {
  const error = {
    isAxiosError: true,
    response: options.response
      ? ({
          status: options.response.status,
          data: options.response.data,
        } as AxiosResponse)
      : undefined,
    code: options.code,
    message: 'Request failed',
    config: {},
    toJSON: () => ({}),
  } as AxiosError;

  return error;
}
