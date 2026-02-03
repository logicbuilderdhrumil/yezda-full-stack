import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Badge, Tag, StatusIndicator } from '../Badge';

describe('Badge', () => {
  it('renders with children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toHaveClass('bg-primary');
  });

  it('applies success variant', () => {
    render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toHaveClass('bg-green-100');
  });

  it('applies warning variant', () => {
    render(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText('Warning')).toHaveClass('bg-yellow-100');
  });

  it('applies destructive variant', () => {
    render(<Badge variant="destructive">Error</Badge>);
    expect(screen.getByText('Error')).toHaveClass('bg-red-100');
  });
});

describe('Tag', () => {
  it('renders with children', () => {
    render(<Tag>Test Tag</Tag>);
    expect(screen.getByText('Test Tag')).toBeInTheDocument();
  });

  it('renders remove button when onRemove is provided', () => {
    const handleRemove = vi.fn();
    render(<Tag onRemove={handleRemove}>Removable</Tag>);
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', () => {
    const handleRemove = vi.fn();
    render(<Tag onRemove={handleRemove}>Removable</Tag>);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it('does not render remove button when disabled', () => {
    const handleRemove = vi.fn();
    render(<Tag onRemove={handleRemove} disabled>Disabled</Tag>);
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });
});

describe('StatusIndicator', () => {
  it('renders with default status', () => {
    render(<StatusIndicator />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies online status class', () => {
    render(<StatusIndicator status="online" />);
    expect(screen.getByRole('status')).toHaveClass('bg-green-500');
  });

  it('applies busy status class', () => {
    render(<StatusIndicator status="busy" />);
    expect(screen.getByRole('status')).toHaveClass('bg-red-500');
  });

  it('applies size classes', () => {
    render(<StatusIndicator size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('h-4', 'w-4');
  });

  it('applies custom aria-label', () => {
    render(<StatusIndicator label="User is online" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'User is online');
  });
});
