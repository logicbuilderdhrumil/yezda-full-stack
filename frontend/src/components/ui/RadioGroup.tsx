/**
 * RadioGroup component using Radix.
 */
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/utils';
import { focusRing } from './variants';

// ============================================================================
// RADIO GROUP ROOT
// ============================================================================

export interface RadioGroupProps extends ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  /** Layout direction. */
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Radio group container.
 */
export const RadioGroup = forwardRef<ElementRef<typeof RadioGroupPrimitive.Root>, RadioGroupProps>(
  ({ className, orientation = 'vertical', ...props }, ref) => {
    return (
      <RadioGroupPrimitive.Root
        ref={ref}
        className={cn(
          'flex gap-3',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
          className
        )}
        {...props}
      />
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

// ============================================================================
// RADIO GROUP ITEM
// ============================================================================

export interface RadioGroupItemProps
  extends ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  /** Label for the radio item. */
  label?: string;
}

/**
 * Single radio option within a RadioGroup.
 */
export const RadioGroupItem = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, label, id, value, ...props }, ref) => {
  const itemId = id ?? `radio-${value}`;

  const radio = (
    <RadioGroupPrimitive.Item
      ref={ref}
      id={itemId}
      value={value}
      className={cn(
        'h-5 w-5 shrink-0 rounded-full border border-gray-300 bg-white',
        'data-[state=checked]:border-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'dark:border-gray-600 dark:bg-gray-800',
        focusRing,
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );

  if (label) {
    return (
      <div className="flex items-center gap-2">
        {radio}
        <label
          htmlFor={itemId}
          className="text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          {label}
        </label>
      </div>
    );
  }

  return radio;
});

RadioGroupItem.displayName = 'RadioGroupItem';
