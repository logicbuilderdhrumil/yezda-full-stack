/**
 * Render tests for PasswordChangeScreen component.
 * Task 1.7: Add tests for profile view, edit, and validation flows.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PasswordChangeScreen } from '../screens/PasswordChangeScreen';

describe('PasswordChangeScreen', () => {
  const mockOnBackPress = jest.fn();
  const mockOnContinue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders header with title and description', () => {
      const { getByText } = render(<PasswordChangeScreen />);

      expect(getByText('Change Password')).toBeTruthy();
      expect(
        getByText('Update your account password to keep your account secure.')
      ).toBeTruthy();
    });

    it('renders password requirements section', () => {
      const { getByText } = render(<PasswordChangeScreen />);

      expect(getByText('Password Requirements')).toBeTruthy();
      expect(getByText('At least 8 characters long')).toBeTruthy();
      expect(getByText('Include uppercase and lowercase letters')).toBeTruthy();
      expect(getByText('Include at least one number')).toBeTruthy();
      expect(getByText('Include at least one special character (!@#$%)')).toBeTruthy();
      expect(getByText('Avoid using personal information')).toBeTruthy();
    });

    it('renders instructions section', () => {
      const { getByText } = render(<PasswordChangeScreen />);

      expect(getByText('How to change your password')).toBeTruthy();
      expect(
        getByText(/you will be redirected to a secure page/)
      ).toBeTruthy();
    });

    it('renders additional security section', () => {
      const { getByText } = render(<PasswordChangeScreen />);

      expect(getByText('Additional Security')).toBeTruthy();
      expect(getByText('Two-Factor Authentication')).toBeTruthy();
      expect(getByText('Trusted Devices')).toBeTruthy();
    });

    it('renders both action buttons', () => {
      const { getByText, getByLabelText } = render(<PasswordChangeScreen />);

      expect(getByText('Continue to Change Password')).toBeTruthy();
      expect(getByText('Back to Profile')).toBeTruthy();
      expect(getByLabelText('Continue to change password')).toBeTruthy();
      expect(getByLabelText('Go back')).toBeTruthy();
    });

    it('renders help section', () => {
      const { getByText } = render(<PasswordChangeScreen />);

      expect(
        getByText(/Contact our support team for assistance/)
      ).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('has proper accessibility labels on buttons', () => {
      const { getByLabelText } = render(
        <PasswordChangeScreen
          onBackPress={mockOnBackPress}
          onContinue={mockOnContinue}
        />
      );

      expect(getByLabelText('Continue to change password')).toBeTruthy();
      expect(getByLabelText('Go back')).toBeTruthy();
    });

    it('has accessible role on buttons', () => {
      const { getByLabelText } = render(
        <PasswordChangeScreen
          onBackPress={mockOnBackPress}
          onContinue={mockOnContinue}
        />
      );

      const continueButton = getByLabelText('Continue to change password');
      const backButton = getByLabelText('Go back');

      expect(continueButton.props.accessibilityRole).toBe('button');
      expect(backButton.props.accessibilityRole).toBe('button');
    });
  });

  describe('callbacks', () => {
    it('calls onBackPress when back button is pressed', () => {
      const { getByLabelText } = render(
        <PasswordChangeScreen
          onBackPress={mockOnBackPress}
          onContinue={mockOnContinue}
        />
      );

      fireEvent.press(getByLabelText('Go back'));

      expect(mockOnBackPress).toHaveBeenCalledTimes(1);
    });

    it('calls onContinue when continue button is pressed', () => {
      const { getByLabelText } = render(
        <PasswordChangeScreen
          onBackPress={mockOnBackPress}
          onContinue={mockOnContinue}
        />
      );

      fireEvent.press(getByLabelText('Continue to change password'));

      expect(mockOnContinue).toHaveBeenCalledTimes(1);
    });

    it('does not crash when onBackPress is not provided', () => {
      const { getByLabelText } = render(<PasswordChangeScreen />);

      expect(() => {
        fireEvent.press(getByLabelText('Go back'));
      }).not.toThrow();
    });

    it('does not crash when onContinue is not provided', () => {
      const { getByLabelText } = render(<PasswordChangeScreen />);

      expect(() => {
        fireEvent.press(getByLabelText('Continue to change password'));
      }).not.toThrow();
    });
  });

  describe('testID', () => {
    it('has testID on continue button for E2E testing', () => {
      const { getByTestId } = render(
        <PasswordChangeScreen
          onBackPress={mockOnBackPress}
          onContinue={mockOnContinue}
        />
      );

      expect(getByTestId('continue-password-change-button')).toBeTruthy();
    });
  });
});
