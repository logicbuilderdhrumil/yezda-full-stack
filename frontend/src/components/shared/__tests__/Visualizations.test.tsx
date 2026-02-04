/**
 * Map and Gantt visualization component tests.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Map, Gantt, type MapMarker, type GanttTask } from '../Visualizations';

const mockMarkers: MapMarker[] = [
  { id: '1', lat: 40.7128, lng: -74.006, label: 'New York' },
  { id: '2', lat: 34.0522, lng: -118.2437, label: 'Los Angeles' },
  { id: '3', lat: 41.8781, lng: -87.6298, label: 'Chicago' },
];

const mockTasks: GanttTask[] = [
  {
    id: '1',
    name: 'Design Phase',
    start: new Date('2026-01-01'),
    end: new Date('2026-01-15'),
    progress: 100,
    color: '#10b981',
  },
  {
    id: '2',
    name: 'Development Phase',
    start: new Date('2026-01-16'),
    end: new Date('2026-02-28'),
    progress: 50,
    color: '#3b82f6',
  },
  {
    id: '3',
    name: 'Testing Phase',
    start: new Date('2026-03-01'),
    end: new Date('2026-03-15'),
    progress: 0,
  },
];

describe('Map', () => {
  it('renders map placeholder', () => {
    render(<Map />);
    expect(screen.getByText('Map Component Placeholder')).toBeInTheDocument();
  });

  it('renders map with title', () => {
    render(<Map title="Office Locations" />);
    expect(screen.getByText('Office Locations')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<Map loading />);
    expect(screen.getByText('Loading map...')).toBeInTheDocument();
  });

  it('shows center coordinates and zoom', () => {
    render(<Map center={{ lat: 40.7128, lng: -74.006 }} zoom={12} />);
    expect(screen.getByText(/40\.7128, -74\.0060/)).toBeInTheDocument();
    expect(screen.getByText(/Zoom: 12/)).toBeInTheDocument();
  });

  it('renders markers with count', () => {
    render(<Map markers={mockMarkers} />);
    expect(screen.getByText('3 marker(s)')).toBeInTheDocument();
  });

  it('renders marker buttons with aria-labels', () => {
    render(<Map markers={mockMarkers} />);
    expect(screen.getByRole('button', { name: 'View marker: New York' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View marker: Los Angeles' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View marker: Chicago' })).toBeInTheDocument();
  });

  it('calls onMarkerClick when marker is clicked', () => {
    const handleClick = vi.fn();
    render(<Map markers={mockMarkers} onMarkerClick={handleClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'View marker: New York' }));
    expect(handleClick).toHaveBeenCalledWith(mockMarkers[0]);
  });

  it('shows +X more when markers exceed 5', () => {
    const manyMarkers: MapMarker[] = Array.from({ length: 8 }, (_, i) => ({
      id: `${i}`,
      lat: i,
      lng: i,
      label: `Marker ${i}`,
    }));
    render(<Map markers={manyMarkers} />);
    expect(screen.getByText('+3 more')).toBeInTheDocument();
  });

  it('renders marker without label using coordinates', () => {
    const markersNoLabel: MapMarker[] = [{ id: '1', lat: 40.71, lng: -74.01 }];
    render(<Map markers={markersNoLabel} />);
    expect(screen.getByRole('button', { name: /Location at 40\.71, -74\.01/ })).toBeInTheDocument();
  });

  it('renders with custom height prop', () => {
    const { container } = render(<Map height={500} />);
    // Verify component renders without error when height is set
    expect(container.querySelector('[style*="height"]')).toBeInTheDocument();
  });
});

describe('Gantt', () => {
  it('renders empty state when no tasks', () => {
    render(<Gantt tasks={[]} />);
    expect(screen.getByText('No tasks')).toBeInTheDocument();
    expect(screen.getByText('Add tasks to see the Gantt chart')).toBeInTheDocument();
  });

  it('renders gantt with title', () => {
    render(<Gantt tasks={mockTasks} title="Project Timeline" />);
    expect(screen.getByText('Project Timeline')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<Gantt tasks={mockTasks} loading />);
    expect(screen.getByText('Loading Gantt chart...')).toBeInTheDocument();
  });

  it('renders task names', () => {
    render(<Gantt tasks={mockTasks} />);
    expect(screen.getByText('Design Phase')).toBeInTheDocument();
    expect(screen.getByText('Development Phase')).toBeInTheDocument();
    expect(screen.getByText('Testing Phase')).toBeInTheDocument();
  });

  it('renders task buttons with aria-labels', () => {
    render(<Gantt tasks={mockTasks} />);
    expect(
      screen.getByRole('button', { name: /Task: Design Phase.*100% complete/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Task: Development Phase.*50% complete/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Task: Testing Phase/ })
    ).toBeInTheDocument();
  });

  it('calls onTaskClick when task is clicked', () => {
    const handleClick = vi.fn();
    render(<Gantt tasks={mockTasks} onTaskClick={handleClick} />);
    fireEvent.click(screen.getByRole('button', { name: /Task: Design Phase/ }));
    expect(handleClick).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('shows view mode in header', () => {
    render(<Gantt tasks={mockTasks} viewMode="month" />);
    expect(screen.getByText(/View: month/)).toBeInTheDocument();
  });

  it('shows date range', () => {
    render(<Gantt tasks={mockTasks} />);
    // Check that date range is displayed
    expect(screen.getByText(/\d+ days/)).toBeInTheDocument();
  });

  it('applies custom height', () => {
    render(<Gantt tasks={mockTasks} height={600} />);
    const chartContainer = screen.getByText('Design Phase').closest('.overflow-x-auto');
    expect(chartContainer).toHaveStyle({ height: '600px' });
  });

  it('applies task color', () => {
    render(<Gantt tasks={mockTasks} />);
    const designButton = screen.getByRole('button', { name: /Task: Design Phase/ });
    expect(designButton).toHaveStyle({ backgroundColor: '#10b981' });
  });

  it('uses default color when task color not specified', () => {
    render(<Gantt tasks={mockTasks} />);
    const testingButton = screen.getByRole('button', { name: /Task: Testing Phase/ });
    expect(testingButton).toHaveStyle({ backgroundColor: '#3b82f6' });
  });
});
