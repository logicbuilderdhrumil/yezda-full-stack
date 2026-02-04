/**
 * Chat Service
 * Task 1.2, 1.3: Conversation and message lifecycle operations
 * Task 1.5: Participant access checks
 * Task 1.6: Audit logging for chat access
 */

import { chatRepository } from '../repositories/chat.repository.js';
import { auditService } from './audit.service.js';
import { socketService } from './socket.service.js';
import { chatMetricsService } from './chat-metrics.service.js';
import {
  calculateMessageExpirationDate,
  type ChatAuditEventType,
  type ChatOperationResult,
  type ChatPaginationOptions,
  type ConversationFilters,
  type ConversationListResult,
  type CreateConversationInput,
  type MessageFilters,
  type MessageListResult,
  type SendMessageInput,
} from '../models/chat.model.js';

/** Socket events for chat realtime updates */
const CHAT_EVENTS = {
  NEW_MESSAGE: 'chat:new_message',
  MESSAGE_DELIVERED: 'chat:message_delivered',
  MESSAGE_READ: 'chat:message_read',
  CONVERSATION_UPDATED: 'chat:conversation_updated',
  PARTICIPANT_JOINED: 'chat:participant_joined',
  PARTICIPANT_LEFT: 'chat:participant_left',
} as const;

/**
 * Request context for audit logging
 */
interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
  channel: 'web' | 'mobile' | 'api' | 'socket';
}

export class ChatService {
  /**
   * Create a new conversation
   */
  async createConversation(
    input: CreateConversationInput,
    creatorId: string,
    creatorType: 'user' | 'candidate',
    requestContext: RequestContext
  ): Promise<ChatOperationResult> {
    const start = Date.now();

    try {
      // Ensure creator is in participants as owner
      const hasCreator = input.participantIds.some(
        (p) => p.userId === creatorId && p.userType === creatorType
      );

      const participantIds = hasCreator
        ? input.participantIds.map((p) =>
            p.userId === creatorId && p.userType === creatorType
              ? { ...p, role: 'owner' as const }
              : p
          )
        : [
            { userId: creatorId, userType: creatorType, role: 'owner' as const },
            ...input.participantIds,
          ];

      const conversation = await chatRepository.createConversation({
        ...input,
        participantIds,
      });

      this.logChatEvent('CONVERSATION_CREATED', {
        tenantId: input.tenantId,
        userId: creatorId,
        userType: creatorType,
        conversationId: conversation.id,
        success: true,
        ...requestContext,
      });

      chatMetricsService.recordConversationCreate(true, Date.now() - start);

      return { success: true, data: conversation };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logChatEvent('CONVERSATION_CREATED', {
        tenantId: input.tenantId,
        userId: creatorId,
        userType: creatorType,
        success: false,
        errorMessage,
        ...requestContext,
      });

      chatMetricsService.recordConversationCreate(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to create conversation',
        errorCode: 'CONVERSATION_CREATE_ERROR',
      };
    }
  }

  /**
   * List conversations for a user
   */
  async listConversations(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    filters: ConversationFilters = {},
    pagination: ChatPaginationOptions = {},
    requestContext: RequestContext
  ): Promise<ChatOperationResult> {
    const start = Date.now();

    try {
      const limit = Math.min(pagination.limit ?? 20, 100);
      const { conversations, total } = await chatRepository.listConversationsForUser(
        tenantId,
        userId,
        userType,
        filters,
        { ...pagination, limit: limit + 1 }
      );

      const hasMore = conversations.length > limit;
      const resultConversations = hasMore ? conversations.slice(0, -1) : conversations;
      const nextCursor = hasMore
        ? resultConversations[resultConversations.length - 1]?.updatedAt.toISOString()
        : undefined;

      const result: ConversationListResult = {
        conversations: resultConversations,
        total,
        hasMore,
        nextCursor,
      };

      this.logChatEvent('CONVERSATION_LIST_ACCESSED', {
        tenantId,
        userId,
        userType,
        success: true,
        metadata: {
          count: resultConversations.length,
          total,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
        },
        ...requestContext,
      });

      chatMetricsService.recordConversationList(true, Date.now() - start);

      return { success: true, data: result };
    } catch (_error) {
      chatMetricsService.recordConversationList(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to list conversations',
        errorCode: 'CONVERSATION_LIST_ERROR',
      };
    }
  }

