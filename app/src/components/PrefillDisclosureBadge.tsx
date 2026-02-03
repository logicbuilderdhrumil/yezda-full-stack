/**
 * Prefill disclosure badge component.
 * Task 1.6: Add prefill disclosure markers for reused fields.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrefillDisclosure, consentCopy } from '../types/consent.types';

interface PrefillDisclosureBadgeProps {
  disclosure: PrefillDisclosure;
  onPress?: () => void;
  compact?: boolean;
}

/**
 * Badge shown on prefilled form fields to indicate data source.
 */
export function PrefillDisclosureBadge({
  disclosure,
  onPress,
  compact = false,
}: PrefillDisclosureBadgeProps) {
  const formattedDate = new Date(disclosure.sourceDate).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  const content = (
    <View
      className={`flex-row items-center ${
        compact ? 'px-2 py-1' : 'px-3 py-2'
      } bg-amber-50 border border-amber-200 rounded-lg`}
    >
      {/* Prefill indicator icon */}
      <View className="mr-2">
        <Ionicons
          name="refresh-circle"
          size={compact ? 14 : 18}
          color="#F59E0B"
        />
      </View>
      <View className="flex-1">
        <Text
          className={`text-amber-800 font-medium ${compact ? 'text-xs' : 'text-sm'}`}
        >
          {consentCopy.prefillLabel}
        </Text>
        {!compact && (
          <Text className="text-amber-600 text-xs mt-0.5">
            {consentCopy.prefillSource(disclosure.sourceOrganization, formattedDate)}
          </Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Prefilled from ${disclosure.sourceOrganization}`}
        accessibilityHint="Tap to view details about this prefilled data"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

interface PrefillFieldWrapperProps {
  children: React.ReactNode;
  disclosure?: PrefillDisclosure;
  showBadge?: boolean;
}

/**
 * Wrapper component that adds prefill disclosure badge to a form field.
 */
export function PrefillFieldWrapper({
  children,
  disclosure,
  showBadge = true,
}: PrefillFieldWrapperProps) {
  if (!disclosure || !showBadge) {
    return <>{children}</>;
  }

  return (
    <View>
      {children}
      <View className="mt-1">
        <PrefillDisclosureBadge disclosure={disclosure} compact />
      </View>
    </View>
  );
}

export default PrefillDisclosureBadge;
