import type { IViewComponentsRepository, ConversationType, FileCategory, ChatSummary, FileTypeMetadata, ViewComponentsHealth, ChatSummaryQuery, FileTypeQuery } from '../../domain/index.js';

export class GetConversationTypes {
  constructor(private repo: IViewComponentsRepository) {}
  async execute(): Promise<ConversationType[]> { return this.repo.getConversationTypes(); }
}

export class GetFileCategories {
  constructor(private repo: IViewComponentsRepository) {}
  async execute(): Promise<FileCategory[]> { return this.repo.getFileCategories(); }
}

export class GetChatSummaries {
  constructor(private repo: IViewComponentsRepository) {}
  async execute(tenantId: string, query: ChatSummaryQuery): Promise<ChatSummary[]> {
    return this.repo.getChatSummaries(tenantId, query);
  }
}

export class GetFileTypeMetadata {
  constructor(private repo: IViewComponentsRepository) {}
  async execute(query: FileTypeQuery): Promise<FileTypeMetadata[]> { return this.repo.getFileTypeMetadata(query); }
}

export class GetViewComponentsHealth {
  constructor(private repo: IViewComponentsRepository) {}
  async execute(): Promise<ViewComponentsHealth> { return this.repo.getHealth(); }
}
