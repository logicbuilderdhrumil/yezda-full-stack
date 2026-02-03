/**
 * Render tests for MfaChallengeScreen component.
 * Task 1.8: Add unit and integration tests for auth flows.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { MfaChallengeScreen } from '../screens/MfaChallengeScreen';
import { useAuthStore } from '../store/authStore';

// Mock the auth store
jest.mock('../store/authStore', () => ({
  useAuthStore: jest.fn(),
  selectIsLoading: jest.fn((state) => state?.isLoading ?? false),
  selectError: jest.fn((state) => state?.error ?? null),
  selectPendingMfa: jest.fn((state) => state?.pendingMfaChallenge ?? null),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('MfaChallengeScreen', () => {
  const mockVerifyMfa = jest.fn();
  const mockSignOut = jest.fn();
  const mockClearError = jest.fn();

  const defaultPendingMfa = {
    challengeId: 'challenge-123',
    type: 'totp' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockImplementation((selector) => {
      const state = {
        verifyMfa: mockVerifyMfa,
        signOut: mockSignOut,
        clearError: mockClearError,
        isLoading: false,
        error: null,
        pendingMfaChallenge: defaultPendingMfa,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });
  });

  it('renders MFA challenge screen for TOTP', () => {
    const { getByText, getByLabelText } = render(<MfaChallengeScreen />);

    expect(getByText('Enter Authenticator Code')).toBeTruthy();
    expect(getByText('Enter the 6-digit code from your authenticator app.')).toBeTruthy();
    expect(getByLabelText('Verification code')).toBeTruthy();
  });

  it('renders MFA challenge screen for SMS with hint', () => {
    mockUseAuthStore.mockImplementation((selector) => {
      const state = {
        verifyMfa: mockVerifyMfa,
        signOut: mockSignOut,
        clearError: mockClearError,
        isLoading: false,
        error: null,
        pendingMfaChallenge: {
          challengeId: 'challenge-123',
          type: 'sms' as const,
          hint: '1234',
        },
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { getByText } = render(<MfaChallengeScreen />);

    expect(getByText('Enter SMS Code')).toBeTruthy();
    expect(getByText('We sent a code to the phone ending in 1234.')).toBeTruthy();
    expect(getByText('Resend code')).toBeTruthy();
  });

  it('renders MFA challenge screen for email', () => {
    mockUseAuthStore.mockImplementation((selector) => {
      const state = {
        verifyMfa: mockVerifyMfa,
        signOut: mockSignOut,
        clearError: mockClearError,
        isLoading: false,
        error: null,
        pendingMfaChallenge: {
          challengeId: 'challenge-123',
          type: 'email' as const,
          hint: 'u***@example.com',
        },
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { getByText } = render(<MfaChallengeScreen />);

    expect(getByText('Enter Email Code')).toBeTruthy();
    expect(getByText('We sent a code to u***@example.com.')).toBeTruthy();
    expect(getByText('Resend code')).toBeTruthy();
  });

  it('returns null when no pending MFA challenge', () => {
    mockUseAuthStore.mockImplementation((selector) => {
      const state = {
        verifyMfa: mockVerifyMfa,
        signOut: mockSignOut,
        clearError: mockClearError,
        isLoading: false,
        error: null,
        pendingMfaChallenge: null,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { toJSON } = render(<MfaChallengeScreen />);
    expect(toJSON()).toBeNull();
  });

  it('only allows digit input', () => {
    const { getByLabelText } = render(<MfaChallengeScreen />);

    const input = getByLabelText('Verification code');
    fireEvent.changeText(input, 'abc123def456');

    expect(input.props.value).toBe('123456');
  });

  it('limits input to 6 digits', () => {
    const { getByLabelText } = render(<MfaChallengeScreen />);

    const input = getByLabelText('Verification code');
    fireEvent.changeText(input, '12345678');

    expect(input.props.value).toBe('123456');
  });

  it('auto-submits when 6 digits are entered', async () => {
    mockVerifyMfa.mockResolvedValue(true);
    const { getByLabelText } = render(<MfaChallengeScreen />);

    const input = getByLabelText('Verification code');
    fireEvent.changeText(input, '123456');

    await waitFor(() => {
      expect(mockVerifyMfa).toHaveBeenCalledWith({
        challengeId: 'challenge-123',
        code: '123456',
      });
    });
  });

  it('displays error banner with accessibilityRole alert', () => {
    mockUseAuthStore.mockImplementation((selector) => {
      const state = {
        verifyMfa: mockVerifyMfa,
        signOut: mockSignOut,
        clearError: mockClearError,
        isLoading: false,
        error: 'Invalid verification code',
        pendingMfaChallenge: defaultPendingMfa,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { getByText, getByRole } = render(<MfaChallengeScreen />);

    expect(getByText('Invalid verification code')).toBeTruthy();
    expect(getByRole('alert')).toBeTruthy();
  });

  it('clears error when user types', () => {
    mockUseAuthStore.mockImplementation((selector) => {
      const state = {
        verifyMfa: mockVerifyMfa,
        signOut: mockSignOut,
        clearError: mockClearError,
        isLoading: false,
        error: 'Some error',
        pendingMfaChallenge: defaultPendingMfa,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { getByLabelText } = render(<MfaChallengeScreen />);

    fireEvent.changeText(getByLabelText('Verification code'), '1');

    expect(mockClearError).toHaveBeenCalled();
  });

  it('calls signOut when cancel is pressed', async () => {
    mockSignOut.mockResolvedValue(undefined);
    const { getByText } = render(<MfaChallengeScreen />);

    fireEvent.press(getByText('Cancel and return to sign in'));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  it('disables verify button until 6 digits entered', () => {
    const { getByLabelText, getByRole } = render(<MfaChallengeScreen />);

    const verifyButton = getByRole('button', { name: 'Verify code' });
    expect(verifyButton.props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(getByLabelText('Verification code'), '123456');

    // Button should be enabled now (after auto-submit attempt)
    expect(verifyButton.props.accessibilityState.disabled).toBe(false);
  });

  it('shows resend code button for SMS type', () => {
    mockUseAuthStore.mockImplementation((selector) => {
      const state = {
        verifyMfa: mockVerifyMfa,
        signOut: mockSignOut,
        clearError: mockClearError,
        isLoading: false,
        error: null,
        pendingMfaChallenge: {
          challengeId: 'challenge-123',
          type: 'sms' as const,
        },
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { getByText } = render(<MfaChallengeScreen />);

    expect(getByText('Resend code')).toBeTruthy();
  });

  it('does not show resend code button for TOTP type', () => {
    const { queryByText } = render(<MfaChallengeScreen />);

    expect(queryByText('Resend code')).toBeNull();
  });

  it('shows cooldown timer after resend clicked', async () => {
    jest.useFakeTimers();
    
    mockUseAuthStore.mockImplementation((selector) => {
      const state = {
        verifyMfa: mockVerifyMfa,
        signOut: mockSignOut,
        clearError: mockClearError,
        isLoading: false,
        error: null,
        pendingMfaChallenge: {
          challengeId: 'challenge-123',
          type: 'sms' as const,
        },
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { getByText, queryByText } = render(<MfaChallengeScreen />);

    fireEvent.press(getByText('Resend code'));

    expect(getByText('Resend code in 60s')).toBeTruthy();

    // Fast-forward 10 seconds
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(getByText('Resend code in 50s')).toBeTruthy();

    jest.useRealTimers();
  });
});
