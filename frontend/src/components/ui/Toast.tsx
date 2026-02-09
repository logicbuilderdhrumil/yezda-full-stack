/**
 * Toast/notification component wrapping react-hot-toast.
 */
import { type ReactNode, createElement } from 'react';
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
          'bg-background text-foreground',
          'border border-border shadow-[var(--shadow-lg)]',
          'font-[var(--font-family)]'
        ),
        success: {
          iconTheme: {
            primary: '#16a34a',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#dc2626',
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
 * Inline SVG icon for info toast.
 */
function InfoIcon(): ReactNode {
  return createElement('svg', {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: '#0369A1',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    children: [
      createElement('circle', { key: 'c', cx: 12, cy: 12, r: 10 }),
      createElement('path', { key: 'p1', d: 'M12 16v-4' }),
      createElement('path', { key: 'p2', d: 'M12 8h.01' }),
    ],
  });
}

/**
 * Inline SVG icon for warning toast.
 */
function WarningIcon(): ReactNode {
  return createElement('svg', {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: '#ca8a04',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    children: [
      createElement('path', { key: 'p1', d: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' }),
      createElement('path', { key: 'p2', d: 'M12 9v4' }),
      createElement('path', { key: 'p3', d: 'M12 17h.01' }),
    ],
  });
}

/**
 * Show an info toast.
 */
export function toastInfo(message: string, options?: ToastOptions): string {
  const toastOptions: { duration?: number; id?: string; icon: ReactNode } = { icon: InfoIcon() };
  if (options?.duration !== undefined) toastOptions.duration = options.duration;
  if (options?.id !== undefined) toastOptions.id = options.id;
  return toast(message, toastOptions);
}

/**
 * Show a warning toast.
 */
export function toastWarning(message: string, options?: ToastOptions): string {
  const toastOptions: { duration: number; id?: string; icon: ReactNode } = { duration: options?.duration ?? 5000, icon: WarningIcon() };
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
