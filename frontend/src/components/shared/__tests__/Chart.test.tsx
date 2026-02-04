import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  Chart,
  ChartBar,
  ChartArea,
  ChartPie,
  Sparkline,
  ChartLoading,
  ChartEmpty,
  useChartColors,
} from '../Chart';
import { lightChartColors, darkChartColors } from '@/constants/chart.constant';

// Mock ResizeObserver for Recharts ResponsiveContainer
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.ResizeObserver = ResizeObserverMock;

// Mock matchMedia for theme detection
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Sample data for tests
const sampleLineData = [
  { month: 'Jan', value1: 100, value2: 80 },
  { month: 'Feb', value1: 150, value2: 90 },
  { month: 'Mar', value1: 120, value2: 100 },
];

const samplePieData = [
  { name: 'A', value: 400 },
  { name: 'B', value: 300 },
  { name: 'C', value: 200 },
];

const sampleSeries = [
  { dataKey: 'value1', name: 'Series 1' },
  { dataKey: 'value2', name: 'Series 2' },
];

describe('ChartLoading', () => {
  it('renders loading state with default height', () => {
    render(<ChartLoading />);
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toHaveAttribute('aria-label', 'Loading chart');
    expect(loadingElement).toHaveStyle({ minHeight: '300px' });
  });

  it('renders loading state with custom height', () => {
    render(<ChartLoading minHeight={400} />);
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toHaveStyle({ minHeight: '400px' });
  });

  it('applies custom className', () => {
    render(<ChartLoading className="test-class" />);
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toHaveClass('test-class');
  });

  it('displays loading text', () => {
    render(<ChartLoading />);
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });
});

describe('ChartEmpty', () => {
  it('renders empty state with default message', () => {
    render(<ChartEmpty />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<ChartEmpty message="Custom empty message" />);
    expect(screen.getByText('Custom empty message')).toBeInTheDocument();
  });

  it('applies custom minHeight', () => {
    render(<ChartEmpty minHeight={500} />);
    const emptyElement = screen.getByRole('status');
    expect(emptyElement).toHaveStyle({ minHeight: '500px' });
  });

  it('applies custom className', () => {
    render(<ChartEmpty className="custom-empty" />);
    const emptyElement = screen.getByRole('status');
    expect(emptyElement).toHaveClass('custom-empty');
  });
});

describe('Chart (Line)', () => {
  beforeEach(() => {
    mockMatchMedia(false); // Light mode
  });

  it('renders loading state when loading prop is true', () => {
    render(
      <Chart
        data={sampleLineData}
        xAxisKey="month"
        series={sampleSeries}
        loading
      />
    );
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });

  it('renders empty state when data is empty', () => {
    render(<Chart data={[]} xAxisKey="month" series={sampleSeries} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders empty state with custom message', () => {
    render(
      <Chart
        data={[]}
        xAxisKey="month"
        series={sampleSeries}
        emptyMessage="No chart data"
      />
    );
    expect(screen.getByText('No chart data')).toBeInTheDocument();
  });

  it('renders chart container with data', () => {
    render(
      <Chart
        data={sampleLineData}
        xAxisKey="month"
        series={sampleSeries}
        ariaLabel="Test line chart"
      />
    );
    expect(screen.getByRole('img', { name: 'Test line chart' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Chart
        data={sampleLineData}
        xAxisKey="month"
        series={sampleSeries}
        className="custom-chart"
      />
    );
    expect(container.querySelector('.custom-chart')).toBeInTheDocument();
  });
});

describe('ChartBar', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('renders loading state when loading prop is true', () => {
    render(
      <ChartBar
        data={sampleLineData}
        xAxisKey="month"
        series={sampleSeries}
        loading
      />
    );
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });

  it('renders empty state when data is empty', () => {
    render(<ChartBar data={[]} xAxisKey="month" series={sampleSeries} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders chart container with data', () => {
    render(
      <ChartBar
        data={sampleLineData}
        xAxisKey="month"
        series={sampleSeries}
        ariaLabel="Test bar chart"
      />
    );
    expect(screen.getByRole('img', { name: 'Test bar chart' })).toBeInTheDocument();
  });
});

describe('ChartArea', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('renders loading state when loading prop is true', () => {
    render(
      <ChartArea
        data={sampleLineData}
        xAxisKey="month"
        series={sampleSeries}
        loading
      />
    );
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });

  it('renders empty state when data is empty', () => {
    render(<ChartArea data={[]} xAxisKey="month" series={sampleSeries} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders chart container with data', () => {
    render(
      <ChartArea
        data={sampleLineData}
        xAxisKey="month"
        series={sampleSeries}
        ariaLabel="Test area chart"
      />
    );
    expect(screen.getByRole('img', { name: 'Test area chart' })).toBeInTheDocument();
  });
});

describe('ChartPie', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('renders loading state when loading prop is true', () => {
    render(
      <ChartPie
        data={samplePieData}
        dataKey="value"
        nameKey="name"
        loading
      />
    );
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });

  it('renders empty state when data is empty', () => {
    render(<ChartPie data={[]} dataKey="value" nameKey="name" />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders chart container with data', () => {
    render(
      <ChartPie
        data={samplePieData}
        dataKey="value"
        nameKey="name"
        ariaLabel="Test pie chart"
      />
    );
    expect(screen.getByRole('img', { name: 'Test pie chart' })).toBeInTheDocument();
  });
});

describe('Sparkline', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('returns null when data is empty', () => {
    const { container } = render(<Sparkline data={[]} dataKey="value" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders sparkline with data', () => {
    const { container } = render(
      <Sparkline
        data={[{ value: 10 }, { value: 20 }, { value: 15 }]}
        dataKey="value"
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom dimensions', () => {
    const { container } = render(
      <Sparkline
        data={[{ value: 10 }]}
        dataKey="value"
        width={150}
        height={40}
      />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: '150px', height: '40px' });
  });

  it('applies custom className', () => {
    const { container } = render(
      <Sparkline
        data={[{ value: 10 }]}
        dataKey="value"
        className="custom-sparkline"
      />
    );
    expect(container.querySelector('.custom-sparkline')).toBeInTheDocument();
  });
});

describe('useChartColors', () => {
  it('returns light colors when not in dark mode', () => {
    mockMatchMedia(false);
    // Create a simple component to test the hook
    function TestComponent() {
      const colors = useChartColors();
      return <div data-testid="primary">{colors.series[0]}</div>;
    }
    render(<TestComponent />);
    expect(screen.getByTestId('primary')).toHaveTextContent(lightChartColors.series[0]);
  });

  it('returns dark colors when in dark mode', () => {
    mockMatchMedia(true);
    function TestComponent() {
      const colors = useChartColors();
      return <div data-testid="primary">{colors.series[0]}</div>;
    }
    render(<TestComponent />);
    expect(screen.getByTestId('primary')).toHaveTextContent(darkChartColors.series[0]);
  });
});
