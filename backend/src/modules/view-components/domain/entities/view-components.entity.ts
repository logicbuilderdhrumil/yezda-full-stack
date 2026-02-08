/**
 * View Components domain entity.
 */
export interface ConversationType {
  id: string;
  name: string;
  description: string;
}

export interface FileCategory {
  id: string;
  name: string;
  description: string;
}

export interface ChatSummary {
  id: string;
  title: string;
  lastMessage: string;
  participantCount: number;
  updatedAt: Date;
}

export interface FileTypeMetadata {
  extension: string;
  mimeType: string;
  category: string;
  icon: string;
  maxSizeBytes: number;
}

export interface ViewComponentsHealth {
  status: string;
  uptime: number;
  sloCompliance: Record<string, boolean>;
}
