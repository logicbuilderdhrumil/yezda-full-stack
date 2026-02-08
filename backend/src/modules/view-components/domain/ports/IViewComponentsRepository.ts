import type { ConversationType, FileCategory, ChatSummary, FileTypeMetadata, ViewComponentsHealth } from '../entities/view-components.entity.js';

export interface ChatSummaryQuery { conversationType?: string; limit?: number; }
export interface FileTypeQuery { category?: string; }

export interface IViewComponentsRepository {
  getConversationTypes(): Promise<ConversationType[]>;
  getFileCategories(): Promise<FileCategory[]>;
  getChatSummaries(tenantId: string, query: ChatSummaryQuery): Promise<ChatSummary[]>;
  getFileTypeMetadata(query: FileTypeQuery): Promise<FileTypeMetadata[]>;
  getHealth(): Promise<ViewComponentsHealth>;
}
