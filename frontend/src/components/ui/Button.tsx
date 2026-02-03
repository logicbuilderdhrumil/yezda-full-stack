/**
 * Button component with variants.
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/utils';
import { buttonVariants, type ButtonVariants } from './variants';

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  /** Render as child element using Radix Slot. */
  asChild?: boolean;
  /** Optional icon to display before children. */
  leftIcon?: ReactNode;
  /** Optional icon to display after children. */
  rightIcon?: ReactNode;
  /** Loading state. */
  isLoading?: boolean;
}

/**
 * Primary button component with multiple variants and sizes.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      leftIcon,
      rightIcon,
      isLoading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

// ============================================================================
// BUTTON GROUP
// ============================================================================

export interface ButtonGroupProps {
  children: ReactNode;
  /** Stack buttons vertically on smaller screens. */
  responsive?: boolean;
  className?: string;
}

/**
 * Groups multiple buttons together with appropriate spacing.
 */
export function ButtonGroup({
  children,
  responsive = false,
  className,
}: ButtonGroupProps): ReactNode {
  return (
    <div
      className={cn(
        'inline-flex gap-2',
        responsive && 'flex-col sm:flex-row',
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
}
