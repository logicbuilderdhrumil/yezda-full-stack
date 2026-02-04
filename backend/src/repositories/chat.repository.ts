/**
 * Chat Repository
 * Task 1.1, 1.2: Postgres persistence for conversations and messages
 */

import { query } from '../db/postgres.js';
import type {
  Conversation,
  Message,
  Participant,
  CreateConversationInput,
  SendMessageInput,
  ConversationFilters,
  MessageFilters,
  ChatPaginationOptions,
  ConversationStatus,
  MessageStatus,
} from '../models/chat.model.js';
import { randomUUID } from 'crypto';

type ConversationRow = {
  id: string;
  tenant_id: string;
  title: string | null;
  status: ConversationStatus;
  participants: string; // JSON array
  created_at: Date;
  updated_at: Date;
  last_message_content: string | null;
  last_message_sender_id: string | null;
  last_message_sent_at: Date | null;
  metadata: Record<string, unknown> | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  tenant_id: string;
  sender_id: string;
  sender_type: 'user' | 'candidate' | 'system';
  content: string;
  content_type: 'text' | 'file' | 'system';
  status: MessageStatus;
  created_at: Date;
  delivered_at: Date | null;
  read_by: string | null; // JSON object
  attachment_id: string | null;
  metadata: Record<string, unknown> | null;
  expires_at: Date | null;
};

function parseParticipants(json: string): Participant[] {
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

function rowToConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title ?? undefined,
    status: row.status,
    participants: parseParticipants(row.participants),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessage: row.last_message_content
      ? {
          content: row.last_message_content,
          senderId: row.last_message_sender_id!,
          sentAt: row.last_message_sent_at!,
        }
      : undefined,
    metadata: row.metadata ?? undefined,
  };
}

function rowToMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    tenantId: row.tenant_id,
    senderId: row.sender_id,
    senderType: row.sender_type,
    content: row.content,
    contentType: row.content_type,
    status: row.status,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at ?? undefined,
    readBy: row.read_by ? JSON.parse(row.read_by) : undefined,
    attachmentId: row.attachment_id ?? undefined,
    metadata: row.metadata ?? undefined,
    expiresAt: row.expires_at ?? undefined,
  };
}

export class ChatRepository {
  /**
   * Create a new conversation
   */
  async createConversation(input: CreateConversationInput): Promise<Conversation> {
    const id = randomUUID();
    const now = new Date();

    const participants: Participant[] = input.participantIds.map((p) => ({
      userId: p.userId,
      userType: p.userType,
      role: p.role ?? 'member',
      joinedAt: now,
    }));

    const result = await query<ConversationRow>(
      `INSERT INTO conversations (id, tenant_id, title, status, participants, created_at, updated_at, metadata)
       VALUES ($1, $2, $3, 'active', $4, $5, $5, $6)
       RETURNING *`,
      [
        id,
        input.tenantId,
        input.title ?? null,
        JSON.stringify(participants),
        now,
        input.metadata ? JSON.stringify(input.metadata) : null,
      ]
    );

    return rowToConversation(result.rows[0]);
  }

  /**
   * Find conversation by ID
   */
  async findConversationById(id: string): Promise<Conversation | undefined> {
    const result = await query<ConversationRow>(
      'SELECT * FROM conversations WHERE id = $1',
      [id]
    );
    return result.rows[0] ? rowToConversation(result.rows[0]) : undefined;
  }

