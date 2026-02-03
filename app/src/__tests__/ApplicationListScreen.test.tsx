/**
 * Tests for ApplicationListScreen.
 * Task 1.7: Add tests for form rendering, draft, and submission flows.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock the entire store module to prevent authService import chain
jest.mock('../store/applicationStore', () => ({
  useApplicationStore: jest.fn(),
  selectApplications: jest.fn(),
  selectListScreenState: jest.fn(),
  selectListError: jest.fn(),
}));

import { ApplicationListScreen } from '../screens/ApplicationListScreen';
import { useApplicationStore } from '../store/applicationStore';

const mockUseApplicationStore = useApplicationStore as jest.MockedFunction<typeof useApplicationStore>;

describe('ApplicationListScreen', () => {
  const mockOnSelectApplication = jest.fn();
  const mockLoadApplications = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadApplications.mockResolvedValue(undefined);
  });

  it('shows loading state initially', () => {
    mockUseApplicationStore.mockImplementation((selector: any) => {
      const state = {
        applications: [],
        listScreenState: 'loading',
        listError: null,
        loadApplications: mockLoadApplications,
      };
      return selector ? selector(state) : state;
    });

    const { getByText } = render(
      <ApplicationListScreen onSelectApplication={mockOnSelectApplication} />
    );

    expect(getByText('Loading applications...')).toBeTruthy();
  });

  it('shows error state with retry button', () => {
    mockUseApplicationStore.mockImplementation((selector: any) => {
      const state = {
        applications: [],
        listScreenState: 'error',
        listError: 'Network error',
        loadApplications: mockLoadApplications,
      };
      return selector ? selector(state) : state;
    });

    const { getByText, getByRole } = render(
      <ApplicationListScreen onSelectApplication={mockOnSelectApplication} />
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Network error')).toBeTruthy();
    
    const retryButton = getByRole('button', { name: 'Try again' });
    fireEvent.press(retryButton);
    
    expect(mockLoadApplications).toHaveBeenCalled();
  });

  it('shows empty state when no applications', () => {
    mockUseApplicationStore.mockImplementation((selector: any) => {
      const state = {
        applications: [],
        listScreenState: 'idle',
        listError: null,
        loadApplications: mockLoadApplications,
      };
      return selector ? selector(state) : state;
    });

    const { getByText } = render(
      <ApplicationListScreen onSelectApplication={mockOnSelectApplication} />
    );

    expect(getByText('No Applications')).toBeTruthy();
  });

  it('renders application list with status badges', () => {
    const applications = [
      {
        id: 'app-1',
        title: 'Background Check',
        status: 'pending' as const,
        dueDate: null,
        progress: 0,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'app-2',
        title: 'Education Verification',
        status: 'in_progress' as const,
        dueDate: '2026-02-10',
        progress: 50,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-15',
      },
    ];

    mockUseApplicationStore.mockImplementation((selector: any) => {
      const state = {
        applications,
        listScreenState: 'idle',
        listError: null,
        loadApplications: mockLoadApplications,
      };
      return selector ? selector(state) : state;
    });

    const { getByText } = render(
      <ApplicationListScreen onSelectApplication={mockOnSelectApplication} />
    );

    expect(getByText('Background Check')).toBeTruthy();
    expect(getByText('Not Started')).toBeTruthy();
    expect(getByText('Education Verification')).toBeTruthy();
    expect(getByText('In Progress')).toBeTruthy();
    expect(getByText('50% complete')).toBeTruthy();
  });

  it('calls onSelectApplication when card is pressed', () => {
    const applications = [
      {
        id: 'app-1',
        title: 'Background Check',
        status: 'pending' as const,
        dueDate: null,
        progress: 0,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ];

    mockUseApplicationStore.mockImplementation((selector: any) => {
      const state = {
        applications,
        listScreenState: 'idle',
        listError: null,
        loadApplications: mockLoadApplications,
      };
      return selector ? selector(state) : state;
    });

    const { getByText } = render(
      <ApplicationListScreen onSelectApplication={mockOnSelectApplication} />
    );

    fireEvent.press(getByText('Background Check'));
    
    expect(mockOnSelectApplication).toHaveBeenCalledWith('app-1');
  });

  it('loads applications on mount', () => {
    mockUseApplicationStore.mockImplementation((selector: any) => {
      const state = {
        applications: [],
        listScreenState: 'idle',
        listError: null,
        loadApplications: mockLoadApplications,
      };
      return selector ? selector(state) : state;
    });

    render(<ApplicationListScreen onSelectApplication={mockOnSelectApplication} />);

    expect(mockLoadApplications).toHaveBeenCalled();
  });
});
