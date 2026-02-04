/**
 * State components tests.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  LoadingState,
  EmptyState,
  ErrorState,
  NoResultsState,
  ContentPlaceholder,
} from '../StateComponents';

describe('LoadingState', () => {
  it('renders with default message', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingState message="Fetching data..." />);
    expect(screen.getByText('Fetching data...')).toBeInTheDocument();
  });

  it('renders spinner', () => {
    render(<LoadingState />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('applies size classes', () => {
    const { container, rerender } = render(<LoadingState size="sm" />);
    let spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-4', 'w-4');

    rerender(<LoadingState size="lg" />);
    spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-12', 'w-12');
  });

  it('renders as full page overlay when fullPage is true', () => {
    render(<LoadingState fullPage />);
    const overlay = document.querySelector('.fixed');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('inset-0');
  });
});

describe('EmptyState', () => {
  it('renders with default title', () => {
    render(<EmptyState />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('renders with custom title and description', () => {
    render(
      <EmptyState 
        title="No users" 
        description="Create your first user to get started" 
      />
    );
    expect(screen.getByText('No users')).toBeInTheDocument();
    expect(screen.getByText('Create your first user to get started')).toBeInTheDocument();
  });

  it('renders primary action button', () => {
    const onClick = vi.fn();
    render(
      <EmptyState 
        action={{ label: 'Add User', onClick }} 
      />
    );
    
    const button = screen.getByRole('button', { name: 'Add User' });
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });

  it('renders secondary action button', () => {
    const primaryClick = vi.fn();
    const secondaryClick = vi.fn();
    render(
      <EmptyState 
        action={{ label: 'Add User', onClick: primaryClick }}
        secondaryAction={{ label: 'Import', onClick: secondaryClick }}
      />
    );
    
    expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import' })).toBeInTheDocument();
  });

  it('renders custom icon', () => {
    render(
      <EmptyState 
        icon={<span data-testid="custom-icon">🎉</span>}
      />
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('renders with default title', () => {
    render(<ErrorState />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders error message from string', () => {
    render(<ErrorState error="Connection failed" />);
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  it('renders error message from Error object', () => {
    render(<ErrorState error={new Error('Network error')} />);
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('renders retry button when onRetry provided', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    
    const button = screen.getByRole('button', { name: 'Try again' });
    fireEvent.click(button);
    
    expect(onRetry).toHaveBeenCalled();
  });

  it('renders custom action', () => {
    const onClick = vi.fn();
    render(<ErrorState action={{ label: 'Go Back', onClick }} />);
    
    const button = screen.getByRole('button', { name: 'Go Back' });
    expect(button).toBeInTheDocument();
  });
});

describe('NoResultsState', () => {
  it('renders default message', () => {
    render(<NoResultsState />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('shows query in message', () => {
    render(<NoResultsState query="test search" />);
    expect(screen.getByText(/test search/)).toBeInTheDocument();
  });

  it('shows suggestions', () => {
    render(
      <NoResultsState 
        suggestions={['Try different keywords', 'Check your spelling']}
      />
    );
    expect(screen.getByText('• Try different keywords')).toBeInTheDocument();
    expect(screen.getByText('• Check your spelling')).toBeInTheDocument();
  });

  it('renders clear button when onClear provided', () => {
    const onClear = vi.fn();
    render(<NoResultsState onClear={onClear} />);
    
    const button = screen.getByRole('button', { name: 'Clear search' });
    fireEvent.click(button);
    
    expect(onClear).toHaveBeenCalled();
  });
});

describe('ContentPlaceholder', () => {
  it('renders default message', () => {
    render(<ContentPlaceholder />);
    expect(screen.getByText('Content coming soon')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<ContentPlaceholder message="Feature under development" />);
    expect(screen.getByText('Feature under development')).toBeInTheDocument();
  });

  it('renders custom icon', () => {
    render(
      <ContentPlaceholder 
        icon={<span data-testid="custom-icon">⚙️</span>}
      />
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
