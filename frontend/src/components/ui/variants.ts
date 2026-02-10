/**
 * Design tokens and shared variant definitions for UI components.
 */
import { cva, type VariantProps } from 'class-variance-authority';

// ============================================================================
// FOCUS RING TOKENS
// ============================================================================
export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta';

export const focusRingInput =
  'focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 focus-visible:border-primary';

// ============================================================================
// BUTTON VARIANTS
// ============================================================================
export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'whitespace-nowrap rounded-lg text-sm font-semibold',
    'transition-all duration-200 ease-in-out cursor-pointer',
    'disabled:pointer-events-none disabled:opacity-50',
    focusRing,
  ],
  {
    variants: {
      variant: {
        default:
          'bg-cta text-white hover:bg-cta-hover hover:translate-y-[-1px] shadow-sm',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 shadow-sm',
        outline:
          'border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-white dark:border-primary dark:text-primary dark:hover:bg-primary dark:hover:text-background',
        secondary:
          'bg-muted text-secondary hover:bg-muted/80 dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted/80',
        ghost:
          'text-secondary hover:bg-muted dark:text-muted-foreground dark:hover:bg-muted',
        link: 'text-cta underline-offset-4 hover:underline',
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
    'transition-colors duration-200',
  ],
  {
    variants: {
      variant: {
        default: 'bg-cta text-white',
        secondary: 'bg-muted text-secondary dark:bg-muted dark:text-muted-foreground',
        success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        destructive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        outline: 'border border-current bg-transparent',
        pulse: 'bg-cta text-white animate-pulse',
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
    'flex w-full rounded-lg border bg-white px-3 py-2 text-sm',
    'placeholder:text-muted-foreground',
    'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50',
    'dark:bg-background dark:placeholder:text-muted-foreground',
    'transition-[border-color,box-shadow] duration-200 ease-in-out',
    focusRingInput,
  ],
  {
    variants: {
      variant: {
        default: 'border-border dark:border-border',
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