  /**
   * Get conversation thread (messages)
   */
  async getThread(
    conversationId: string,
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    filters: MessageFilters = {},
    pagination: ChatPaginationOptions = {},
    requestContext: RequestContext
  ): Promise<ChatOperationResult> {
    const start = Date.now();

    try {
      // Task 1.5: Verify participant access
      const isParticipant = await chatRepository.isParticipant(
        conversationId,
        userId,
        userType
      );

      if (!isParticipant) {
        this.logChatEvent('CONVERSATION_ACCESS_DENIED', {
          tenantId,
          userId,
          userType,
          conversationId,
          success: false,
          errorMessage: 'User is not a participant',
          ...requestContext,
        });

        chatMetricsService.recordAccessDenied();

        return {
          success: false,
          error: 'Conversation not found',
          errorCode: 'CONVERSATION_NOT_FOUND',
        };
      }

      const limit = Math.min(pagination.limit ?? 50, 100);
      const { messages, total } = await chatRepository.listMessagesForConversation(
        conversationId,
        tenantId,
        filters,
        { ...pagination, limit: limit + 1 }
      );

      const hasMore = messages.length > limit;
      const resultMessages = hasMore ? messages.slice(0, -1) : messages;
      const nextCursor = hasMore
        ? resultMessages[resultMessages.length - 1]?.createdAt.toISOString()
        : undefined;

      const result: MessageListResult = {
        messages: resultMessages,
        total,
        hasMore,
        nextCursor,
      };

      // Task 1.6: Audit logging for chat access
      this.logChatEvent('CONVERSATION_ACCESSED', {
        tenantId,
        userId,
        userType,
        conversationId,
        success: true,
        metadata: {
          messageCount: resultMessages.length,
          total,
        },
        ...requestContext,
      });

      chatMetricsService.recordThreadRead(true, Date.now() - start);

      return { success: true, data: result };
    } catch (_error) {
      chatMetricsService.recordThreadRead(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to retrieve conversation thread',
        errorCode: 'THREAD_READ_ERROR',
      };
    }
  }

  /**
   * Send a message to a conversation
   * Task 1.3: Message send with realtime broadcast
   */
  async sendMessage(
    input: SendMessageInput,
    requestContext: RequestContext
  ): Promise<ChatOperationResult> {
    const start = Date.now();

    try {
      // Task 1.5: Verify participant access
      const isParticipant = await chatRepository.isParticipant(
        input.conversationId,
        input.senderId,
        input.senderType
      );

      if (!isParticipant) {
        this.logChatEvent('CONVERSATION_ACCESS_DENIED', {
          tenantId: input.tenantId,
          userId: input.senderId,
          userType: input.senderType,
          conversationId: input.conversationId,
          success: false,
          errorMessage: 'User is not a participant',
          ...requestContext,
        });

        chatMetricsService.recordAccessDenied();

        return {
          success: false,
          error: 'Conversation not found',
          errorCode: 'CONVERSATION_NOT_FOUND',
        };
      }

      // Get conversation for retention policy
      const conversation = await chatRepository.findConversationById(input.conversationId);
      const expiresAt = conversation
        ? calculateMessageExpirationDate(conversation.status)
        : undefined;

      // Persist message
      const message = await chatRepository.createMessage(input, expiresAt);

      this.logChatEvent('MESSAGE_SENT', {
        tenantId: input.tenantId,
        userId: input.senderId,
        userType: input.senderType,
        conversationId: input.conversationId,
        messageId: message.id,
        success: true,
        ...requestContext,
      });

      chatMetricsService.recordMessageSend(true, Date.now() - start);

      // Broadcast to all participants via Socket.IO
      if (conversation) {
        this.broadcastToParticipants(conversation, CHAT_EVENTS.NEW_MESSAGE, {
          conversationId: input.conversationId,
          message,
        });
      }

      return { success: true, data: message };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logChatEvent('MESSAGE_SEND_FAILED', {
        tenantId: input.tenantId,
        userId: input.senderId,
        userType: input.senderType,
        conversationId: input.conversationId,
        success: false,
        errorMessage,
        ...requestContext,
      });

      chatMetricsService.recordMessageSend(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to send message',
        errorCode: 'MESSAGE_SEND_ERROR',
      };
    }
  }

