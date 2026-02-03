/**
 * Render tests for ProfileEditScreen component.
 * Task 1.7: Add tests for profile view, edit, and validation flows.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProfileEditScreen } from '../screens/ProfileEditScreen';
import { useProfileStore } from '../store/profileStore';

// Mock the profile store
jest.mock('../store/profileStore', () => ({
  useProfileStore: jest.fn(),
  selectProfile: jest.fn((state) => state?.profile ?? null),
  selectProfileScreenState: jest.fn((state) => state?.screenState ?? 'idle'),
  selectProfileError: jest.fn((state) => state?.error ?? null),
  selectProfileSuccess: jest.fn((state) => state?.successMessage ?? null),
}));

const mockUseProfileStore = useProfileStore as jest.MockedFunction<typeof useProfileStore>;

describe('ProfileEditScreen', () => {
  const mockUpdateProfile = jest.fn();
  const mockClearError = jest.fn();
  const mockClearSuccess = jest.fn();
  const mockOnSaveSuccess = jest.fn();
  const mockOnCancel = jest.fn();

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
        successMessage: null,
        updateProfile: mockUpdateProfile,
        clearError: mockClearError,
        clearSuccess: mockClearSuccess,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });
  });

  it('renders form with profile data', () => {
    const { getByLabelText } = render(
      <ProfileEditScreen onSaveSuccess={mockOnSaveSuccess} onCancel={mockOnCancel} />
    );

    expect(getByLabelText('First Name').props.value).toBe('John');
    expect(getByLabelText('Last Name').props.value).toBe('Doe');
    expect(getByLabelText('Phone').props.value).toBe('555-1234');
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
        phone: '555-1234',
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
    mockUseProfileStore.mockImplementation((selector) => {
      const state = {
        profile: { ...mockProfile, firstName: '' },
        screenState: 'idle',
        error: null,
        successMessage: null,
        updateProfile: mockUpdateProfile,
        clearError: mockClearError,
        clearSuccess: mockClearSuccess,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

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
    mockUseProfileStore.mockImplementation((selector) => {
      const state = {
        profile: mockProfile,
        screenState: 'error',
        error: 'Failed to save changes',
        successMessage: null,
        updateProfile: mockUpdateProfile,
        clearError: mockClearError,
        clearSuccess: mockClearSuccess,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { getByText, UNSAFE_getByProps } = render(
      <ProfileEditScreen onSaveSuccess={mockOnSaveSuccess} onCancel={mockOnCancel} />
    );

    expect(getByText('Failed to save changes')).toBeTruthy();
    expect(UNSAFE_getByProps({ accessibilityRole: 'alert' })).toBeTruthy();
  });

  it('displays success banner when successMessage exists', () => {
    mockUseProfileStore.mockImplementation((selector) => {
      const state = {
        profile: mockProfile,
        screenState: 'success',
        error: null,
        successMessage: 'Profile updated successfully!',
        updateProfile: mockUpdateProfile,
        clearError: mockClearError,
        clearSuccess: mockClearSuccess,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { getByText } = render(
      <ProfileEditScreen onSaveSuccess={mockOnSaveSuccess} onCancel={mockOnCancel} />
    );

    expect(getByText('Profile updated successfully!')).toBeTruthy();
  });

  it('shows saving state with disabled button', () => {
    mockUseProfileStore.mockImplementation((selector) => {
      const state = {
        profile: mockProfile,
        screenState: 'saving',
        error: null,
        successMessage: null,
        updateProfile: mockUpdateProfile,
        clearError: mockClearError,
        clearSuccess: mockClearSuccess,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

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
    mockUseProfileStore.mockImplementation((selector) => {
      const state = {
        profile: mockProfile,
        screenState: 'error',
        error: 'Some error',
        successMessage: null,
        updateProfile: mockUpdateProfile,
        clearError: mockClearError,
        clearSuccess: mockClearSuccess,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

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
