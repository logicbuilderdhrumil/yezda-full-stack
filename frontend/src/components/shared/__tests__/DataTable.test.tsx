/**
 * DataTable component tests.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, type ColumnDef } from '../DataTable';

interface TestData {
  id: string;
  name: string;
  email: string;
  age: number;
}

const testData: TestData[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com', age: 30 },
  { id: '2', name: 'Bob', email: 'bob@example.com', age: 25 },
  { id: '3', name: 'Charlie', email: 'charlie@example.com', age: 35 },
];

const columns: ColumnDef<TestData>[] = [
  { id: 'name', header: 'Name', accessor: (row) => row.name, sortable: true, filterable: true },
  { id: 'email', header: 'Email', accessor: (row) => row.email, filterable: true },
  { id: 'age', header: 'Age', accessor: (row) => row.age, sortable: true },
];

describe('DataTable', () => {
  it('renders table with data', () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        getRowId={(row) => row.id}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        getRowId={(row) => row.id}
      />
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        getRowId={(row) => row.id}
        emptyContent="No users found"
      />
    );

    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        getRowId={(row) => row.id}
        loading
      />
    );

    // Loading spinner should be present
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('handles row selection', () => {
    const onSelectionChange = vi.fn();
    render(
      <DataTable
        data={testData}
        columns={columns}
        getRowId={(row) => row.id}
        selectable
        onSelectionChange={onSelectionChange}
      />
    );

    // Find the first row checkbox (not the header)
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(1);
    
    // Click the second checkbox (first data row)
    const checkbox = checkboxes[1];
    if (checkbox) fireEvent.click(checkbox);
    expect(onSelectionChange).toHaveBeenCalled();
  });

  it('handles sorting', () => {
    const onSortChange = vi.fn();
    render(
      <DataTable
        data={testData}
        columns={columns}
        getRowId={(row) => row.id}
        onSortChange={onSortChange}
      />
    );

    // Click on sortable column header
    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);
    
    expect(onSortChange).toHaveBeenCalledWith({
      columnId: 'name',
      direction: 'asc',
    });
  });

  it('shows search input when searchable', () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        getRowId={(row) => row.id}
        searchable
        searchPlaceholder="Search users..."
      />
    );

    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
  });

  it('filters data based on search', () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        getRowId={(row) => row.id}
        searchable
      />
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'alice' } });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('shows pagination when enabled', () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        getRowId={(row) => row.id}
        paginated
        pageSize={2}
      />
    );

    // Should show pagination controls
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });

  it('handles row click', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        data={testData}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={onRowClick}
      />
    );

    const row = screen.getByText('Alice').closest('tr');
    if (row) fireEvent.click(row);

    expect(onRowClick).toHaveBeenCalledWith(testData[0]);
  });

  it('shows column visibility toggle', () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        getRowId={(row) => row.id}
        showColumnVisibility
      />
    );

    expect(screen.getByRole('button', { name: /columns/i })).toBeInTheDocument();
  });
});
