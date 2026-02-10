/**
 * Table components.
 */
import { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from 'react';
import { cn } from '@/utils';

// ============================================================================
// TABLE
// ============================================================================

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
);

Table.displayName = 'Table';

// ============================================================================
// TABLE HEADER
// ============================================================================

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      'bg-primary/5 dark:bg-primary/10 [&_tr]:border-b [&_tr]:border-border',
      className
    )}
    {...props}
  />
));

TableHeader.displayName = 'TableHeader';

// ============================================================================
// TABLE BODY
// ============================================================================

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      '[&_tr:last-child]:border-0 [&_tr:nth-child(even)]:bg-muted/50',
      className
    )}
    {...props}
  />
));

TableBody.displayName = 'TableBody';

// ============================================================================
// TABLE FOOTER
// ============================================================================

export const TableFooter = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-t bg-muted/50 font-medium dark:bg-muted/50', className)}
    {...props}
  />
));

TableFooter.displayName = 'TableFooter';

// ============================================================================
// TABLE ROW
// ============================================================================

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-border transition-colors duration-200',
        'hover:bg-cta/5 dark:border-border dark:hover:bg-cta/10',
        'data-[state=selected]:bg-cta/10 dark:data-[state=selected]:bg-cta/20',
        className
      )}
      {...props}
    />
  )
);

TableRow.displayName = 'TableRow';

// ============================================================================
// TABLE HEAD CELL
// ============================================================================

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-secondary',
        '[&:has([role=checkbox])]:pr-0',
        'dark:text-muted-foreground',
        className
      )}
      {...props}
    />
  )
);

TableHead.displayName = 'TableHead';

// ============================================================================
// TABLE CELL
// ============================================================================

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  )
);

TableCell.displayName = 'TableCell';

// ============================================================================
// TABLE CAPTION
// ============================================================================

export const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
));

TableCaption.displayName = 'TableCaption';
