/**
 * View Components Models
 * Task 1.1: Define view component data schemas
 */

import { z } from 'zod';

/**
 * Chat message status types
 */
export const CHAT_MESSAGE_STATUS = ['sent', 'delivered', 'read'] as const;
export type ChatMessageStatus = (typeof CHAT_MESSAGE_STATUS)[number];

/**
 * Chat conversation types
 */
export const CHAT_CONVERSATION_TYPES = ['direct', 'group', 'channel', 'support'] as const;
export type ChatConversationType = (typeof CHAT_CONVERSATION_TYPES)[number];

/**
 * File type categories for view components
 */
export const FILE_TYPE_CATEGORIES = [
  'document',
  'image',
  'video',
  'audio',
  'archive',
  'spreadsheet',
  'presentation',
  'code',
  'other',
] as const;
export type FileTypeCategory = (typeof FILE_TYPE_CATEGORIES)[number];

/**
 * Chat participant summary
 */
export interface ChatParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

/**
 * Chat summary for view components
 */
export interface ChatSummary {
  conversationId: string;
  conversationType: ChatConversationType;
  title: string;
  participants: ChatParticipant[];
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
    status: ChatMessageStatus;
  };
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  updatedAt: Date;
}

/**
 * Chat summaries response
 */
export interface ChatSummariesResponse {
  summaries: ChatSummary[];
  totalCount: number;
  hasMore: boolean;
  cachedAt?: Date;
}

/**
 * File type metadata mapping
 */
export interface FileTypeMetadata {
  extension: string;
  mimeType: string;
  category: FileTypeCategory;
  displayName: string;
  iconName: string;
  previewSupported: boolean;
  maxSizeBytes: number;
  thumbnailGenerationSupported: boolean;
}

/**
 * File type metadata bundle
 */
export interface FileTypeMetadataBundle {
  tenantId: string;
  types: FileTypeMetadata[];
  version: string;
  updatedAt: Date;
}

/**
 * File type metadata response
 */
export interface FileTypeMetadataResponse {
  metadata: FileTypeMetadataBundle;
  cachedAt?: Date;
}

/**
 * View component access record for audit
 */
export interface ViewComponentAccessRecord {
  componentType: 'chat' | 'file';
  resourceId?: string;
  timestamp: Date;
  userId: string;
  userType: 'user' | 'candidate';
  tenantId: string;
}

/**
 * Query parameters for chat summary retrieval
 */
export interface GetChatSummaryQuery {
  conversationType?: ChatConversationType;
  limit?: number;
  offset?: number;
}

/**
 * Query parameters for file type metadata retrieval
 */
export interface GetFileTypeMetadataQuery {
  category?: FileTypeCategory;
}

// Validation schemas
export const chatConversationTypeSchema = z.enum(CHAT_CONVERSATION_TYPES);
export const chatMessageStatusSchema = z.enum(CHAT_MESSAGE_STATUS);
export const fileTypeCategorySchema = z.enum(FILE_TYPE_CATEGORIES);

export const getChatSummaryQuerySchema = z.object({
  conversationType: chatConversationTypeSchema.optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(100))
    .optional(),
  offset: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(0))
    .optional(),
});

export const getFileTypeMetadataQuerySchema = z.object({
  category: fileTypeCategorySchema.optional(),
});

/**
 * Check if conversation type is valid
 */
export function isValidConversationType(type: string): type is ChatConversationType {
  return CHAT_CONVERSATION_TYPES.includes(type as ChatConversationType);
}

/**
 * Check if file type category is valid
 */
export function isValidFileTypeCategory(category: string): category is FileTypeCategory {
  return FILE_TYPE_CATEGORIES.includes(category as FileTypeCategory);
}

/**
 * Default pagination values
 */
export const DEFAULT_CHAT_SUMMARY_LIMIT = 20;
export const DEFAULT_CHAT_SUMMARY_OFFSET = 0;
