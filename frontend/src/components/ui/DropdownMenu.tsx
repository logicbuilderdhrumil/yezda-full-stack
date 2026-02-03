/**
 * Dropdown menu component using Radix.
 */
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';
import { cn } from '@/utils';

// ============================================================================
// DROPDOWN MENU ROOT
// ============================================================================

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

// ============================================================================
// DROPDOWN MENU CONTENT
// ============================================================================

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow-md',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
        'dark:border-gray-700 dark:bg-gray-800',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));

DropdownMenuContent.displayName = 'DropdownMenuContent';

// ============================================================================
// DROPDOWN MENU ITEM
// ============================================================================

export interface DropdownMenuItemProps
  extends ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  /** Destructive style. */
  destructive?: boolean;
}

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(({ className, destructive, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
      'focus:bg-gray-100 focus:text-gray-900',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      'dark:focus:bg-gray-700 dark:focus:text-gray-100',
      destructive && 'text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-900/20',
      className
    )}
    {...props}
  />
));

DropdownMenuItem.displayName = 'DropdownMenuItem';

// ============================================================================
// DROPDOWN MENU CHECKBOX ITEM
// ============================================================================

export const DropdownMenuCheckboxItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    checked={checked ?? false}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
      'focus:bg-gray-100 focus:text-gray-900',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      'dark:focus:bg-gray-700 dark:focus:text-gray-100',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));

DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

// ============================================================================
// DROPDOWN MENU RADIO ITEM
// ============================================================================

export const DropdownMenuRadioItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
      'focus:bg-gray-100 focus:text-gray-900',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      'dark:focus:bg-gray-700 dark:focus:text-gray-100',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <div className="h-2 w-2 rounded-full bg-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));

DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

// ============================================================================
// DROPDOWN MENU LABEL
// ============================================================================

export const DropdownMenuLabel = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Label>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-sm font-semibold text-gray-500', className)}
    {...props}
  />
));

DropdownMenuLabel.displayName = 'DropdownMenuLabel';

// ============================================================================
// DROPDOWN MENU SEPARATOR
// ============================================================================

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-gray-200 dark:bg-gray-700', className)}
    {...props}
  />
));

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

// ============================================================================
// DROPDOWN MENU SHORTCUT
// ============================================================================

export function DropdownMenuShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>): ReactNode {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest text-gray-400', className)}
      {...props}
    />
  );
}
