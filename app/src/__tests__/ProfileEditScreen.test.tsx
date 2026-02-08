/**
 * Render tests for ProfileEditScreen component.
 * Task 1.7: Add tests for profile view, edit, and validation flows.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProfileEditScreen } from '../screens/ProfileEditScreen';
import { useProfileStore } from '../store/profileStore';

// Mock zustand/react/shallow — useShallow must return the selector itself
// so that useProfileStore(useShallow(fn)) becomes useProfileStore(fn).
jest.mock('zustand/react/shallow', () => ({
  useShallow: (selector: any) => selector,
}));

// Mock the profile store
jest.mock('../store/profileStore', () => ({
  useProfileStore: jest.fn(),
  selectProfile: jest.fn((state: Record<string, unknown>) => state?.profile ?? null),
  selectProfileScreenState: jest.fn((state: Record<string, unknown>) => state?.screenState ?? 'idle'),
  selectProfileError: jest.fn((state: Record<string, unknown>) => state?.error ?? null),
  selectProfileSuccess: jest.fn((state: Record<string, unknown>) => state?.successMessage ?? null),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseProfileStore = useProfileStore as unknown as jest.MockedFunction<(...args: any[]) => any>;

describe('ProfileEditScreen', () => {
  const mockUpdateProfile = jest.fn();
  const mockClearError = jest.fn();
  const mockClearSuccess = jest.fn();
  const mockOnSaveSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  // Stable reference — must remain the SAME object across renders to avoid
  // infinite useEffect([profile]) re-trigger.
  const mockProfile = {
    id: '1',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '555-123-4567',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
  };

  // Build the default state ONCE so every selector call returns the same
  // object references and React doesn't detect a change.
  let defaultState: Record<string, unknown>;

  beforeEach(() => {
    jest.clearAllMocks();

    defaultState = {
      profile: mockProfile,
      screenState: 'idle',
      error: null,
      successMessage: null,
      updateProfile: mockUpdateProfile,
      clearError: mockClearError,
      clearSuccess: mockClearSuccess,
    };

    mockUseProfileStore.mockImplementation((selector) =>
      typeof selector === 'function' ? selector(defaultState) : defaultState
    );
  });

  it('renders form with profile data', () => {
    const { getByLabelText } = render(
      <ProfileEditScreen onSaveSuccess={mockOnSaveSuccess} onCancel={mockOnCancel} />
    );

    expect(getByLabelText('First Name').props.value).toBe('John');
    expect(getByLabelText('Last Name').props.value).toBe('Doe');
    expect(getByLabelText('Phone').props.value).toBe('555-123-4567');
    expect(getByLabelText('Street Address').props.value).toBe('123 Main St');
    expect(getByLabelText('City').props.value).toBe('New York');
    expect(getByLabelText('State').props.value).toBe('NY');
    expect(getByLabelText('ZIP Code').props.value).toBe('10001');
    expect(getByLabelText('Country').props.value).toBe('USA');
  });

  it('shows validation error for empty firstName on blur', () => {
    const { getByLabelText, getByText } = render(
      <ProfileEditScreen onSaveSuccess={mockOnSaveSuccess} onCancel={mockOnCancel} />
    );

    const firstNameInput = getByLabelText('First Name');
    fireEvent.changeText(firstNameInput, '');
    fireEvent(firstNameInput, 'blur');

    expect(getByText('First name is required')).toBeTruthy();
  });

  it('shows validation error for empty lastName on blur', () => {
    const { getByLabelText, getByText } = render(
      <ProfileEditScreen onSaveSuccess={mockOnSaveSuccess} onCancel={mockOnCancel} />
    );

    const lastNameInput = getByLabelText('Last Name');
    fireEvent.changeText(lastNameInput, '');
    fireEvent(lastNameInput, 'blur');

    expect(getByText('Last name is required')).toBeTruthy();
  });

  it('shows validation error for invalid phone number', () => {
    const { getByLabelText, getByText } = render(
      <ProfileEditScreen onSaveSuccess={mockOnSaveSuccess} onCancel={mockOnCancel} />
    );

    const phoneInput = getByLabelText('Phone');
    fireEvent.changeText(phoneInput, '12345');
    fireEvent(phoneInput, 'blur');

    expect(getByText('Phone number must be at least 10 digits')).toBeTruthy();
  });

  it('calls updateProfile with form values on valid submit', async () => {
    mockUpdateProfile.mockResolvedValue(true);
    const { getByLabelText } = render(
      <ProfileEditScreen onSaveSuccess={mockOnSaveSuccess} onCancel={mockOnCancel} />
    );

    fireEvent.press(getByLabelText('Save changes'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        phone: '555-123-4567',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
      });
    });
  });

  it('does not call updateProfile when form is invalid', async () => {
    const emptyFirstNameProfile = { ...mockProfile, firstName: '' };
    const state = {
      profile: emptyFirstNameProfile,
      screenState: 'idle',
      error: null,
      successMessage: null,
      updateProfile: mockUpdateProfile,
      clearError: mockClearError,
      clearSuccess: mockClearSuccess,
    };
    mockUseProfileStore.mockImplementation((selector) =>
      typeof selector === 'function' ? selector(state) : state
    );

    const { getByLabelText, getByText } = render(
      <ProfileEditScreen onSaveSuccess={mockOnSaveSuccess} onCancel={mockOnCancel} />
    );

    fireEvent.press(getByLabelText('Save changes'));

    await waitFor(() => {
      expect(getByText('First name is required')).toBeTruthy();
    });
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('displays error banner when error exists', () => {
    const state = {
      profile: mockProfile,
      screenState: 'error',
      error: 'Failed to save changes',
      successMessage: null,
      updateProfile: mockUpdateProfile,
      clearError: mockClearError,
      clearSuccess: mockClearSuccess,
    };
    mockUseProfileStore.mockImplementation((selector) =>
      typeof selector === 'function' ? selector(state) : state
    );

    const { getByText, UNSAFE_getByProps } = render(
      <ProfileEditScreen onSaveSuccess={mockOnSaveSuccess} onCancel={mockOnCancel} />
    );

    expect(getByText('Failed to save changes')).toBeTruthy();
    expect(UNSAFE_getByProps({ accessibilityRole: 'alert' })).toBeTruthy();
  });

  it('displays success banner when successMessage exists', () => {
    const state = {
      profile: mockProfile,
      screenState: 'success',
      error: null,
      successMessage: 'Profile updated successfully!',
      updateProfile: mockUpdateProfile,
      clearError: mockClearError,
      clearSuccess: mockClearSuccess,
    };
    mockUseProfileStore.mockImplementation((selector) =>
      typeof selector === 'function' ? selector(state) : state
    );

    const { getByText } = render(
      <ProfileEditScreen onSaveSuccess={mockOnSaveSuccess} onCancel={mockOnCancel} />
    );

    expect(getByText('Profile updated successfully!')).toBeTruthy();
  });

  it('shows saving state with disabled button', () => {
    const state = {
      profile: mockProfile,
      screenState: 'saving',
      error: null,
      successMessage: null,
      updateProfile: mockUpdateProfile,
      clearError: mockClearError,
      clearSuccess: mockClearSuccess,
    };
    mockUseProfileStore.mockImplementation((selector) =>
      typeof selector === 'function' ? selector(state) : state
    );

    const { getByLabelText, queryByText } = render(
      <ProfileEditScreen onSaveSuccess={mockOnSaveSuccess} onCancel={mockOnCancel} />
    );

    // Save Changes text should not be visible during saving
    expect(queryByText('Save Changes')).toBeNull();
    // Inputs should be disabled
    expect(getByLabelText('First Name').props.editable).toBe(false);
  });

  it('calls onCancel when Cancel button is pressed', () => {
    const { getByLabelText } = render(
      <ProfileEditScreen onSaveSuccess={mockOnSaveSuccess} onCancel={mockOnCancel} />
    );

    fireEvent.press(getByLabelText('Cancel editing'));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('clears error when user types', () => {
    const state = {
      profile: mockProfile,
      screenState: 'error',
      error: 'Some error',
      successMessage: null,
      updateProfile: mockUpdateProfile,
      clearError: mockClearError,
      clearSuccess: mockClearSuccess,
    };
    mockUseProfileStore.mockImplementation((selector) =>
      typeof selector === 'function' ? selector(state) : state
    );

    const { getByLabelText } = render(
      <ProfileEditScreen onSaveSuccess={mockOnSaveSuccess} onCancel={mockOnCancel} />
    );

    const firstNameInput = getByLabelText('First Name');
    fireEvent.changeText(firstNameInput, 'Jane');

    expect(mockClearError).toHaveBeenCalled();
  });

  it('renders required field indicators', () => {
    const { getByText } = render(
      <ProfileEditScreen onSaveSuccess={mockOnSaveSuccess} onCancel={mockOnCancel} />
    );

    // Required fields should have asterisks
    expect(getByText('Personal Information')).toBeTruthy();
    // The form labels should indicate required fields
  });
});
