/**
 * Consent review and update screen.
 * Task 1.4: Add consent review and update screen.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import {
  useConsentStore,
  selectConsents,
  selectConsentScreenState,
  selectConsentError,
} from '../store/consentStore';
import {
  ConsentDecision,
  consentCopy,
  consentScopeLabels,
  ConsentScope,
} from '../types/consent.types';

interface ConsentReviewScreenProps {
  onBack?: () => void;
}

export function ConsentReviewScreen({ onBack }: ConsentReviewScreenProps) {
  const consents = useConsentStore(selectConsents);
  const screenState = useConsentStore(selectConsentScreenState);
  const error = useConsentStore(selectConsentError);

  const loadConsentHistory = useConsentStore((state) => state.loadConsentHistory);
  const withdrawConsent = useConsentStore((state) => state.withdrawConsent);
  const clearError = useConsentStore((state) => state.clearError);

  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [selectedConsentId, setSelectedConsentId] = useState<string | null>(null);

  useEffect(() => {
    loadConsentHistory();
  }, [loadConsentHistory]);

  const handleWithdrawPress = useCallback((consentId: string) => {
    setSelectedConsentId(consentId);
    setWithdrawModalVisible(true);
  }, []);

  const handleConfirmWithdraw = useCallback(async () => {
    if (!selectedConsentId) return;

    setWithdrawModalVisible(false);
    const success = await withdrawConsent(selectedConsentId);

    if (success) {
      Alert.alert('Success', consentCopy.withdrawnSuccess);
    }

    setSelectedConsentId(null);
  }, [selectedConsentId, withdrawConsent]);

  const handleCancelWithdraw = useCallback(() => {
    setWithdrawModalVisible(false);
    setSelectedConsentId(null);
  }, []);

  const activeConsents = consents.filter((c) => c.status === 'granted');
  const historyConsents = consents.filter((c) => c.status !== 'granted');

  if (screenState === 'loading' && consents.length === 0) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-500 mt-4">Loading consent history...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-8"
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900">
            Data Reuse Consents
          </Text>
          <Text className="text-base text-gray-600 mt-2">
            Review and manage your consent decisions for data reuse.
          </Text>
        </View>

        {/* Error Banner */}
        {error && (
          <TouchableOpacity
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
            onPress={clearError}
            accessibilityRole="alert"
          >
            <Text className="text-red-700 text-sm text-center">{error}</Text>
            <Text className="text-red-500 text-xs text-center mt-1">
              Tap to dismiss
            </Text>
          </TouchableOpacity>
        )}

        {/* Active Consents */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Active Consents
          </Text>

          {activeConsents.length === 0 ? (
            <View className="bg-gray-50 rounded-lg p-4">
              <Text className="text-gray-500 text-center">
                No active consents
              </Text>
            </View>
          ) : (
            activeConsents.map((consent) => (
              <ConsentCard
                key={consent.id}
                consent={consent}
                onWithdraw={() => handleWithdrawPress(consent.id)}
                isLoading={screenState === 'loading'}
              />
            ))
          )}
        </View>

        {/* History */}
        {historyConsents.length > 0 && (
          <View>
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              History
            </Text>
            {historyConsents.map((consent) => (
              <ConsentCard
                key={consent.id}
                consent={consent}
                isHistory
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Back Button */}
      {onBack && (
        <View className="px-6 py-4 border-t border-gray-200">
          <TouchableOpacity
            className="py-3 rounded-lg border border-gray-300"
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text className="text-gray-700 text-center font-medium">
              Back
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Withdraw Confirmation Modal */}
      <Modal
        visible={withdrawModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelWithdraw}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-xl p-6 w-full max-w-sm">
            <Text className="text-xl font-bold text-gray-900 mb-2">
              {consentCopy.withdrawTitle}
            </Text>
            <Text className="text-gray-600 mb-6">
              {consentCopy.withdrawMessage}
            </Text>

            <TouchableOpacity
              className="bg-red-600 py-3 rounded-lg mb-3"
              onPress={handleConfirmWithdraw}
              accessibilityRole="button"
              accessibilityLabel={consentCopy.withdrawButton}
            >
              <Text className="text-white text-center font-semibold">
                {consentCopy.withdrawButton}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-3 rounded-lg border border-gray-300"
              onPress={handleCancelWithdraw}
              accessibilityRole="button"
              accessibilityLabel={consentCopy.cancelButton}
            >
              <Text className="text-gray-700 text-center font-medium">
                {consentCopy.cancelButton}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface ConsentCardProps {
  consent: ConsentDecision;
  onWithdraw?: () => void;
  isHistory?: boolean;
  isLoading?: boolean;
}

function ConsentCard({
  consent,
  onWithdraw,
  isHistory = false,
  isLoading = false,
}: ConsentCardProps) {
  const statusColors: Record<string, string> = {
    granted: 'bg-green-100 text-green-800',
    denied: 'bg-gray-100 text-gray-600',
    withdrawn: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-blue-100 text-blue-800',
  };

  const statusLabels: Record<string, string> = {
    granted: 'Active',
    denied: 'Declined',
    withdrawn: 'Withdrawn',
    pending: 'Pending',
  };

  const formattedDate = consent.grantedAt
    ? new Date(consent.grantedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : consent.withdrawnAt
    ? new Date(consent.withdrawnAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';

  return (
    <View className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-base font-medium text-gray-900">
            Application Data Reuse
          </Text>
          <Text className="text-sm text-gray-500 mt-1">{formattedDate}</Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${statusColors[consent.status]}`}>
          <Text className="text-xs font-medium">
            {statusLabels[consent.status]}
          </Text>
        </View>
      </View>

      {/* Scopes */}
      <View className="mb-3">
        <Text className="text-sm text-gray-500 mb-2">Shared data:</Text>
        <View className="flex-row flex-wrap gap-2">
          {consent.scopes.map((scope: ConsentScope) => (
            <View
              key={scope}
              className="bg-gray-100 px-2 py-1 rounded"
            >
              <Text className="text-xs text-gray-700">
                {consentScopeLabels[scope]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Withdraw Button (only for active consents) */}
      {!isHistory && onWithdraw && (
        <TouchableOpacity
          className="border border-red-300 rounded-lg py-2 mt-2"
          onPress={onWithdraw}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Withdraw this consent"
        >
          <Text className="text-red-600 text-center text-sm font-medium">
            Withdraw Consent
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default ConsentReviewScreen;
