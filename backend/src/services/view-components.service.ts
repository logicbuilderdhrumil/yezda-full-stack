/**
 * View Components Service
 * Task 1.2, 1.4, 1.5, 1.6, 1.7: Core view component business logic
 * with tenant isolation, RBAC, audit logging, caching, and SLO monitoring
 */

import type {
  ChatSummary,
  ChatSummariesResponse,
  ChatConversationType,
  FileTypeMetadata,
  FileTypeMetadataBundle,
  FileTypeMetadataResponse,
  FileTypeCategory,
} from '../models/view-components.model.js';
import {
  CHAT_CONVERSATION_TYPES,
  FILE_TYPE_CATEGORIES,
  DEFAULT_CHAT_SUMMARY_LIMIT,
  DEFAULT_CHAT_SUMMARY_OFFSET,
} from '../models/view-components.model.js';
import { auditService } from './audit.service.js';
import { metricsService } from './metrics.service.js';
import { cacheGet, cacheSet } from '../db/redis.js';

/**
 * View component cache TTL (5 minutes)
 */
const VIEW_COMPONENT_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * In-memory file type metadata store (replace with database in production)
 */
const fileTypeStore = new Map<string, FileTypeMetadataBundle>();

/**
 * In-memory chat summary store (replace with database in production)
 */
const chatSummaryStore = new Map<string, ChatSummary[]>();

/**
 * Generate default file type metadata
 */
