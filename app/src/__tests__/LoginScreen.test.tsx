/**
 * Render tests for LoginScreen component.
 * Task 1.8: Add unit and integration tests for auth flows.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../screens/LoginScreen';
import { useAuthStore } from '../store/authStore';

// Mock the auth store
jest.mock('../store/authStore', () => ({
  useAuthStore: jest.fn(),
  selectIsLoading: jest.fn((state) => state?.isLoading ?? false),
  selectError: jest.fn((state) => state?.error ?? null),
  selectPendingMfa: jest.fn((state) => state?.pendingMfaChallenge ?? null),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('LoginScreen', () => {
  const mockSignIn = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector) => {
      const state = {
        signIn: mockSignIn,
        clearError: mockClearError,
        isLoading: false,
        error: null,
        pendingMfaChallenge: null,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });
  });

  it('renders login form elements', () => {
    const { getByLabelText, getByText } = render(<LoginScreen />);

    expect(getByText('Welcome Back')).toBeTruthy();
    expect(getByLabelText('Email address')).toBeTruthy();
    expect(getByLabelText('Password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('shows validation error for empty email on blur', () => {
    const { getByLabelText, getByText } = render(<LoginScreen />);

    const emailInput = getByLabelText('Email address');
    fireEvent(emailInput, 'blur');

    expect(getByText('Email is required')).toBeTruthy();
  });

  it('shows validation error for invalid email format', () => {
    const { getByLabelText, getByText } = render(<LoginScreen />);

    const emailInput = getByLabelText('Email address');
    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent(emailInput, 'blur');

    expect(getByText('Enter a valid email address')).toBeTruthy();
  });

  it('shows validation error for short password', () => {
    const { getByLabelText, getByText } = render(<LoginScreen />);

    const passwordInput = getByLabelText('Password');
    fireEvent.changeText(passwordInput, 'short');
    fireEvent(passwordInput, 'blur');

    expect(getByText('Password must be at least 8 characters')).toBeTruthy();
  });

  it('calls signIn with form values on valid submit', async () => {
    mockSignIn.mockResolvedValue(true);
    const { getByLabelText, getByText } = render(<LoginScreen />);

    const emailInput = getByLabelText('Email address');
    const passwordInput = getByLabelText('Password');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('does not call signIn when form is invalid', () => {
    const { getByLabelText, getByText } = render(<LoginScreen />);

    const emailInput = getByLabelText('Email address');
    fireEvent.changeText(emailInput, 'test@example.com');
    // Password left empty

    fireEvent.press(getByText('Sign In'));

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('displays error banner with accessibilityRole alert', () => {
    mockUseAuthStore.mockImplementation((selector) => {
      const state = {
        signIn: mockSignIn,
        clearError: mockClearError,
        isLoading: false,
        error: 'Invalid credentials',
        pendingMfaChallenge: null,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { getByText, UNSAFE_getByProps } = render(<LoginScreen />);

    expect(getByText('Invalid credentials')).toBeTruthy();
    // Verify accessibilityRole is set to alert
    expect(UNSAFE_getByProps({ accessibilityRole: 'alert' })).toBeTruthy();
  });

  it('shows loading state when isLoading is true', () => {
    mockUseAuthStore.mockImplementation((selector) => {
      const state = {
        signIn: mockSignIn,
        clearError: mockClearError,
        isLoading: true,
        error: null,
        pendingMfaChallenge: null,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { getByLabelText, queryByText } = render(<LoginScreen />);

    // Sign In text should not be visible during loading
    expect(queryByText('Sign In')).toBeNull();
    // Inputs should be disabled
    expect(getByLabelText('Email address').props.editable).toBe(false);
  });

  it('clears error when user types', () => {
    mockUseAuthStore.mockImplementation((selector) => {
      const state = {
        signIn: mockSignIn,
        clearError: mockClearError,
        isLoading: false,
        error: 'Some error',
        pendingMfaChallenge: null,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { getByLabelText } = render(<LoginScreen />);

    const emailInput = getByLabelText('Email address');
    fireEvent.changeText(emailInput, 'a');

    expect(mockClearError).toHaveBeenCalled();
  });

  it('returns null when MFA is pending', () => {
    mockUseAuthStore.mockImplementation((selector) => {
      const state = {
        signIn: mockSignIn,
        clearError: mockClearError,
        isLoading: false,
        error: null,
        pendingMfaChallenge: { challengeId: 'test', type: 'totp' as const },
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { toJSON } = render(<LoginScreen />);

    expect(toJSON()).toBeNull();
  });
});
