/**
 * Input, Textarea, and InputGroup components.
 */
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils';
import { inputVariants, type InputVariants } from './variants';

// ============================================================================
// INPUT
// ============================================================================

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    InputVariants {}

/**
 * Text input component.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(inputVariants({ variant, inputSize }), className)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

// ============================================================================
// TEXTAREA
// ============================================================================

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    Omit<InputVariants, 'inputSize'> {
  /** Minimum rows. */
  minRows?: number;
}

/**
 * Textarea component.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, minRows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={minRows}
        className={cn(
          inputVariants({ variant }),
          'min-h-[80px] resize-y',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

// ============================================================================
// INPUT GROUP
// ============================================================================

export interface InputGroupProps {
  children: ReactNode;
  /** Left addon element. */
  leftAddon?: ReactNode;
  /** Right addon element. */
  rightAddon?: ReactNode;
  /** Left inline element (icon inside input). */
  leftElement?: ReactNode;
  /** Right inline element (icon inside input). */
  rightElement?: ReactNode;
  className?: string;
}

/**
 * Input group with addons and inline elements.
 */
export function InputGroup({
  children,
  leftAddon,
  rightAddon,
  leftElement,
  rightElement,
  className,
}: InputGroupProps): ReactNode {
  const hasAddons = leftAddon || rightAddon;
  const hasElements = leftElement || rightElement;

  if (!hasAddons && !hasElements) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('flex', className)}>
      {leftAddon && (
        <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {leftAddon}
        </span>
      )}
      <div className="relative flex-1">
        {leftElement && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            {leftElement}
          </div>
        )}
        <div
          className={cn(
            leftAddon && '[&>input]:rounded-l-none [&>input]:border-l-0',
            rightAddon && '[&>input]:rounded-r-none [&>input]:border-r-0',
            leftElement && '[&>input]:pl-10',
            rightElement && '[&>input]:pr-10'
          )}
        >
          {children}
        </div>
        {rightElement && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
            {rightElement}
          </div>
        )}
      </div>
      {rightAddon && (
        <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {rightAddon}
        </span>
      )}
    </div>
  );
}
