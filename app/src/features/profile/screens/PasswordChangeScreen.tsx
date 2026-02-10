/**
 * Password change entry point and guidance screen.
 * Task 1.6: Add password change entry point and guidance.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

interface PasswordChangeScreenProps {
  onBackPress?: () => void;
  onContinue?: () => void;
}

export function PasswordChangeScreen({
  onBackPress,
  onContinue,
}: PasswordChangeScreenProps) {
  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="pb-8"
    >
      {/* Header */}
      <View className="bg-white px-6 py-6 border-b border-slate-200">
        <Text className="text-xl font-semibold text-slate-900">
          Change Password
        </Text>
        <Text className="text-slate-600 mt-2">
          Update your account password to keep your account secure.
        </Text>
      </View>

      {/* Security Tips */}
      <View className="bg-white mt-4 px-6 py-4">
        <Text className="text-lg font-semibold text-slate-900 mb-4">
          Password Requirements
        </Text>

        <View className="gap-y-3">
          <SecurityTip text="At least 8 characters long" />
          <SecurityTip text="Include uppercase and lowercase letters" />
          <SecurityTip text="Include at least one number" />
          <SecurityTip text="Include at least one special character (!@#$%)" />
          <SecurityTip text="Avoid using personal information" />
        </View>
      </View>

      {/* Instructions */}
      <View className="bg-navy-50 mx-6 mt-6 p-4 rounded-lg">
        <Text className="text-navy-800 font-medium mb-2">
          How to change your password
        </Text>
        <Text className="text-navy-700 text-sm leading-5">
          To change your password, you will be redirected to a secure page where
          you can verify your identity and set a new password. A confirmation
          email will be sent to your registered email address.
        </Text>
      </View>

      {/* Additional Security Options */}
      <View className="bg-white mt-6 px-6 py-4">
        <Text className="text-lg font-semibold text-slate-900 mb-4">
          Additional Security
        </Text>

        <View className="py-4 border-b border-slate-100">
          <Text className="text-slate-900 font-medium">
            Two-Factor Authentication
          </Text>
          <Text className="text-slate-500 text-sm mt-1">
            Add an extra layer of security by enabling two-factor authentication.
            This requires a verification code in addition to your password.
          </Text>
        </View>

        <View className="py-4">
          <Text className="text-slate-900 font-medium">
            Trusted Devices
          </Text>
          <Text className="text-slate-500 text-sm mt-1">
            Manage devices that are trusted to access your account without
            additional verification.
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="px-6 mt-6 gap-y-3">
        <TouchableOpacity
          testID="continue-password-change-button"
          className="bg-navy-600 py-4 rounded-lg"
          onPress={onContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue to change password"
        >
          <Text className="text-white text-center font-semibold text-base">
            Continue to Change Password
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="py-4 rounded-lg mt-3 bg-slate-100"
          onPress={onBackPress}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text className="text-slate-700 text-center font-semibold text-base">
            Back to Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Help Section */}
      <View className="px-6 mt-6">
        <Text className="text-slate-500 text-sm text-center">
          Having trouble? Contact our support team for assistance with your
          account security.
        </Text>
      </View>
    </ScrollView>
  );
}

interface SecurityTipProps {
  text: string;
}

function SecurityTip({ text }: SecurityTipProps) {
  return (
    <View className="flex-row items-center mt-2">
      <View className="w-2 h-2 bg-green-500 rounded-full mr-3" />
      <Text className="text-slate-700 text-sm">{text}</Text>
    </View>
  );
}

export default PasswordChangeScreen;
