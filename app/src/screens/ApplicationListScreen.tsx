/**
 * Application list screen showing assigned applications with status and due dates.
 * Task 1.1: Build assigned application list with status and due dates.
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  useApplicationStore,
  selectApplications,
  selectListScreenState,
  selectListError,
} from '../store/applicationStore';
import { ApplicationSummary, ApplicationStatus } from '../types/application.types';

interface ApplicationListScreenProps {
  onSelectApplication: (applicationId: string) => void;
}

/**
 * Get display label for application status.
 */
function getStatusLabel(status: ApplicationStatus): string {
  switch (status) {
    case 'pending':
      return 'Not Started';
    case 'in_progress':
      return 'In Progress';
    case 'submitted':
      return 'Submitted';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Needs Review';
    default:
      return status;
  }
}

/**
 * Get style classes for status badge (container and text separately for NativeWind).
 */
function getStatusStyle(status: ApplicationStatus): { container: string; text: string } {
  switch (status) {
    case 'pending':
      return { container: 'bg-gray-100', text: 'text-gray-700' };
    case 'in_progress':
      return { container: 'bg-blue-100', text: 'text-blue-700' };
    case 'submitted':
      return { container: 'bg-green-100', text: 'text-green-700' };
    case 'approved':
      return { container: 'bg-green-200', text: 'text-green-800' };
    case 'rejected':
      return { container: 'bg-red-100', text: 'text-red-700' };
    default:
      return { container: 'bg-gray-100', text: 'text-gray-700' };
  }
}

/**
 * Format due date for display.
 */
function formatDueDate(dueDate: string | null): string | null {
  if (!dueDate) return null;

  const date = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'Overdue';
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else {
    return `Due ${date.toLocaleDateString()}`;
  }
}

/**
 * Get due date style based on urgency.
 */
function getDueDateStyle(dueDate: string | null): string {
  if (!dueDate) return '';

  const date = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'text-red-600 font-semibold';
  } else if (diffDays <= 3) {
    return 'text-orange-600';
  } else {
    return 'text-gray-500';
  }
}

/**
 * Application card component.
 */
function ApplicationCard({
  application,
  onPress,
}: {
  application: ApplicationSummary;
  onPress: () => void;
}) {
  const dueDateText = formatDueDate(application.dueDate);
  const statusLabel = getStatusLabel(application.status);
  const statusStyles = getStatusStyle(application.status);
  const dueDateStyle = getDueDateStyle(application.dueDate);

  return (
    <TouchableOpacity
      className="bg-white rounded-lg border border-gray-200 p-4 mb-3 mx-4"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${application.title}, ${statusLabel}${dueDateText ? `, ${dueDateText}` : ''}`}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-semibold text-gray-900 flex-1 mr-2">
          {application.title}
        </Text>
        <View className={`px-2 py-1 rounded-full ${statusStyles.container}`}>
          <Text className={`text-xs font-medium ${statusStyles.text}`}>{statusLabel}</Text>
        </View>
      </View>

      {/* Progress bar */}
      {application.status === 'in_progress' && (
        <View className="mb-2">
          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${application.progress}%` }}
            />
          </View>
          <Text className="text-xs text-gray-500 mt-1">
            {application.progress}% complete
          </Text>
        </View>
      )}

      {/* Due date */}
      {dueDateText && application.status !== 'submitted' && application.status !== 'approved' && (
        <Text className={`text-sm ${dueDateStyle}`}>{dueDateText}</Text>
      )}

      {/* Submitted date */}
      {application.status === 'submitted' && application.updatedAt && (
        <Text className="text-sm text-gray-500">
          Submitted {new Date(application.updatedAt).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );
}

/**
 * Empty state component.
 */
function EmptyState() {
  return (
    <View className="flex-1 justify-center items-center px-6">
      <Text className="text-xl font-semibold text-gray-900 mb-2">
        No Applications
      </Text>
      <Text className="text-base text-gray-600 text-center">
        You don't have any assigned applications yet. Check back later.
      </Text>
    </View>
  );
}

/**
 * Error state component.
 */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="flex-1 justify-center items-center px-6">
      <Text className="text-xl font-semibold text-gray-900 mb-2">
        Something went wrong
      </Text>
      <Text className="text-base text-gray-600 text-center mb-4">{message}</Text>
      <TouchableOpacity
        className="bg-blue-600 px-6 py-3 rounded-lg"
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <Text className="text-white font-semibold">Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Application list screen.
 */
export function ApplicationListScreen({ onSelectApplication }: ApplicationListScreenProps) {
  const applications = useApplicationStore(selectApplications);
  const screenState = useApplicationStore(selectListScreenState);
  const error = useApplicationStore(selectListError);
  const loadApplications = useApplicationStore((state) => state.loadApplications);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleRefresh = useCallback(() => {
    loadApplications();
  }, [loadApplications]);

  const renderItem = useCallback(
    ({ item }: { item: ApplicationSummary }) => (
      <ApplicationCard
        application={item}
        onPress={() => onSelectApplication(item.id)}
      />
    ),
    [onSelectApplication]
  );

  const keyExtractor = useCallback((item: ApplicationSummary) => item.id, []);

  // Loading state
  if (screenState === 'loading' && applications.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-600 mt-4">Loading applications...</Text>
      </View>
    );
  }

  // Error state
  if (screenState === 'error' && applications.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <ErrorState message={error || 'Unable to load applications'} onRetry={handleRefresh} />
      </View>
    );
  }

  // Empty state
  if (applications.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <EmptyState />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={applications}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={screenState === 'loading'}
            onRefresh={handleRefresh}
            colors={['#2563EB']}
          />
        }
        ListHeaderComponent={
          <Text className="text-2xl font-bold text-gray-900 px-4 mb-4">
            Your Applications
          </Text>
        }
      />
    </View>
  );
}

export default ApplicationListScreen;
