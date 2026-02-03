/**
 * Design tokens and shared variant definitions for UI components.
 */
import { cva, type VariantProps } from 'class-variance-authority';

// ============================================================================
// FOCUS RING TOKENS
// ============================================================================
export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

export const focusRingInput =
  'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

// ============================================================================
// BUTTON VARIANTS
// ============================================================================
export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'whitespace-nowrap rounded-md text-sm font-medium',
    'transition-colors duration-150',
    'disabled:pointer-events-none disabled:opacity-50',
    focusRing,
  ],
  {
    variants: {
      variant: {
        default:
          'bg-primary text-white hover:bg-primary-hover shadow-sm',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 shadow-sm',
        outline:
          'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
        secondary:
          'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
        ghost:
          'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

// ============================================================================
// BADGE VARIANTS
// ============================================================================
export const badgeVariants = cva(
  [
    'inline-flex items-center rounded-full px-2.5 py-0.5',
    'text-xs font-medium',
    'transition-colors',
  ],
  {
    variants: {
      variant: {
        default: 'bg-primary text-white',
        secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        destructive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        outline: 'border border-current bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

// ============================================================================
// INPUT VARIANTS
// ============================================================================
export const inputVariants = cva(
  [
    'flex w-full rounded-md border bg-white px-3 py-2 text-sm',
    'placeholder:text-gray-400',
    'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50',
    'dark:bg-gray-900 dark:placeholder:text-gray-500',
    focusRingInput,
  ],
  {
    variants: {
      variant: {
        default: 'border-gray-300 dark:border-gray-600',
        error: 'border-red-500 text-red-900 placeholder:text-red-400',
      },
      inputSize: {
        default: 'h-10',
        sm: 'h-8 text-xs',
        lg: 'h-12 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export type InputVariants = VariantProps<typeof inputVariants>;

// ============================================================================
// STATUS INDICATOR VARIANTS
// ============================================================================
export const statusVariants = cva('inline-block rounded-full', {
  variants: {
    status: {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      busy: 'bg-red-500',
      away: 'bg-yellow-500',
    },
    size: {
      sm: 'h-2 w-2',
      md: 'h-3 w-3',
      lg: 'h-4 w-4',
    },
  },
  defaultVariants: {
    status: 'offline',
    size: 'md',
  },
});

export type StatusVariants = VariantProps<typeof statusVariants>;
