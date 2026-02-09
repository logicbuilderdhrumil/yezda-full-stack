import type { IViewComponentsRepository, ChatSummaryQuery, FileTypeQuery } from '../../domain/ports/IViewComponentsRepository.js';
import type { ConversationType, FileCategory, ChatSummary, FileTypeMetadata, ViewComponentsHealth } from '../../domain/entities/view-components.entity.js';

const CONVERSATION_TYPES: ConversationType[] = [
  { id: 'direct', name: 'Direct Message', description: 'One-on-one conversation' },
  { id: 'group', name: 'Group Chat', description: 'Multi-participant conversation' },
  { id: 'channel', name: 'Channel', description: 'Topic-based channel' },
];

const FILE_CATEGORIES: FileCategory[] = [
  { id: 'document', name: 'Documents', description: 'Office documents' },
  { id: 'image', name: 'Images', description: 'Image files' },
  { id: 'archive', name: 'Archives', description: 'Compressed files' },
];

export class InMemoryViewComponentsRepository implements IViewComponentsRepository {
  private startTime = Date.now();

  async getConversationTypes(): Promise<ConversationType[]> { return CONVERSATION_TYPES; }
  async getFileCategories(): Promise<FileCategory[]> { return FILE_CATEGORIES; }
  async getChatSummaries(_tenantId: string, _query: ChatSummaryQuery): Promise<ChatSummary[]> { return []; }
  async getFileTypeMetadata(_query: FileTypeQuery): Promise<FileTypeMetadata[]> { return []; }
  async getHealth(): Promise<ViewComponentsHealth> {
    return { status: 'healthy', uptime: Date.now() - this.startTime, sloCompliance: { latency: true, availability: true } };
  }
}
