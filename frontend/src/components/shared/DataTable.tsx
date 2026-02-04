/**
 * DataTable component - A feature-rich data table with sorting, filtering,
 * column visibility, row selection, bulk actions, and pagination.
 */
import {
  type ReactNode,
  type HTMLAttributes,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { cn } from '@/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Pagination,
  PaginationInfo,
} from '@/components/ui';

// ============================================================================
// TYPES
// ============================================================================

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T> {
  /** Unique column identifier. */
  id: string;
  /** Column header label. */
  header: string;
  /** Accessor function to get cell value. */
  accessor: (row: T) => ReactNode;
  /** Enable sorting for this column. */
  sortable?: boolean;
  /** Custom sort function. */
  sortFn?: (a: T, b: T) => number;
  /** Enable filtering for this column. */
  filterable?: boolean;
  /** Column width (CSS value). */
  width?: string;
  /** Whether column is visible by default. */
  defaultVisible?: boolean;
  /** Cell alignment. */
  align?: 'left' | 'center' | 'right';
}

export interface SortState {
  columnId: string | null;
  direction: SortDirection;
}

export interface DataTableProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Data rows. */
  data: T[];
  /** Column definitions. */
  columns: ColumnDef<T>[];
  /** Unique row key accessor. */
  getRowId: (row: T) => string;
  /** Enable row selection. */
  selectable?: boolean;
  /** Selected row IDs (controlled). */
  selectedIds?: Set<string>;
  /** Selection change handler. */
  onSelectionChange?: (selectedIds: Set<string>) => void;
  /** Enable column visibility toggle. */
  showColumnVisibility?: boolean;
  /** Enable search/filter input. */
  searchable?: boolean;
  /** Search placeholder. */
  searchPlaceholder?: string;
  /** External search value (controlled). */
  searchValue?: string;
  /** Search change handler. */
  onSearchChange?: (value: string) => void;
  /** Enable pagination. */
  paginated?: boolean;
  /** Items per page. */
  pageSize?: number;
  /** Page size options. */
  pageSizeOptions?: number[];
  /** Current page (1-indexed, controlled). */
  page?: number;
  /** Page change handler. */
  onPageChange?: (page: number) => void;
  /** Page size change handler. */
  onPageSizeChange?: (size: number) => void;
  /** Current sort state (controlled). */
  sortState?: SortState;
  /** Sort change handler. */
  onSortChange?: (state: SortState) => void;
  /** Bulk actions to show when rows selected. */
  bulkActions?: ReactNode;
  /** Loading state. */
  loading?: boolean;
  /** Empty state content. */
  emptyContent?: ReactNode;
  /** Row click handler. */
  onRowClick?: (row: T) => void;
}

// ============================================================================
// UTILITIES
// ============================================================================

function defaultSort<T>(a: T, b: T, accessor: (row: T) => ReactNode): number {
  const valA = accessor(a);
  const valB = accessor(b);

  if (valA === valB) return 0;
  if (valA === null || valA === undefined) return 1;
  if (valB === null || valB === undefined) return -1;

  const strA = String(valA).toLowerCase();
  const strB = String(valB).toLowerCase();

  return strA < strB ? -1 : 1;
}

// ============================================================================
// DATATABLE COMPONENT
// ============================================================================

