/**
 * Consent status badge component.
 * Task 1.5: Add consent status display during application flows.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConsentDecision, consentScopeLabels, ConsentScope } from '../types/consent.types';

interface ConsentStatusBadgeProps {
  consent: ConsentDecision | null;
  onPress?: () => void;
  showScopes?: boolean;
}

/**
 * Badge displaying current consent status in application flows.
 */
export function ConsentStatusBadge({
  consent,
  onPress,
  showScopes = false,
}: ConsentStatusBadgeProps) {
  if (!consent) {
    return null;
  }

  const statusConfig = {
    granted: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: '#166534',
      label: 'Data Reuse Active',
      iconName: 'checkmark-circle' as const,
    },
    pending: {
      bgColor: 'bg-navy-50',
      borderColor: 'border-navy-200',
      textColor: 'text-navy-800',
      iconColor: '#1E40AF',
      label: 'Consent Pending',
      iconName: 'time' as const,
    },
    denied: {
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-600',
      iconColor: '#4B5563',
      label: 'Data Reuse Declined',
      iconName: 'close-circle' as const,
    },
    withdrawn: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: '#92400E',
      label: 'Consent Withdrawn',
      iconName: 'arrow-undo-circle' as const,
    },
  };

  const config = statusConfig[consent.status];

  const content = (
    <View
      className={`${config.bgColor} border ${config.borderColor} rounded-lg p-3`}
    >
      <View className="flex-row items-center">
        {/* @ts-expect-error Ionicons type incompatibility with React 19 types */}
        <Ionicons
          name={config.iconName}
          size={18}
          color={config.iconColor}
          style={{ marginRight: 8 }}
        />
        <Text className={`${config.textColor} font-medium text-sm`}>
          {config.label}
        </Text>
      </View>

      {showScopes && consent.status === 'granted' && consent.scopes.length > 0 && (
        <View className="mt-2">
          <Text className="text-slate-500 text-xs mb-1">Sharing:</Text>
          <View className="flex-row flex-wrap gap-1">
            {consent.scopes.map((scope: ConsentScope) => (
              <View key={scope} className="bg-white px-2 py-0.5 rounded">
                <Text className="text-xs text-slate-700">
                  {consentScopeLabels[scope]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Consent status: ${config.label}`}
        accessibilityHint="Tap to manage your consent settings"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

interface ConsentStatusInlineProps {
  hasActiveConsent: boolean;
  scopeCount?: number;
  onPress?: () => void;
}

/**
 * Compact inline indicator for consent status.
 */
export function ConsentStatusInline({
  hasActiveConsent,
  scopeCount = 0,
  onPress,
}: ConsentStatusInlineProps) {
  const content = (
    <View className="flex-row items-center">
      <View
        className={`w-2 h-2 rounded-full mr-2 ${
          hasActiveConsent ? 'bg-green-500' : 'bg-slate-400'
        }`}
      />
      <Text className="text-sm text-slate-600">
        {hasActiveConsent
          ? `Reusing ${scopeCount} data ${scopeCount === 1 ? 'type' : 'types'}`
          : 'Not reusing prior data'}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={
          hasActiveConsent
            ? `Reusing ${scopeCount} data types from prior application`
            : 'Not reusing data from prior application'
        }
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

export default ConsentStatusBadge;