  /**
   * Find conversation by ID with tenant verification
   */
  async findConversationByIdForTenant(
    id: string,
    tenantId: string
  ): Promise<Conversation | undefined> {
    const result = await query<ConversationRow>(
      'SELECT * FROM conversations WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rows[0] ? rowToConversation(result.rows[0]) : undefined;
  }

  /**
   * Check if a user is a participant of a conversation
   */
  async isParticipant(
    conversationId: string,
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS(
        SELECT 1 FROM conversations 
        WHERE id = $1 
        AND participants::jsonb @> $2::jsonb
      ) as exists`,
      [conversationId, JSON.stringify([{ userId, userType }])]
    );
    return result.rows[0]?.exists ?? false;
  }

  /**
   * List conversations for a user
   */
  async listConversationsForUser(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    filters: ConversationFilters = {},
    pagination: ChatPaginationOptions = {}
  ): Promise<{ conversations: Conversation[]; total: number }> {
    const limit = Math.min(pagination.limit ?? 20, 100);
    const participantMatch = JSON.stringify([{ userId, userType }]);

    const conditions: string[] = [
      'tenant_id = $1',
      `participants::jsonb @> $2::jsonb`,
    ];
    const params: unknown[] = [tenantId, participantMatch];
    let paramIndex = 3;

    if (filters.status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (pagination.cursor) {
      conditions.push(`updated_at < $${paramIndex}`);
      params.push(new Date(pagination.cursor));
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count (without cursor for actual total)
    const countConditions = conditions.filter((c) => !c.includes('updated_at <'));
    const countParams = filters.status ? params.slice(0, 3) : params.slice(0, 2);
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM conversations WHERE ${countConditions.join(' AND ')}`,
      countParams
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    params.push(limit + 1);
    const result = await query<ConversationRow>(
      `SELECT * FROM conversations 
       WHERE ${whereClause}
       ORDER BY updated_at DESC
       LIMIT $${paramIndex}`,
      params
    );

    const conversations = result.rows.slice(0, limit).map(rowToConversation);

    return { conversations, total };
  }

  /**
   * Create a new message
   */
  async createMessage(input: SendMessageInput, expiresAt?: Date): Promise<Message> {
    const id = randomUUID();
    const now = new Date();

    const result = await query<MessageRow>(
      `INSERT INTO messages (id, conversation_id, tenant_id, sender_id, sender_type, content, content_type, status, created_at, attachment_id, metadata, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent', $8, $9, $10, $11)
       RETURNING *`,
      [
        id,
        input.conversationId,
        input.tenantId,
        input.senderId,
        input.senderType,
        input.content,
        input.contentType ?? 'text',
        now,
        input.attachmentId ?? null,
        input.metadata ? JSON.stringify(input.metadata) : null,
        expiresAt ?? null,
      ]
    );

    // Update conversation's last message
    await query(
      `UPDATE conversations 
       SET updated_at = $1, last_message_content = $2, last_message_sender_id = $3, last_message_sent_at = $1
       WHERE id = $4`,
      [now, input.content.substring(0, 255), input.senderId, input.conversationId]
    );

    return rowToMessage(result.rows[0]);
  }

  /**
   * Find message by ID
   */
  async findMessageById(id: string): Promise<Message | undefined> {
    const result = await query<MessageRow>(
      'SELECT * FROM messages WHERE id = $1',
      [id]
    );
    return result.rows[0] ? rowToMessage(result.rows[0]) : undefined;
  }

  /**
   * List messages for a conversation (thread)
   */
  async listMessagesForConversation(
    conversationId: string,
    tenantId: string,
    filters: MessageFilters = {},
    pagination: ChatPaginationOptions = {}
  ): Promise<{ messages: Message[]; total: number }> {
    const limit = Math.min(pagination.limit ?? 50, 100);
    const conditions: string[] = ['conversation_id = $1', 'tenant_id = $2'];
    const params: unknown[] = [conversationId, tenantId];
    let paramIndex = 3;

    if (filters.since) {
      conditions.push(`created_at > $${paramIndex}`);
      params.push(filters.since);
      paramIndex++;
    }

    if (filters.before) {
      conditions.push(`created_at < $${paramIndex}`);
      params.push(filters.before);
      paramIndex++;
    }

    if (filters.senderId) {
      conditions.push(`sender_id = $${paramIndex}`);
      params.push(filters.senderId);
      paramIndex++;
    }

    if (pagination.cursor) {
      conditions.push(`created_at < $${paramIndex}`);
      params.push(new Date(pagination.cursor));
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count (without cursor)
    const countConditions = conditions.filter((c) => !c.startsWith('created_at <'));
    const countParams = params.slice(0, paramIndex - (pagination.cursor ? 1 : 0));
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM messages WHERE ${countConditions.join(' AND ')}`,
      countParams.slice(0, countConditions.length === 2 ? 2 : undefined)
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results - oldest first within page, but fetch newest pages first
    params.push(limit + 1);
    const result = await query<MessageRow>(
      `SELECT * FROM messages 
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex}`,
      params
    );

    // Reverse to show oldest first within page
    const messages = result.rows.slice(0, limit).reverse().map(rowToMessage);

    return { messages, total };
  }

  /**
   * Update message status
   */
  async updateMessageStatus(
    id: string,
    status: MessageStatus,
    deliveredAt?: Date
  ): Promise<Message | undefined> {
    const result = await query<MessageRow>(
      `UPDATE messages SET status = $1, delivered_at = $2 WHERE id = $3 RETURNING *`,
      [status, deliveredAt ?? null, id]
    );
    return result.rows[0] ? rowToMessage(result.rows[0]) : undefined;
  }

  /**
   * Mark message as read by a user
   */
  async markMessageAsRead(id: string, userId: string): Promise<Message | undefined> {
    const now = new Date();
    const result = await query<MessageRow>(
      `UPDATE messages 
       SET read_by = COALESCE(read_by::jsonb, '{}'::jsonb) || $1::jsonb,
           status = CASE WHEN status = 'delivered' THEN 'read' ELSE status END
       WHERE id = $2 
       RETURNING *`,
      [JSON.stringify({ [userId]: now.toISOString() }), id]
    );
    return result.rows[0] ? rowToMessage(result.rows[0]) : undefined;
  }

  /**
   * Update conversation status
   */
  async updateConversationStatus(
    id: string,
    status: ConversationStatus
  ): Promise<Conversation | undefined> {
    const result = await query<ConversationRow>(
      `UPDATE conversations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0] ? rowToConversation(result.rows[0]) : undefined;
  }