export function DataTable<T>({
  data,
  columns,
  getRowId,
  selectable = false,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  showColumnVisibility = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  searchValue: controlledSearchValue,
  onSearchChange,
  paginated = false,
  pageSize: controlledPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  page: controlledPage,
  onPageChange,
  onPageSizeChange,
  sortState: controlledSortState,
  onSortChange,
  bulkActions,
  loading = false,
  emptyContent,
  onRowClick,
  className,
  ...props
}: DataTableProps<T>): ReactNode {
  // -------------------------------------------------------------------------
  // Internal state (uncontrolled mode)
  // -------------------------------------------------------------------------
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());
  const [internalSearchValue, setInternalSearchValue] = useState('');
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(controlledPageSize);
  const [internalSortState, setInternalSortState] = useState<SortState>({
    columnId: null,
    direction: null,
  });
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const visibility: Record<string, boolean> = {};
    columns.forEach((col) => {
      visibility[col.id] = col.defaultVisible !== false;
    });
    return visibility;
  });

  // -------------------------------------------------------------------------
  // Controlled vs uncontrolled
  // -------------------------------------------------------------------------
  const selectedIds = controlledSelectedIds ?? internalSelectedIds;
  const searchValue = controlledSearchValue ?? internalSearchValue;
  const page = controlledPage ?? internalPage;
  const pageSize = controlledPageSize ?? internalPageSize;
  const sortState = controlledSortState ?? internalSortState;

  const setSelectedIds = useCallback(
    (ids: Set<string>) => {
      if (onSelectionChange) {
        onSelectionChange(ids);
      } else {
        setInternalSelectedIds(ids);
      }
    },
    [onSelectionChange]
  );

  const setSearchValue = useCallback(
    (value: string) => {
      if (onSearchChange) {
        onSearchChange(value);
      } else {
        setInternalSearchValue(value);
      }
    },
    [onSearchChange]
  );

  const setPage = useCallback(
    (p: number) => {
      if (onPageChange) {
        onPageChange(p);
      } else {
        setInternalPage(p);
      }
    },
    [onPageChange]
  );

  const setPageSize = useCallback(
    (size: number) => {
      if (onPageSizeChange) {
        onPageSizeChange(size);
      } else {
        setInternalPageSize(size);
      }
      // Reset to first page when page size changes
      setPage(1);
    },
    [onPageSizeChange, setPage]
  );

  const setSortState = useCallback(
    (state: SortState) => {
      if (onSortChange) {
        onSortChange(state);
      } else {
        setInternalSortState(state);
      }
    },
    [onSortChange]
  );

  // -------------------------------------------------------------------------
  // Visible columns
  // -------------------------------------------------------------------------
  const visibleColumns = useMemo(
    () => columns.filter((col) => columnVisibility[col.id]),
    [columns, columnVisibility]
  );

  // -------------------------------------------------------------------------
  // Filtered data
  // -------------------------------------------------------------------------
  const filteredData = useMemo(() => {
    if (!searchValue.trim()) return data;

    const lowerSearch = searchValue.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        if (!col.filterable) return false;
        const value = col.accessor(row);
        return String(value).toLowerCase().includes(lowerSearch);
      })
    );
  }, [data, columns, searchValue]);

  // -------------------------------------------------------------------------
  // Sorted data
  // -------------------------------------------------------------------------
  const sortedData = useMemo(() => {
    if (!sortState.columnId || !sortState.direction) return filteredData;

    const column = columns.find((c) => c.id === sortState.columnId);
    if (!column) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const result = column.sortFn
        ? column.sortFn(a, b)
        : defaultSort(a, b, column.accessor);
      return sortState.direction === 'desc' ? -result : result;
    });

    return sorted;
  }, [filteredData, columns, sortState]);

  // -------------------------------------------------------------------------
  // Paginated data
  // -------------------------------------------------------------------------
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, paginated, page, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // -------------------------------------------------------------------------
  // Selection handlers
  // -------------------------------------------------------------------------
  const allSelected =
    paginatedData.length > 0 && paginatedData.every((row) => selectedIds.has(getRowId(row)));
  const someSelected =
    paginatedData.some((row) => selectedIds.has(getRowId(row))) && !allSelected;

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      // Deselect all on current page
      const newSelection = new Set(selectedIds);
      paginatedData.forEach((row) => newSelection.delete(getRowId(row)));
      setSelectedIds(newSelection);
    } else {
      // Select all on current page
      const newSelection = new Set(selectedIds);
      paginatedData.forEach((row) => newSelection.add(getRowId(row)));
      setSelectedIds(newSelection);
    }
  }, [allSelected, paginatedData, selectedIds, getRowId, setSelectedIds]);

  const handleSelectRow = useCallback(
    (rowId: string, checked: boolean) => {
      const newSelection = new Set(selectedIds);
      if (checked) {
        newSelection.add(rowId);
      } else {
        newSelection.delete(rowId);
      }
      setSelectedIds(newSelection);
    },
    [selectedIds, setSelectedIds]
  );

  // -------------------------------------------------------------------------
  // Sort handler
  // -------------------------------------------------------------------------
  const handleSort = useCallback(
    (columnId: string) => {
      const column = columns.find((c) => c.id === columnId);
      if (!column?.sortable) return;

      let newDirection: SortDirection = 'asc';
      if (sortState.columnId === columnId) {
        if (sortState.direction === 'asc') newDirection = 'desc';
        else if (sortState.direction === 'desc') newDirection = null;
      }

      setSortState({
        columnId: newDirection ? columnId : null,
        direction: newDirection,
      });
    },
    [columns, sortState, setSortState]
  );

  // -------------------------------------------------------------------------
  // Column visibility toggle
  // -------------------------------------------------------------------------
  const handleColumnVisibilityChange = useCallback((columnId: string, visible: boolean) => {
    setColumnVisibility((prev) => ({ ...prev, [columnId]: visible }));
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {searchable && (
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-64"
            />
          )}
          {selectedIds.size > 0 && bulkActions && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm text-gray-500">{selectedIds.size} selected</span>
              {bulkActions}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={columnVisibility[column.id] ?? false}
                    onCheckedChange={(checked) =>
                      handleColumnVisibilityChange(column.id, !!checked)
                    }
                  >
                    {column.header}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected || (someSelected ? 'indeterminate' : false)}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all rows"
                  />
                </TableHead>
              )}
              {visibleColumns.map((column) => (
                <TableHead
                  key={column.id}
                  style={{ width: column.width }}
                  className={cn(
                    column.sortable && 'cursor-pointer select-none',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right'
                  )}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div
                    className={cn(
                      'flex items-center gap-1',
                      column.align === 'center' && 'justify-center',
                      column.align === 'right' && 'justify-end'
                    )}
                  >
                    {column.header}
                    {column.sortable && sortState.columnId === column.id && (
                      <span className="text-gray-400">
                        {sortState.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                  className="h-24 text-center text-gray-500"
                >
                  {emptyContent ?? 'No data available'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => {
                const rowId = getRowId(row);
                const isSelected = selectedIds.has(rowId);

                return (
                  <TableRow
                    key={rowId}
                    data-state={isSelected ? 'selected' : undefined}
                    className={cn(onRowClick && 'cursor-pointer')}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleSelectRow(rowId, checked as boolean)
                          }
                          aria-label={`Select row ${rowId}`}
                        />
                      </TableCell>
                    )}
                    {visibleColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        className={cn(
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {column.accessor(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer / Pagination */}
      {paginated && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <PaginationInfo
              page={page}
              pageSize={pageSize}
              totalItems={sortedData.length}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
