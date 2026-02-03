/**
 * Calendar and DatePicker components using react-day-picker.
 */
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { format } from 'date-fns';
import { forwardRef, useState, type ReactNode } from 'react';
import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { cn } from '@/utils';
import { Button } from './Button';

// ============================================================================
// CALENDAR
// ============================================================================

export type CalendarProps = DayPickerProps;

/**
 * Calendar component using react-day-picker.
 */
export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps): ReactNode {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      labels={{
        labelPrevious: () => 'Go to previous month',
        labelNext: () => 'Go to next month',
      }}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        month_caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        button_previous: cn(
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
          'absolute left-1 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700'
        ),
        button_next: cn(
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
          'absolute right-1 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700'
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'text-gray-500 rounded-md w-9 font-normal text-[0.8rem] dark:text-gray-400',
        week: 'flex w-full mt-2',
        day: 'h-9 w-9 text-center text-sm p-0 relative',
        day_button: cn(
          'h-9 w-9 p-0 font-normal rounded-md',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
        ),
        selected: 'bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white',
        today: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
        outside: 'text-gray-400 opacity-50 dark:text-gray-500',
        disabled: 'text-gray-400 opacity-50',
        range_middle: 'aria-selected:bg-gray-100 aria-selected:text-gray-900 dark:aria-selected:bg-gray-800',
        hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  );
}

// ============================================================================
// DATE PICKER
// ============================================================================

export interface DatePickerProps {
  /** Selected date. */
  value?: Date;
  /** Date change handler. */
  onChange?: (date: Date | undefined) => void;
  /** Placeholder text. */
  placeholder?: string;
  /** Date format string. */
  dateFormat?: string;
  /** Disable the picker. */
  disabled?: boolean;
  className?: string;
}

/**
 * Date picker with popover calendar.
 */
export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Pick a date',
      dateFormat = 'PPP',
      disabled,
      className,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);

    const handleSelect = (date: Date | undefined) => {
      onChange?.(date);
      setOpen(false);
    };

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <Button
            ref={ref}
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-gray-400',
              className
            )}
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {value ? format(value, dateFormat) : placeholder}
          </Button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            className={cn(
              'z-50 w-auto rounded-md border border-gray-200 bg-white p-0 shadow-md outline-none',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'dark:border-gray-700 dark:bg-gray-800'
            )}
            align="start"
            sideOffset={4}
          >
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleSelect}
              autoFocus
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  }
);

DatePicker.displayName = 'DatePicker';
