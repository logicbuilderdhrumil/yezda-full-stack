import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonTable } from '../Skeleton';

describe('Skeleton', () => {
  it('renders with default animation', () => {
    const { container } = render(<Skeleton className="h-4" />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('renders without animation when animation is none', () => {
    const { container } = render(<Skeleton animation="none" />);
    expect(container.firstChild).not.toHaveClass('animate-pulse');
    expect(container.firstChild).not.toHaveClass('shimmer');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="h-4 w-full" />);
    expect(container.firstChild).toHaveClass('h-4', 'w-full');
  });
});

describe('SkeletonText', () => {
  it('renders default 3 lines', () => {
    const { container } = render(<SkeletonText />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(3);
  });

  it('renders specified number of lines', () => {
    const { container } = render(<SkeletonText lines={5} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(5);
  });
});

describe('SkeletonCard', () => {
  it('renders with header by default', () => {
    const { container } = render(<SkeletonCard />);
    // Should have multiple skeleton elements
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders avatar when showAvatar is true', () => {
    const { container } = render(<SkeletonCard showAvatar />);
    const roundedFull = container.querySelector('.rounded-full');
    expect(roundedFull).toBeInTheDocument();
  });

  it('renders specified number of lines', () => {
    const { container } = render(<SkeletonCard lines={5} showHeader={false} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(5);
  });
});

describe('SkeletonTable', () => {
  it('renders default rows and columns', () => {
    const { container } = render(<SkeletonTable />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    // 4 columns for header + 5 rows * 4 columns = 4 + 20 = 24
    expect(skeletons).toHaveLength(24);
  });

  it('renders specified rows and columns', () => {
    const { container } = render(<SkeletonTable rows={3} columns={2} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    // 2 columns for header + 3 rows * 2 columns = 2 + 6 = 8
    expect(skeletons).toHaveLength(8);
  });
});