  /**
   * Add participant to conversation
   */
  async addParticipant(
    conversationId: string,
    participant: { userId: string; userType: 'user' | 'candidate'; role?: string }
  ): Promise<Conversation | undefined> {
    const now = new Date();
    const newParticipant: Participant = {
      userId: participant.userId,
      userType: participant.userType,
      role: (participant.role as Participant['role']) ?? 'member',
      joinedAt: now,
    };

    const result = await query<ConversationRow>(
      `UPDATE conversations 
       SET participants = participants::jsonb || $1::jsonb,
           updated_at = NOW()
       WHERE id = $2 
       RETURNING *`,
      [JSON.stringify([newParticipant]), conversationId]
    );
    return result.rows[0] ? rowToConversation(result.rows[0]) : undefined;
  }

  /**
   * Remove participant from conversation (marks as left)
   */
  async removeParticipant(
    conversationId: string,
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<Conversation | undefined> {
    // Get current participants
    const conv = await this.findConversationById(conversationId);
    if (!conv) return undefined;

    const now = new Date();
    const updatedParticipants = conv.participants.map((p) =>
      p.userId === userId && p.userType === userType
        ? { ...p, leftAt: now }
        : p
    );

    const result = await query<ConversationRow>(
      `UPDATE conversations 
       SET participants = $1::jsonb,
           updated_at = NOW()
       WHERE id = $2 
       RETURNING *`,
      [JSON.stringify(updatedParticipants), conversationId]
    );
    return result.rows[0] ? rowToConversation(result.rows[0]) : undefined;
  }

  /**
   * Cleanup expired messages
   */
  async cleanupExpiredMessages(): Promise<number> {
    const result = await query(
      'DELETE FROM messages WHERE expires_at IS NOT NULL AND expires_at < NOW()'
    );
    return result.rowCount ?? 0;
  }

  /**
   * Get participant role in conversation
   */
  async getParticipantRole(
    conversationId: string,
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<string | undefined> {
    const conv = await this.findConversationById(conversationId);
    if (!conv) return undefined;

    const participant = conv.participants.find(
      (p) => p.userId === userId && p.userType === userType && !p.leftAt
    );
    return participant?.role;
  }
}

export const chatRepository = new ChatRepository();