function generateDefaultFileTypes(): FileTypeMetadata[] {
  const types: FileTypeMetadata[] = [
    // Documents
    { extension: 'pdf', mimeType: 'application/pdf', category: 'document', displayName: 'PDF Document', iconName: 'file-pdf', previewSupported: true, maxSizeBytes: 50 * 1024 * 1024, thumbnailGenerationSupported: true },
    { extension: 'doc', mimeType: 'application/msword', category: 'document', displayName: 'Word Document', iconName: 'file-word', previewSupported: true, maxSizeBytes: 25 * 1024 * 1024, thumbnailGenerationSupported: false },
    { extension: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'document', displayName: 'Word Document', iconName: 'file-word', previewSupported: true, maxSizeBytes: 25 * 1024 * 1024, thumbnailGenerationSupported: false },
    { extension: 'txt', mimeType: 'text/plain', category: 'document', displayName: 'Text File', iconName: 'file-text', previewSupported: true, maxSizeBytes: 10 * 1024 * 1024, thumbnailGenerationSupported: false },
    { extension: 'rtf', mimeType: 'application/rtf', category: 'document', displayName: 'Rich Text', iconName: 'file-text', previewSupported: true, maxSizeBytes: 10 * 1024 * 1024, thumbnailGenerationSupported: false },
    // Images
    { extension: 'jpg', mimeType: 'image/jpeg', category: 'image', displayName: 'JPEG Image', iconName: 'file-image', previewSupported: true, maxSizeBytes: 20 * 1024 * 1024, thumbnailGenerationSupported: true },
    { extension: 'jpeg', mimeType: 'image/jpeg', category: 'image', displayName: 'JPEG Image', iconName: 'file-image', previewSupported: true, maxSizeBytes: 20 * 1024 * 1024, thumbnailGenerationSupported: true },
    { extension: 'png', mimeType: 'image/png', category: 'image', displayName: 'PNG Image', iconName: 'file-image', previewSupported: true, maxSizeBytes: 20 * 1024 * 1024, thumbnailGenerationSupported: true },
    { extension: 'gif', mimeType: 'image/gif', category: 'image', displayName: 'GIF Image', iconName: 'file-image', previewSupported: true, maxSizeBytes: 10 * 1024 * 1024, thumbnailGenerationSupported: true },
    { extension: 'webp', mimeType: 'image/webp', category: 'image', displayName: 'WebP Image', iconName: 'file-image', previewSupported: true, maxSizeBytes: 20 * 1024 * 1024, thumbnailGenerationSupported: true },
    { extension: 'svg', mimeType: 'image/svg+xml', category: 'image', displayName: 'SVG Image', iconName: 'file-image', previewSupported: true, maxSizeBytes: 5 * 1024 * 1024, thumbnailGenerationSupported: false },
    // Videos
    { extension: 'mp4', mimeType: 'video/mp4', category: 'video', displayName: 'MP4 Video', iconName: 'file-video', previewSupported: true, maxSizeBytes: 500 * 1024 * 1024, thumbnailGenerationSupported: true },
    { extension: 'webm', mimeType: 'video/webm', category: 'video', displayName: 'WebM Video', iconName: 'file-video', previewSupported: true, maxSizeBytes: 500 * 1024 * 1024, thumbnailGenerationSupported: true },
    { extension: 'mov', mimeType: 'video/quicktime', category: 'video', displayName: 'QuickTime Video', iconName: 'file-video', previewSupported: false, maxSizeBytes: 500 * 1024 * 1024, thumbnailGenerationSupported: true },
    // Audio
    { extension: 'mp3', mimeType: 'audio/mpeg', category: 'audio', displayName: 'MP3 Audio', iconName: 'file-audio', previewSupported: true, maxSizeBytes: 50 * 1024 * 1024, thumbnailGenerationSupported: false },
    { extension: 'wav', mimeType: 'audio/wav', category: 'audio', displayName: 'WAV Audio', iconName: 'file-audio', previewSupported: true, maxSizeBytes: 100 * 1024 * 1024, thumbnailGenerationSupported: false },
    { extension: 'ogg', mimeType: 'audio/ogg', category: 'audio', displayName: 'OGG Audio', iconName: 'file-audio', previewSupported: true, maxSizeBytes: 50 * 1024 * 1024, thumbnailGenerationSupported: false },
    // Archives
    { extension: 'zip', mimeType: 'application/zip', category: 'archive', displayName: 'ZIP Archive', iconName: 'file-archive', previewSupported: false, maxSizeBytes: 100 * 1024 * 1024, thumbnailGenerationSupported: false },
    { extension: 'rar', mimeType: 'application/vnd.rar', category: 'archive', displayName: 'RAR Archive', iconName: 'file-archive', previewSupported: false, maxSizeBytes: 100 * 1024 * 1024, thumbnailGenerationSupported: false },
    { extension: '7z', mimeType: 'application/x-7z-compressed', category: 'archive', displayName: '7-Zip Archive', iconName: 'file-archive', previewSupported: false, maxSizeBytes: 100 * 1024 * 1024, thumbnailGenerationSupported: false },
    // Spreadsheets
    { extension: 'xls', mimeType: 'application/vnd.ms-excel', category: 'spreadsheet', displayName: 'Excel Spreadsheet', iconName: 'file-excel', previewSupported: true, maxSizeBytes: 25 * 1024 * 1024, thumbnailGenerationSupported: false },
    { extension: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', category: 'spreadsheet', displayName: 'Excel Spreadsheet', iconName: 'file-excel', previewSupported: true, maxSizeBytes: 25 * 1024 * 1024, thumbnailGenerationSupported: false },
    { extension: 'csv', mimeType: 'text/csv', category: 'spreadsheet', displayName: 'CSV File', iconName: 'file-spreadsheet', previewSupported: true, maxSizeBytes: 10 * 1024 * 1024, thumbnailGenerationSupported: false },
    // Presentations
    { extension: 'ppt', mimeType: 'application/vnd.ms-powerpoint', category: 'presentation', displayName: 'PowerPoint', iconName: 'file-powerpoint', previewSupported: true, maxSizeBytes: 50 * 1024 * 1024, thumbnailGenerationSupported: true },
    { extension: 'pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', category: 'presentation', displayName: 'PowerPoint', iconName: 'file-powerpoint', previewSupported: true, maxSizeBytes: 50 * 1024 * 1024, thumbnailGenerationSupported: true },
    // Code
    { extension: 'js', mimeType: 'application/javascript', category: 'code', displayName: 'JavaScript', iconName: 'file-code', previewSupported: true, maxSizeBytes: 5 * 1024 * 1024, thumbnailGenerationSupported: false },
    { extension: 'ts', mimeType: 'application/typescript', category: 'code', displayName: 'TypeScript', iconName: 'file-code', previewSupported: true, maxSizeBytes: 5 * 1024 * 1024, thumbnailGenerationSupported: false },
    { extension: 'json', mimeType: 'application/json', category: 'code', displayName: 'JSON', iconName: 'file-code', previewSupported: true, maxSizeBytes: 10 * 1024 * 1024, thumbnailGenerationSupported: false },
    { extension: 'xml', mimeType: 'application/xml', category: 'code', displayName: 'XML', iconName: 'file-code', previewSupported: true, maxSizeBytes: 10 * 1024 * 1024, thumbnailGenerationSupported: false },
    { extension: 'html', mimeType: 'text/html', category: 'code', displayName: 'HTML', iconName: 'file-code', previewSupported: true, maxSizeBytes: 5 * 1024 * 1024, thumbnailGenerationSupported: false },
    { extension: 'css', mimeType: 'text/css', category: 'code', displayName: 'CSS', iconName: 'file-code', previewSupported: true, maxSizeBytes: 5 * 1024 * 1024, thumbnailGenerationSupported: false },
  ];

  return types;
}

/**
 * Generate sample chat summaries for testing
 */
function generateSampleChatSummaries(tenantId: string): ChatSummary[] {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return [
    {
      conversationId: `${tenantId}-conv-1`,
      conversationType: 'direct',
      title: 'John Smith',
      participants: [
        { id: 'user-1', name: 'John Smith', isOnline: true },
        { id: 'user-2', name: 'Current User', isOnline: true },
      ],
      lastMessage: {
        id: 'msg-1',
        content: 'Looking forward to the meeting tomorrow!',
        senderId: 'user-1',
        senderName: 'John Smith',
        timestamp: oneHourAgo,
        status: 'delivered',
      },
      unreadCount: 2,
      isPinned: true,
      isMuted: false,
      updatedAt: oneHourAgo,
    },
    {
      conversationId: `${tenantId}-conv-2`,
      conversationType: 'group',
      title: 'Project Team',
      participants: [
        { id: 'user-1', name: 'John Smith', isOnline: true },
        { id: 'user-3', name: 'Jane Doe', isOnline: false, lastSeen: oneDayAgo },
        { id: 'user-4', name: 'Bob Wilson', isOnline: true },
      ],
      lastMessage: {
        id: 'msg-2',
        content: 'The deadline has been extended to next Friday.',
        senderId: 'user-3',
        senderName: 'Jane Doe',
        timestamp: oneDayAgo,
        status: 'read',
      },
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      updatedAt: oneDayAgo,
    },
    {
      conversationId: `${tenantId}-conv-3`,
      conversationType: 'support',
      title: 'Help & Support',
      participants: [
        { id: 'support-1', name: 'Support Team', isOnline: true },
      ],
      lastMessage: {
        id: 'msg-3',
        content: 'How can we help you today?',
        senderId: 'support-1',
        senderName: 'Support Team',
        timestamp: now,
        status: 'sent',
      },
      unreadCount: 1,
      isPinned: false,
      isMuted: false,
      updatedAt: now,
    },
    {
      conversationId: `${tenantId}-conv-4`,
      conversationType: 'channel',
      title: 'Announcements',
      participants: [],
      lastMessage: {
        id: 'msg-4',
        content: 'New feature release: View Components!',
        senderId: 'system',
        senderName: 'System',
        timestamp: oneDayAgo,
        status: 'delivered',
      },
      unreadCount: 0,
      isPinned: true,
      isMuted: true,
      updatedAt: oneDayAgo,
    },
  ];
}

/**
 * Initialize default configurations
 */
function initializeDefaultConfigurations(): void {
  const defaultBundle: FileTypeMetadataBundle = {
    tenantId: 'default',
    types: generateDefaultFileTypes(),
    version: '1.0.0',
    updatedAt: new Date(),
  };

  fileTypeStore.set('default', defaultBundle);
  chatSummaryStore.set('default', generateSampleChatSummaries('default'));
}

// Initialize on module load
initializeDefaultConfigurations();

export interface ViewComponentsResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export class ViewComponentsService {
  /**
   * Get chat summaries
   * Task 1.2: Chat summary retrieval
   * Task 1.4: Tenant scoping
   * Task 1.5: Audit logging
   * Task 1.6: Caching
   */
  async getChatSummaries(
    tenantId: string,
    conversationType?: ChatConversationType,
    limit: number = DEFAULT_CHAT_SUMMARY_LIMIT,
    offset: number = DEFAULT_CHAT_SUMMARY_OFFSET,
    userId?: string,
    userType?: 'user' | 'candidate',
    ipAddress?: string
  ): Promise<ViewComponentsResult<ChatSummariesResponse>> {
    const startTime = Date.now();
    const cacheKey = `view-chat:${tenantId}:${conversationType ?? 'all'}:${limit}:${offset}`;

    // Task 1.6: Check cache first
    try {
      const cached = await cacheGet<ChatSummariesResponse>(cacheKey);
      if (cached) {
        metricsService.recordViewComponentsCacheHit();
        metricsService.recordViewComponentsRequest('chat', true, Date.now() - startTime);

        // Task 1.5: Audit log (lightweight for cached responses)
        this.logViewComponentAccess({
          userId,
          userType,
          tenantId,
          componentType: 'chat',
          cached: true,
          ipAddress,
        });

        return { success: true, data: { ...cached, cachedAt: new Date() } };
      }
    } catch (error) {
      console.warn('[ViewComponentsService] Cache error:', error);
    }

    metricsService.recordViewComponentsCacheMiss();

    // Task 1.4: Get tenant-scoped chat summaries
    let summaries = chatSummaryStore.get(tenantId);
    if (!summaries) {
      // Fall back to default for demo, generate tenant-specific data
      summaries = generateSampleChatSummaries(tenantId);
      chatSummaryStore.set(tenantId, summaries);
    }

    // Filter by conversation type if specified
    let filteredSummaries = summaries;
    if (conversationType) {
      filteredSummaries = summaries.filter((s) => s.conversationType === conversationType);
    }

    // Apply pagination
    const totalCount = filteredSummaries.length;
    const paginatedSummaries = filteredSummaries.slice(offset, offset + limit);
    const hasMore = offset + limit < totalCount;

    const response: ChatSummariesResponse = {
      summaries: paginatedSummaries,
      totalCount,
      hasMore,
    };

    // Task 1.6: Cache the response
    try {
      await cacheSet(cacheKey, response, VIEW_COMPONENT_CACHE_TTL_MS);
    } catch (error) {
      console.warn('[ViewComponentsService] Failed to cache chat summaries:', error);
    }

    // Task 1.5: Audit log
    this.logViewComponentAccess({
      userId,
      userType,
      tenantId,
      componentType: 'chat',
      cached: false,
      ipAddress,
    });

    metricsService.recordViewComponentsRequest('chat', true, Date.now() - startTime);
    return { success: true, data: response };
  }

  /**
   * Get file type metadata
   * Task 1.2: File type metadata retrieval
   * Task 1.4: Tenant scoping
   * Task 1.5: Audit logging
   * Task 1.6: Caching
   */
  async getFileTypeMetadata(
    tenantId: string,
    category?: FileTypeCategory,
    userId?: string,
    userType?: 'user' | 'candidate',
    ipAddress?: string
  ): Promise<ViewComponentsResult<FileTypeMetadataResponse>> {
    const startTime = Date.now();
    const cacheKey = `view-file:${tenantId}:${category ?? 'all'}`;

    // Task 1.6: Check cache first
    try {
      const cached = await cacheGet<FileTypeMetadataResponse>(cacheKey);
      if (cached) {
        metricsService.recordViewComponentsCacheHit();
        metricsService.recordViewComponentsRequest('file', true, Date.now() - startTime);

        this.logViewComponentAccess({
          userId,
          userType,
          tenantId,
          componentType: 'file',
          cached: true,
          ipAddress,
        });

        return { success: true, data: { ...cached, cachedAt: new Date() } };
      }
    } catch (error) {
      console.warn('[ViewComponentsService] Cache error:', error);
    }

    metricsService.recordViewComponentsCacheMiss();

    // Task 1.4: Get tenant-scoped file type metadata
    let bundle = fileTypeStore.get(tenantId);
    if (!bundle) {
      bundle = fileTypeStore.get('default');
    }

    if (!bundle) {
      metricsService.recordViewComponentsRequest('file', false, Date.now() - startTime);
      return {
        success: false,
        error: 'File type metadata not found',
        errorCode: 'METADATA_NOT_FOUND',
      };
    }

    // Filter by category if specified
    let types = bundle.types;
    if (category) {
      types = types.filter((t) => t.category === category);
    }

    const response: FileTypeMetadataResponse = {
      metadata: {
        ...bundle,
        types,
      },
    };

    // Task 1.6: Cache the response
    try {
      await cacheSet(cacheKey, response, VIEW_COMPONENT_CACHE_TTL_MS);
    } catch (error) {
      console.warn('[ViewComponentsService] Failed to cache file type metadata:', error);
    }

    // Task 1.5: Audit log
    this.logViewComponentAccess({
      userId,
      userType,
      tenantId,
      componentType: 'file',
      cached: false,
      ipAddress,
    });

    metricsService.recordViewComponentsRequest('file', true, Date.now() - startTime);
    return { success: true, data: response };
  }

  /**
   * Get available conversation types
   */
  getAvailableConversationTypes(): ChatConversationType[] {
    return [...CHAT_CONVERSATION_TYPES];
  }

  /**
   * Get available file type categories
   */
  getAvailableFileTypeCategories(): FileTypeCategory[] {
    return [...FILE_TYPE_CATEGORIES];
  }

  /**
   * Check SLO compliance
   * Task 1.7: SLO monitoring
   */
  checkSLOs(): { met: boolean; violations: string[] } {
    return metricsService.checkViewComponentsSLOs();
  }

  /**
   * Log view component access for audit
   * Task 1.5: Audit logging
   */
  private logViewComponentAccess(params: {
    userId?: string;
    userType?: 'user' | 'candidate';
    tenantId: string;
    componentType: 'chat' | 'file';
    cached: boolean;
    ipAddress?: string;
  }): void {
    if (params.userId) {
      auditService.logViewComponentAccess({
        userId: params.userId,
        userType: params.userType ?? 'user',
        tenantId: params.tenantId,
        componentType: params.componentType,
        cached: params.cached,
        channel: 'api',
        ipAddress: params.ipAddress,
      });
    }
  }
}

export const viewComponentsService = new ViewComponentsService();
