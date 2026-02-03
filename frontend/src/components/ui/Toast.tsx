/**
 * Toast/notification component wrapping react-hot-toast.
 */
import { type ReactNode } from 'react';
import toast, { Toaster as HotToaster, type ToasterProps as HotToasterProps } from 'react-hot-toast';
import { cn } from '@/utils';

// ============================================================================
// TOASTER COMPONENT
// ============================================================================

export interface ToasterProps extends HotToasterProps {}

/**
 * Global toaster component. Place once at app root.
 */
export function Toaster(props: ToasterProps): ReactNode {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: cn(
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
          'border border-gray-200 dark:border-gray-700 shadow-lg'
        ),
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
        },
      }}
      {...props}
    />
  );
}

// ============================================================================
// TOAST FUNCTIONS
// ============================================================================

export interface ToastOptions {
  /** Duration in ms. */
  duration?: number;
  /** Custom ID for deduplication. */
  id?: string;
}

/**
 * Show a success toast.
 */
export function toastSuccess(message: string, options?: ToastOptions): string {
  const toastOptions: { duration?: number; id?: string } = {};
  if (options?.duration !== undefined) toastOptions.duration = options.duration;
  if (options?.id !== undefined) toastOptions.id = options.id;
  return toast.success(message, toastOptions);
}

/**
 * Show an error toast.
 */
export function toastError(message: string, options?: ToastOptions): string {
  const toastOptions: { duration: number; id?: string } = { duration: options?.duration ?? 5000 };
  if (options?.id !== undefined) toastOptions.id = options.id;
  return toast.error(message, toastOptions);
}

/**
 * Show an info toast.
 */
export function toastInfo(message: string, options?: ToastOptions): string {
  const toastOptions: { duration?: number; id?: string; icon: string } = { icon: '💡' };
  if (options?.duration !== undefined) toastOptions.duration = options.duration;
  if (options?.id !== undefined) toastOptions.id = options.id;
  return toast(message, toastOptions);
}

/**
 * Show a warning toast.
 */
export function toastWarning(message: string, options?: ToastOptions): string {
  const toastOptions: { duration: number; id?: string; icon: string } = { duration: options?.duration ?? 5000, icon: '⚠️' };
  if (options?.id !== undefined) toastOptions.id = options.id;
  return toast(message, toastOptions);
}

/**
 * Show a loading toast that can be updated.
 */
export function toastLoading(message: string, options?: ToastOptions): string {
  const toastOptions: { id?: string } = {};
  if (options?.id !== undefined) toastOptions.id = options.id;
  return toast.loading(message, toastOptions);
}

/**
 * Dismiss a toast by ID or all toasts.
 */
export function toastDismiss(toastId?: string): void {
  toast.dismiss(toastId);
}

/**
 * Promise toast for async operations.
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: unknown) => string);
  },
  options?: ToastOptions
): Promise<T> {
  const toastOptions: { id?: string } = {};
  if (options?.id !== undefined) toastOptions.id = options.id;
  return toast.promise(promise, messages, toastOptions);
}

// Re-export toast for advanced usage
export { toast };
