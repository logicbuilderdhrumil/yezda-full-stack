/**
 * Switch component using Radix.
 */
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/utils';
import { focusRing } from './variants';

export interface SwitchProps extends ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  /** Label text. */
  label?: string;
  /** Description text. */
  description?: string;
}

/**
 * Toggle switch component.
 */
export const Switch = forwardRef<ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const switchId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const switchElement = (
      <SwitchPrimitive.Root
        ref={ref}
        id={switchId}
        className={cn(
          'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
          'border-2 border-transparent transition-colors',
          'bg-gray-200 data-[state=checked]:bg-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:bg-gray-700',
          focusRing,
          className
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0',
            'transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
          )}
        />
      </SwitchPrimitive.Root>
    );

    if (label || description) {
      return (
        <div className="flex items-start gap-3">
          {switchElement}
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={switchId}
                className="text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
        </div>
      );
    }

    return switchElement;
  }
);

Switch.displayName = 'Switch';