  /**
   * Mark message as delivered
   */
  async markMessageDelivered(
    messageId: string,
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    requestContext: RequestContext
  ): Promise<ChatOperationResult> {
    const start = Date.now();

    try {
      const message = await chatRepository.findMessageById(messageId);
      if (!message || message.tenantId !== tenantId) {
        return {
          success: false,
          error: 'Message not found',
          errorCode: 'MESSAGE_NOT_FOUND',
        };
      }

      // Verify participant access
      const isParticipant = await chatRepository.isParticipant(
        message.conversationId,
        userId,
        userType
      );

      if (!isParticipant) {
        chatMetricsService.recordAccessDenied();
        return {
          success: false,
          error: 'Message not found',
          errorCode: 'MESSAGE_NOT_FOUND',
        };
      }

      const updatedMessage = await chatRepository.updateMessageStatus(
        messageId,
        'delivered',
        new Date()
      );

      if (!updatedMessage) {
        return {
          success: false,
          error: 'Failed to update message status',
          errorCode: 'MESSAGE_UPDATE_ERROR',
        };
      }

      this.logChatEvent('MESSAGE_DELIVERED', {
        tenantId,
        userId,
        userType,
        messageId,
        conversationId: message.conversationId,
        success: true,
        ...requestContext,
      });

      chatMetricsService.recordMessageDelivery(true, Date.now() - start);

      // Broadcast delivery status
      const conversation = await chatRepository.findConversationById(message.conversationId);
      if (conversation) {
        this.broadcastToParticipants(conversation, CHAT_EVENTS.MESSAGE_DELIVERED, {
          conversationId: message.conversationId,
          messageId,
          deliveredTo: userId,
          deliveredAt: updatedMessage.deliveredAt,
        });
      }

      return { success: true, data: updatedMessage };
    } catch (_error) {
      chatMetricsService.recordMessageDelivery(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to mark message as delivered',
        errorCode: 'MESSAGE_DELIVERY_ERROR',
      };
    }
  }

