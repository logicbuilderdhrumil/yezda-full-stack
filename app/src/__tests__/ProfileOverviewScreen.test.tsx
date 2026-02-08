/**
 * Render tests for ProfileOverviewScreen component.
 * Task 1.7: Add tests for profile view, edit, and validation flows.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProfileOverviewScreen } from '../screens/ProfileOverviewScreen';
import { useProfileStore } from '../store/profileStore';

// Mock the profile store
jest.mock('../store/profileStore', () => ({
  useProfileStore: jest.fn(),
  selectProfile: jest.fn((state: Record<string, unknown>) => state?.profile ?? null),
  selectProfileScreenState: jest.fn((state: Record<string, unknown>) => state?.screenState ?? 'idle'),
  selectProfileError: jest.fn((state: Record<string, unknown>) => state?.error ?? null),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseProfileStore = useProfileStore as unknown as jest.MockedFunction<(...args: any[]) => any>;

describe('ProfileOverviewScreen', () => {
  const mockLoadProfile = jest.fn();
  const mockClearError = jest.fn();
  const mockOnEditPress = jest.fn();
  const mockOnSecurityPress = jest.fn();

  const mockProfile = {
    id: '1',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '555-1234',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProfileStore.mockImplementation((selector) => {
      const state = {
        profile: mockProfile,
        screenState: 'idle',
        error: null,
        loadProfile: mockLoadProfile,
        clearError: mockClearError,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });
  });

  it('renders profile details', () => {
    const { getByText } = render(
      <ProfileOverviewScreen
        onEditPress={mockOnEditPress}
        onSecurityPress={mockOnSecurityPress}
      />
    );

    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('john@example.com')).toBeTruthy();
    expect(getByText('555-1234')).toBeTruthy();
  });

  it('displays loading state when loading without profile', () => {
    mockUseProfileStore.mockImplementation((selector) => {
      const state = {
        profile: null,
        screenState: 'loading',
        error: null,
        loadProfile: mockLoadProfile,
        clearError: mockClearError,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { getByText } = render(<ProfileOverviewScreen />);

    expect(getByText('Loading profile...')).toBeTruthy();
  });

  it('displays error state with retry button', () => {
    mockUseProfileStore.mockImplementation((selector) => {
      const state = {
        profile: null,
        screenState: 'error',
        error: 'Failed to load profile',
        loadProfile: mockLoadProfile,
        clearError: mockClearError,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { getByText, getByLabelText } = render(<ProfileOverviewScreen />);

    expect(getByText('Failed to load profile')).toBeTruthy();
    expect(getByLabelText('Retry loading profile')).toBeTruthy();
  });

  it('calls loadProfile on mount', () => {
    render(<ProfileOverviewScreen />);

    expect(mockLoadProfile).toHaveBeenCalled();
  });

  it('calls onEditPress when Edit Profile button is pressed', () => {
    const { getByLabelText } = render(
      <ProfileOverviewScreen
        onEditPress={mockOnEditPress}
        onSecurityPress={mockOnSecurityPress}
      />
    );

    fireEvent.press(getByLabelText('Edit profile'));

    expect(mockOnEditPress).toHaveBeenCalled();
  });

  it('calls onSecurityPress when password option is pressed', () => {
    const { getByLabelText } = render(
      <ProfileOverviewScreen
        onEditPress={mockOnEditPress}
        onSecurityPress={mockOnSecurityPress}
      />
    );

    fireEvent.press(getByLabelText('Change password'));

    expect(mockOnSecurityPress).toHaveBeenCalled();
  });

  it('displays initials in avatar', () => {
    const { getByText } = render(<ProfileOverviewScreen />);

    expect(getByText('JD')).toBeTruthy();
  });

  it('displays formatted address', () => {
    const { getByText } = render(<ProfileOverviewScreen />);

    // Address should be formatted as comma-separated values
    expect(getByText('123 Main St, New York, NY, 10001, USA')).toBeTruthy();
  });

  it('displays placeholder for missing phone', () => {
    mockUseProfileStore.mockImplementation((selector) => {
      const state = {
        profile: { ...mockProfile, phone: undefined },
        screenState: 'idle',
        error: null,
        loadProfile: mockLoadProfile,
        clearError: mockClearError,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { getAllByText } = render(<ProfileOverviewScreen />);

    expect(getAllByText('Not provided').length).toBeGreaterThan(0);
  });

  it('handles retry button press', async () => {
    mockUseProfileStore.mockImplementation((selector) => {
      const state = {
        profile: null,
        screenState: 'error',
        error: 'Network error',
        loadProfile: mockLoadProfile,
        clearError: mockClearError,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { getByLabelText } = render(<ProfileOverviewScreen />);

    fireEvent.press(getByLabelText('Retry loading profile'));

    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
      expect(mockLoadProfile).toHaveBeenCalledTimes(2); // Once on mount, once on retry
    });
  });

  it('shows error banner when there is an error but profile exists', () => {
    mockUseProfileStore.mockImplementation((selector) => {
      const state = {
        profile: mockProfile,
        screenState: 'error',
        error: 'Failed to refresh',
        loadProfile: mockLoadProfile,
        clearError: mockClearError,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { getByText, getByRole } = render(<ProfileOverviewScreen />);

    expect(getByText('Failed to refresh')).toBeTruthy();
    // Profile details should still be visible
    expect(getByText('John Doe')).toBeTruthy();
  });
});
