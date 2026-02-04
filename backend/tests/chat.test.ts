/**
 * Chat Tests
 * Task 1.4: Tests for message persistence and delivery
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { chatService } from '../src/services/chat.service.js';
import { chatRepository } from '../src/repositories/chat.repository.js';
import { chatMetricsService, CHAT_SLOS } from '../src/services/chat-metrics.service.js';
import {
  calculateMessageExpirationDate,
  getChatRetentionDays,
  CHAT_RETENTION,
  type CreateConversationInput,
  type SendMessageInput,
  type Conversation,
  type Message,
  type Participant,
} from '../src/models/chat.model.js';

// Mock the socket service
vi.mock('../src/services/socket.service.js', () => ({
  socketService: {
    emitToUser: vi.fn(),
  },
}));

// Mock audit service
vi.mock('../src/services/audit.service.js', () => ({
  auditService: {
    log: vi.fn(),
  },
}));

// Mock the chat repository
vi.mock('../src/repositories/chat.repository.js', () => {
  const conversations = new Map<string, Conversation>();
  const messages = new Map<string, Message>();
  let convIdCounter = 0;
  let msgIdCounter = 0;

  return {
    chatRepository: {
      createConversation: vi.fn(async (input: CreateConversationInput) => {
        convIdCounter++;
        const id = `conv-${convIdCounter}`;
        const now = new Date();
        const participants: Participant[] = input.participantIds.map((p) => ({
          userId: p.userId,
          userType: p.userType,
          role: p.role ?? 'member',
          joinedAt: now,
        }));

        const conversation: Conversation = {
          id,
          tenantId: input.tenantId,
          title: input.title,
          status: 'active',
          participants,
          createdAt: now,
          updatedAt: now,
          metadata: input.metadata,
        };
        conversations.set(id, conversation);
        return conversation;
      }),

      findConversationById: vi.fn(async (id: string) => {
        return conversations.get(id);
      }),

      findConversationByIdForTenant: vi.fn(async (id: string, tenantId: string) => {
        const conv = conversations.get(id);
        return conv && conv.tenantId === tenantId ? conv : undefined;
      }),

      isParticipant: vi.fn(async (
        conversationId: string,
        userId: string,
        userType: 'user' | 'candidate'
      ) => {
        const conv = conversations.get(conversationId);
        if (!conv) return false;
        return conv.participants.some(
          (p) => p.userId === userId && p.userType === userType && !p.leftAt
        );
      }),

      listConversationsForUser: vi.fn(async (
        tenantId: string,
        userId: string,
        userType: 'user' | 'candidate',
        _filters = {},
        pagination: { limit?: number } = {}
      ) => {
        const matchingConversations: Conversation[] = [];
        for (const conv of conversations.values()) {
          if (
            conv.tenantId === tenantId &&
            conv.participants.some(
              (p) => p.userId === userId && p.userType === userType && !p.leftAt
            )
          ) {
            matchingConversations.push(conv);
          }
        }
        // Sort by updatedAt descending
        matchingConversations.sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
        );

        const limit = pagination.limit ?? 20;
        return {
          conversations: matchingConversations.slice(0, limit),
          total: matchingConversations.length,
        };
      }),

      createMessage: vi.fn(async (input: SendMessageInput, expiresAt?: Date) => {
        msgIdCounter++;
        const id = `msg-${msgIdCounter}`;
        const now = new Date();

        const message: Message = {
          id,
          conversationId: input.conversationId,
          tenantId: input.tenantId,
          senderId: input.senderId,
          senderType: input.senderType,
          content: input.content,
          contentType: input.contentType ?? 'text',
          status: 'sent',
          createdAt: now,
          attachmentId: input.attachmentId,
          metadata: input.metadata,
          expiresAt,
        };
        messages.set(id, message);

        // Update conversation
        const conv = conversations.get(input.conversationId);
        if (conv) {
          conv.updatedAt = now;
          conv.lastMessage = {
            content: input.content,
            senderId: input.senderId,
            sentAt: now,
          };
        }

        return message;
      }),

      findMessageById: vi.fn(async (id: string) => {
        return messages.get(id);
      }),

      listMessagesForConversation: vi.fn(async (
        conversationId: string,
        _tenantId: string,
        _filters = {},
        pagination: { limit?: number } = {}
      ) => {
        const matchingMessages: Message[] = [];
        for (const msg of messages.values()) {
          if (msg.conversationId === conversationId) {
            matchingMessages.push(msg);
          }
        }
        // Sort by createdAt ascending (oldest first)
        matchingMessages.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );

        const limit = pagination.limit ?? 50;
        return {
          messages: matchingMessages.slice(0, limit),
          total: matchingMessages.length,
        };
      }),

      updateMessageStatus: vi.fn(async (
        id: string,
        status: string,
        deliveredAt?: Date
      ) => {
        const message = messages.get(id);
        if (message) {
          message.status = status as Message['status'];
          if (deliveredAt) {
            message.deliveredAt = deliveredAt;
          }
          return message;
        }
        return undefined;
      }),

      markMessageAsRead: vi.fn(async (id: string, userId: string) => {
        const message = messages.get(id);
        if (message) {
          message.readBy = {
            ...message.readBy,
            [userId]: new Date(),
          };
          if (message.status === 'delivered') {
            message.status = 'read';
          }
          return message;
        }
        return undefined;
      }),

      updateConversationStatus: vi.fn(async (
        id: string,
        status: 'active' | 'archived' | 'closed'
      ) => {
        const conv = conversations.get(id);
        if (conv) {
          conv.status = status;
          conv.updatedAt = new Date();
          return conv;
        }
        return undefined;
      }),

      getParticipantRole: vi.fn(async (
        conversationId: string,
        userId: string,
        userType: 'user' | 'candidate'
      ) => {
        const conv = conversations.get(conversationId);
        if (!conv) return undefined;
        const participant = conv.participants.find(
          (p) => p.userId === userId && p.userType === userType && !p.leftAt
        );
        return participant?.role;
      }),

      cleanupExpiredMessages: vi.fn(async () => {
        let count = 0;
        const now = new Date();
        for (const [id, msg] of messages.entries()) {
          if (msg.expiresAt && msg.expiresAt < now) {
            messages.delete(id);
            count++;
          }
        }
        return count;
      }),

      // Test helper to clear data
      _clear: () => {
        conversations.clear();
        messages.clear();
        convIdCounter = 0;
        msgIdCounter = 0;
      },
    },
    ChatRepository: vi.fn(),
  };
});

const requestContext = {
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
  channel: 'api' as const,
};

describe('Chat Model', () => {
  describe('Retention Rules', () => {
    it('should return default retention days for active conversations', () => {
      expect(getChatRetentionDays('active')).toBe(
        CHAT_RETENTION.DEFAULT_RETENTION_DAYS
      );
    });

    it('should return longer retention for archived conversations', () => {
      expect(getChatRetentionDays('archived')).toBe(
        CHAT_RETENTION.ARCHIVED_RETENTION_DAYS
      );
    });

    it('should calculate expiration date based on status', () => {
      const now = Date.now();
      const archivedExpiration = calculateMessageExpirationDate('archived');
      const activeExpiration = calculateMessageExpirationDate('active');

      // Archived should expire later
      expect(archivedExpiration.getTime()).toBeGreaterThan(
        activeExpiration.getTime()
      );
    });

    it('should clamp TTL to min and max boundaries', () => {
      const now = Date.now();

      // Too short - should clamp to min
      const tooShort = calculateMessageExpirationDate('active', 1);
      const minDays = CHAT_RETENTION.MIN_RETENTION_DAYS;
      expect(tooShort.getTime()).toBeGreaterThanOrEqual(
        now + minDays * 24 * 60 * 60 * 1000 - 1000
      );

      // Too long - should clamp to max
      const tooLong = calculateMessageExpirationDate('active', 10000);
      const maxDays = CHAT_RETENTION.MAX_RETENTION_DAYS;
      expect(tooLong.getTime()).toBeLessThanOrEqual(
        now + maxDays * 24 * 60 * 60 * 1000 + 1000
      );
    });
  });
});

describe('Chat Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the mock stores
    (chatRepository as unknown as { _clear: () => void })._clear();
  });

  describe('createConversation', () => {
    it('should create a conversation successfully', async () => {
      const result = await chatService.createConversation(
        {
          tenantId: 'tenant-1',
          title: 'Test Conversation',
          participantIds: [
            { userId: 'user-2', userType: 'user' },
            { userId: 'candidate-1', userType: 'candidate' },
          ],
        },
        'user-1',
        'user',
        requestContext
      );

      expect(result.success).toBe(true);
      const conv = result.data as Conversation;
      expect(conv.title).toBe('Test Conversation');
      expect(conv.status).toBe('active');
      // Creator should be added as owner
      expect(conv.participants).toHaveLength(3);
      expect(
        conv.participants.find((p) => p.userId === 'user-1')?.role
      ).toBe('owner');
    });

    it('should make creator an owner if already in participants', async () => {
      const result = await chatService.createConversation(
        {
          tenantId: 'tenant-1',
          participantIds: [
            { userId: 'user-1', userType: 'user', role: 'member' },
            { userId: 'user-2', userType: 'user' },
          ],
        },
        'user-1',
        'user',
        requestContext
      );

      expect(result.success).toBe(true);
      const conv = result.data as Conversation;
      expect(
        conv.participants.find((p) => p.userId === 'user-1')?.role
      ).toBe('owner');
    });
  });

  describe('listConversations', () => {
    it('should list conversations for a user', async () => {
      // Create conversations
      await chatService.createConversation(
        {
          tenantId: 'tenant-1',
          title: 'Conversation 1',
          participantIds: [{ userId: 'user-2', userType: 'user' }],
        },
        'user-1',
        'user',
        requestContext
      );

      await chatService.createConversation(
        {
          tenantId: 'tenant-1',
          title: 'Conversation 2',
          participantIds: [{ userId: 'user-2', userType: 'user' }],
        },
        'user-1',
        'user',
        requestContext
      );

      const result = await chatService.listConversations(
        'tenant-1',
        'user-1',
        'user',
        {},
        {},
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as { conversations: Conversation[]; total: number };
      expect(data.conversations).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('should not list conversations from other tenants', async () => {
      await chatService.createConversation(
        {
          tenantId: 'tenant-1',
          title: 'Tenant 1 Conversation',
          participantIds: [{ userId: 'user-2', userType: 'user' }],
        },
        'user-1',
        'user',
        requestContext
      );

      const result = await chatService.listConversations(
        'tenant-2', // Different tenant
        'user-1',
        'user',
        {},
        {},
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as { conversations: Conversation[] };
      expect(data.conversations).toHaveLength(0);
    });
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      // Create a conversation first
      const convResult = await chatService.createConversation(
        {
          tenantId: 'tenant-1',
          participantIds: [{ userId: 'user-2', userType: 'user' }],
        },
        'user-1',
        'user',
        requestContext
      );

      const conv = convResult.data as Conversation;

      const result = await chatService.sendMessage(
        {
          conversationId: conv.id,
          tenantId: 'tenant-1',
          senderId: 'user-1',
          senderType: 'user',
          content: 'Hello, world!',
        },
        requestContext
      );

      expect(result.success).toBe(true);
      const msg = result.data as Message;
      expect(msg.content).toBe('Hello, world!');
      expect(msg.senderId).toBe('user-1');
      expect(msg.status).toBe('sent');
    });

    it('should deny message send to non-participants', async () => {
      const convResult = await chatService.createConversation(
        {
          tenantId: 'tenant-1',
          participantIds: [{ userId: 'user-2', userType: 'user' }],
        },
        'user-1',
        'user',
        requestContext
      );

      const conv = convResult.data as Conversation;

      // Try to send as non-participant
      const result = await chatService.sendMessage(
        {
          conversationId: conv.id,
          tenantId: 'tenant-1',
          senderId: 'user-3', // Not a participant
          senderType: 'user',
          content: 'Unauthorized message',
        },
        requestContext
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CONVERSATION_NOT_FOUND');
    });
  });

  describe('getThread', () => {
    it('should retrieve messages in chronological order', async () => {
      // Create conversation and messages
      const convResult = await chatService.createConversation(
        {
          tenantId: 'tenant-1',
          participantIds: [{ userId: 'user-2', userType: 'user' }],
        },
        'user-1',
        'user',
        requestContext
      );

      const conv = convResult.data as Conversation;

      await chatService.sendMessage(
        {
          conversationId: conv.id,
          tenantId: 'tenant-1',
          senderId: 'user-1',
          senderType: 'user',
          content: 'First message',
        },
        requestContext
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      await chatService.sendMessage(
        {
          conversationId: conv.id,
          tenantId: 'tenant-1',
          senderId: 'user-2',
          senderType: 'user',
          content: 'Second message',
        },
        requestContext
      );

      const result = await chatService.getThread(
        conv.id,
        'tenant-1',
        'user-1',
        'user',
        {},
        {},
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as { messages: Message[] };
      expect(data.messages).toHaveLength(2);
      // Should be in chronological order (oldest first)
      expect(data.messages[0].content).toBe('First message');
      expect(data.messages[1].content).toBe('Second message');
    });

    it('should deny thread access to non-participants', async () => {
      const convResult = await chatService.createConversation(
        {
          tenantId: 'tenant-1',
          participantIds: [{ userId: 'user-2', userType: 'user' }],
        },
        'user-1',
        'user',
        requestContext
      );

      const conv = convResult.data as Conversation;

      // Try to access as non-participant
      const result = await chatService.getThread(
        conv.id,
        'tenant-1',
        'user-3', // Not a participant
        'user',
        {},
        {},
        requestContext
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CONVERSATION_NOT_FOUND');
    });
  });

  describe('participant access control', () => {
    it('should allow participants to access conversation', async () => {
      const convResult = await chatService.createConversation(
        {
          tenantId: 'tenant-1',
          participantIds: [{ userId: 'user-2', userType: 'user' }],
        },
        'user-1',
        'user',
        requestContext
      );

      const conv = convResult.data as Conversation;

      // User-2 should be able to access
      const result = await chatService.getThread(
        conv.id,
        'tenant-1',
        'user-2',
        'user',
        {},
        {},
        requestContext
      );

      expect(result.success).toBe(true);
    });

    it('should block non-participant access', async () => {
      const convResult = await chatService.createConversation(
        {
          tenantId: 'tenant-1',
          participantIds: [{ userId: 'user-2', userType: 'user' }],
        },
        'user-1',
        'user',
        requestContext
      );

      const conv = convResult.data as Conversation;

      // User-3 should not be able to access
      const result = await chatService.getThread(
        conv.id,
        'tenant-1',
        'user-3',
        'user',
        {},
        {},
        requestContext
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CONVERSATION_NOT_FOUND');
    });
  });

  describe('archiveConversation', () => {
    it('should allow owner to archive conversation', async () => {
      const convResult = await chatService.createConversation(
        {
          tenantId: 'tenant-1',
          participantIds: [{ userId: 'user-2', userType: 'user' }],
        },
        'user-1',
        'user',
        requestContext
      );

      const conv = convResult.data as Conversation;

      const result = await chatService.archiveConversation(
        conv.id,
        'tenant-1',
        'user-1', // Owner
        'user',
        requestContext
      );

      expect(result.success).toBe(true);
      const archived = result.data as Conversation;
      expect(archived.status).toBe('archived');
    });

    it('should deny non-owner/admin from archiving', async () => {
      const convResult = await chatService.createConversation(
        {
          tenantId: 'tenant-1',
          participantIds: [{ userId: 'user-2', userType: 'user' }],
        },
        'user-1',
        'user',
        requestContext
      );

      const conv = convResult.data as Conversation;

      const result = await chatService.archiveConversation(
        conv.id,
        'tenant-1',
        'user-2', // Not owner
        'user',
        requestContext
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('message status updates', () => {
    it('should mark message as delivered', async () => {
      const convResult = await chatService.createConversation(
        {
          tenantId: 'tenant-1',
          participantIds: [{ userId: 'user-2', userType: 'user' }],
        },
        'user-1',
        'user',
        requestContext
      );

      const conv = convResult.data as Conversation;

      const msgResult = await chatService.sendMessage(
        {
          conversationId: conv.id,
          tenantId: 'tenant-1',
          senderId: 'user-1',
          senderType: 'user',
          content: 'Test message',
        },
        requestContext
      );

      const msg = msgResult.data as Message;

      const result = await chatService.markMessageDelivered(
        msg.id,
        'tenant-1',
        'user-2', // Recipient marks as delivered
        'user',
        requestContext
      );

      expect(result.success).toBe(true);
      const delivered = result.data as Message;
      expect(delivered.status).toBe('delivered');
      expect(delivered.deliveredAt).toBeDefined();
    });

    it('should mark message as read', async () => {
      const convResult = await chatService.createConversation(
        {
          tenantId: 'tenant-1',
          participantIds: [{ userId: 'user-2', userType: 'user' }],
        },
        'user-1',
        'user',
        requestContext
      );

      const conv = convResult.data as Conversation;

      const msgResult = await chatService.sendMessage(
        {
          conversationId: conv.id,
          tenantId: 'tenant-1',
          senderId: 'user-1',
          senderType: 'user',
          content: 'Test message',
        },
        requestContext
      );

      const msg = msgResult.data as Message;

      // First mark as delivered
      await chatService.markMessageDelivered(
        msg.id,
        'tenant-1',
        'user-2',
        'user',
        requestContext
      );

      // Then mark as read
      const result = await chatService.markMessageRead(
        msg.id,
        'tenant-1',
        'user-2',
        'user',
        requestContext
      );

      expect(result.success).toBe(true);
      const read = result.data as Message;
      expect(read.readBy).toBeDefined();
      expect(read.readBy!['user-2']).toBeDefined();
    });
  });
});

describe('Chat Metrics', () => {
  it('should check SLOs correctly', () => {
    const result = chatMetricsService.checkSLOs();

    // With no data, SLOs should be met
    expect(result.met).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should have defined SLO targets', () => {
    expect(CHAT_SLOS.MESSAGE_SEND_LATENCY_P99_MS).toBeDefined();
    expect(CHAT_SLOS.MESSAGE_SEND_LATENCY_P95_MS).toBeDefined();
    expect(CHAT_SLOS.MESSAGE_DELIVERY_LATENCY_P99_MS).toBeDefined();
    expect(CHAT_SLOS.MESSAGE_SEND_SUCCESS_RATE).toBeDefined();
    expect(CHAT_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE).toBeDefined();
  });
});