  /**
   * Mark message as read
   */
  async markMessageRead(
    messageId: string,
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    requestContext: RequestContext
  ): Promise<ChatOperationResult> {
    try {
      const message = await chatRepository.findMessageById(messageId);
      if (!message || message.tenantId !== tenantId) {
        return {
          success: false,
          error: 'Message not found',
          errorCode: 'MESSAGE_NOT_FOUND',
        };
      }

      // Verify participant access
      const isParticipant = await chatRepository.isParticipant(
        message.conversationId,
        userId,
        userType
      );

      if (!isParticipant) {
        chatMetricsService.recordAccessDenied();
        return {
          success: false,
          error: 'Message not found',
          errorCode: 'MESSAGE_NOT_FOUND',
        };
      }

      const updatedMessage = await chatRepository.markMessageAsRead(messageId, userId);

      if (!updatedMessage) {
        return {
          success: false,
          error: 'Failed to update message status',
          errorCode: 'MESSAGE_UPDATE_ERROR',
        };
      }

      this.logChatEvent('MESSAGE_READ', {
        tenantId,
        userId,
        userType,
        messageId,
        conversationId: message.conversationId,
        success: true,
        ...requestContext,
      });

      // Broadcast read status
      const conversation = await chatRepository.findConversationById(message.conversationId);
      if (conversation) {
        this.broadcastToParticipants(conversation, CHAT_EVENTS.MESSAGE_READ, {
          conversationId: message.conversationId,
          messageId,
          readBy: userId,
          readAt: new Date(),
        });
      }

      return { success: true, data: updatedMessage };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to mark message as read',
        errorCode: 'MESSAGE_READ_ERROR',
      };
    }
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(
    conversationId: string,
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    requestContext: RequestContext
  ): Promise<ChatOperationResult> {
    try {
      // Verify participant and role
      const role = await chatRepository.getParticipantRole(
        conversationId,
        userId,
        userType
      );

      if (!role) {
        chatMetricsService.recordAccessDenied();
        return {
          success: false,
          error: 'Conversation not found',
          errorCode: 'CONVERSATION_NOT_FOUND',
        };
      }

      if (role !== 'owner' && role !== 'admin') {
        chatMetricsService.recordAccessDenied();
        return {
          success: false,
          error: 'Insufficient permissions',
          errorCode: 'INSUFFICIENT_PERMISSIONS',
        };
      }

      const conversation = await chatRepository.updateConversationStatus(
        conversationId,
        'archived'
      );

      if (!conversation) {
        return {
          success: false,
          error: 'Failed to archive conversation',
          errorCode: 'CONVERSATION_ARCHIVE_ERROR',
        };
      }

      this.logChatEvent('CONVERSATION_ARCHIVED', {
        tenantId,
        userId,
        userType,
        conversationId,
        success: true,
        ...requestContext,
      });

      // Broadcast update
      this.broadcastToParticipants(conversation, CHAT_EVENTS.CONVERSATION_UPDATED, {
        conversationId,
        status: 'archived',
      });

      return { success: true, data: conversation };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to archive conversation',
        errorCode: 'CONVERSATION_ARCHIVE_ERROR',
      };
    }
  }

  /**
   * Cleanup expired messages (retention policy)
   */
  async cleanupExpiredMessages(): Promise<number> {
    try {
      const count = await chatRepository.cleanupExpiredMessages();
      console.log(`[Chat] Cleaned up ${count} expired messages`);
      return count;
    } catch (error) {
      console.error('[Chat] Failed to cleanup expired messages:', error);
      return 0;
    }
  }

  /**
   * Broadcast event to all conversation participants
   */
  private broadcastToParticipants(
    conversation: { participants: Array<{ userId: string; leftAt?: Date }> },
    event: string,
    payload: unknown
  ): void {
    try {
      const activeParticipants = conversation.participants.filter((p) => !p.leftAt);

      for (const participant of activeParticipants) {
        socketService.emitToUser(participant.userId, event, payload);
      }

      chatMetricsService.recordBroadcast(true);
    } catch (error) {
      console.error('[Chat] Failed to broadcast to participants:', error);
      chatMetricsService.recordBroadcast(false);
    }
  }

  /**
   * Log chat audit event
   */
  private logChatEvent(
    eventType: ChatAuditEventType,
    params: {
      tenantId: string;
      userId: string;
      userType: 'user' | 'candidate';
      conversationId?: string;
      messageId?: string;
      success: boolean;
      errorMessage?: string;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
      channel: 'web' | 'mobile' | 'api' | 'socket';
    }
  ): void {
    auditService.log({
      eventType,
      actorId: params.userId,
      actorType: params.userType,
      targetId: params.conversationId ?? params.messageId,
      targetType: params.conversationId ? 'conversation' : 'message',
      channel: params.channel,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        tenantId: params.tenantId,
        conversationId: params.conversationId,
        messageId: params.messageId,
        ...params.metadata,
      },
      success: params.success,
      errorMessage: params.errorMessage,
    });
  }
}

export const chatService = new ChatService();
