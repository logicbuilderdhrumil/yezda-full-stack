/**
 * Consent prompt screen for data reuse decision.
 * Task 1.2: Implement consent prompt and decision capture.
 */

import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Switch,
} from 'react-native';
import {
  useConsentStore,
  selectPrompt,
  selectSelectedScopes,
  selectConsentScreenState,
  selectConsentError,
} from '../store/consentStore';
import {
  consentCopy,
  consentScopeLabels,
  consentScopeDescriptions,
  ConsentScope,
} from '../types/consent.types';

interface ConsentPromptScreenProps {
  applicationId: string;
  onComplete: (accepted: boolean) => void;
  onSkip: () => void;
}

export function ConsentPromptScreen({
  applicationId,
  onComplete,
  onSkip,
}: ConsentPromptScreenProps) {
  const prompt = useConsentStore(selectPrompt);
  const selectedScopes = useConsentStore(selectSelectedScopes);
  const screenState = useConsentStore(selectConsentScreenState);
  const error = useConsentStore(selectConsentError);

  const loadConsentPrompt = useConsentStore((state) => state.loadConsentPrompt);
  const toggleScope = useConsentStore((state) => state.toggleScope);
  const selectAllScopes = useConsentStore((state) => state.selectAllScopes);
  const clearAllScopes = useConsentStore((state) => state.clearAllScopes);
  const submitConsentDecision = useConsentStore((state) => state.submitConsentDecision);
  const clearError = useConsentStore((state) => state.clearError);

  // Use ref to avoid stale closure and prevent infinite loop if parent doesn't memoize onSkip
  const onSkipRef = useRef(onSkip);
  onSkipRef.current = onSkip;

  useEffect(() => {
    async function checkForPrompt() {
      const hasPrompt = await loadConsentPrompt(applicationId);
      if (!hasPrompt) {
        onSkipRef.current();
      }
    }
    checkForPrompt();
  }, [applicationId, loadConsentPrompt]);

  const handleAccept = useCallback(async () => {
    if (selectedScopes.length === 0) {
      return; // Cannot accept without selecting at least one scope
    }
    const success = await submitConsentDecision(true);
    if (success) {
      onComplete(true);
    }
  }, [selectedScopes, submitConsentDecision, onComplete]);

  const handleDecline = useCallback(async () => {
    const success = await submitConsentDecision(false);
    if (success) {
      onComplete(false);
    }
  }, [submitConsentDecision, onComplete]);

  const handleScopeToggle = useCallback(
    (scope: ConsentScope) => () => {
      toggleScope(scope);
      if (error) {
        clearError();
      }
    },
    [toggleScope, error, clearError]
  );

  const allSelected = prompt?.availableScopes.length === selectedScopes.length;

  const handleToggleAll = useCallback(() => {
    if (allSelected) {
      clearAllScopes();
    } else {
      selectAllScopes();
    }
  }, [allSelected, clearAllScopes, selectAllScopes]);

  if (screenState === 'loading' && !prompt) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#0369A1" />
        <Text className="text-slate-500 mt-4">Loading...</Text>
      </View>
    );
  }

  if (!prompt) {
    return null;
  }

  const formattedDate = new Date(prompt.sourceDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="px-6 py-8"
    >
      {/* Header */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-slate-900">
          {consentCopy.promptTitle}
        </Text>
        <Text className="text-base text-slate-600 mt-2">
          {consentCopy.promptDescription}
        </Text>
      </View>

      {/* Source Info */}
      <View className="bg-navy-50 border border-navy-200 rounded-lg p-4 mb-6">
        <Text className="text-navy-800 text-sm">
          {consentCopy.sourceExplanation(prompt.sourceOrganization, formattedDate)}
        </Text>
      </View>

      {/* Error Banner */}
      {error && (
        <View
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          accessibilityRole="alert"
        >
          <Text className="text-red-700 text-sm text-center">{error}</Text>
        </View>
      )}

      {/* Scope Selection */}
      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-semibold text-slate-900">
            Select Data to Reuse
          </Text>
          <TouchableOpacity onPress={handleToggleAll}>
            <Text className="text-navy-600 text-sm font-medium">
              {allSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>

        {prompt.availableScopes.map((scope) => {
          const isSelected = selectedScopes.includes(scope);
          return (
            <View
              key={scope}
              className="flex-row items-center justify-between py-4 border-b border-slate-100"
            >
              <View className="flex-1 mr-4">
                <Text className="text-base font-medium text-slate-900">
                  {consentScopeLabels[scope]}
                </Text>
                <Text className="text-sm text-slate-500 mt-1">
                  {consentScopeDescriptions[scope]}
                </Text>
              </View>
              <Switch
                value={isSelected}
                onValueChange={handleScopeToggle(scope)}
                trackColor={{ false: '#CBD5E1', true: '#93bbee' }}
                thumbColor={isSelected ? '#0369A1' : '#F8FAFC'}
                accessibilityLabel={`Toggle ${consentScopeLabels[scope]}`}
                accessibilityRole="switch"
              />
            </View>
          );
        })}
      </View>

      {/* Privacy Notice */}
      <View className="bg-slate-50 rounded-lg p-4 mb-8">
        <Text className="text-sm text-slate-600">{consentCopy.privacyNotice}</Text>
      </View>

      {/* Action Buttons */}
      <View className="space-y-3">
        <TouchableOpacity
          className={`py-4 rounded-lg ${
            selectedScopes.length === 0 || screenState === 'loading'
              ? 'bg-navy-300'
              : 'bg-navy-600'
          }`}
          onPress={handleAccept}
          disabled={selectedScopes.length === 0 || screenState === 'loading'}
          accessibilityRole="button"
          accessibilityLabel={consentCopy.acceptButton}
          accessibilityState={{ disabled: selectedScopes.length === 0 || screenState === 'loading' }}
        >
          {screenState === 'loading' ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-base">
              {consentCopy.acceptButton}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="py-4 rounded-lg border border-slate-300"
          onPress={handleDecline}
          disabled={screenState === 'loading'}
          accessibilityRole="button"
          accessibilityLabel={consentCopy.declineButton}
        >
          <Text className="text-slate-700 text-center font-medium text-base">
            {consentCopy.declineButton}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default ConsentPromptScreen;
