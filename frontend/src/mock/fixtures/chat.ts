/**
 * Chat module mock fixtures.
 * Provides fake data for chat conversation and message endpoints.
 * Aligned with ConversationDTO, MessageDTO, and ParticipantDTO in contracts.ts.
 */

import type { MessageDTO, ConversationDTO, ParticipantDTO } from '@/@types/contracts';

/** Mock chat message (MessageDTO shape). */
export type MockMessage = MessageDTO;

/** Mock chat conversation (ConversationDTO shape + embedded messages for retrieval). */
export interface MockConversation extends ConversationDTO {
  messages?: MockMessage[];
}

// ============================================================================
// Time Helpers
// ============================================================================

/** Returns an ISO string for a date `hoursAgo` hours before now. */
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

// ============================================================================
// Participant Helpers
// ============================================================================

const adminUser: ParticipantDTO = { id: '001', name: 'Admin User', type: 'user' };
const davidChen: ParticipantDTO = { id: '002', name: 'David Chen', type: 'user' };
const aliceAgent: ParticipantDTO = { id: '003', name: 'Alice Agent', type: 'user' };
const bobAgent: ParticipantDTO = { id: '004', name: 'Bob Agent', type: 'user' };

// ============================================================================
// Messages
// ============================================================================

const conv001Messages: MockMessage[] = [
  {
    id: 'msg-001',
    conversationId: 'conv-001',
    senderId: '001',
    type: 'text',
    content: 'Hi Alice, can you provide an update on the Acme Corp batch?',
    readBy: ['001', '003'],
    createdAt: hoursAgo(3),
  },
  {
    id: 'msg-002',
    conversationId: 'conv-001',
    senderId: '003',
    type: 'text',
    content: 'Sure! 3 out of 5 candidates are cleared. John Doe is pending final review.',
    readBy: ['001', '003'],
    createdAt: hoursAgo(2.5),
  },
  {
    id: 'msg-003',
    conversationId: 'conv-001',
    senderId: '003',
    type: 'text',
    content: 'The background check for John Doe is ready for final review.',
    readBy: ['003'],
    createdAt: hoursAgo(2),
  },
];

const conv002Messages: MockMessage[] = [
  {
    id: 'msg-004',
    conversationId: 'conv-002',
    senderId: '002',
    type: 'text',
    content: 'We need to add a financial background stage to the executive pipeline.',
    readBy: ['001', '002'],
    createdAt: hoursAgo(18),
  },
  {
    id: 'msg-005',
    conversationId: 'conv-002',
    senderId: '001',
    type: 'text',
    content: "I'll update the executive pipeline stages by EOD.",
    readBy: ['001', '002'],
    createdAt: hoursAgo(16),
  },
];

const conv003Messages: MockMessage[] = [
  {
    id: 'msg-006',
    conversationId: 'conv-003',
    senderId: '003',
    type: 'text',
    content: "Emily Brown's ID verification failed \u2014 the document names don't match.",
    readBy: ['003', '004'],
    createdAt: hoursAgo(5),
  },
  {
    id: 'msg-007',
    conversationId: 'conv-003',
    senderId: '004',
    type: 'text',
    content: "I've seen this before. Could be a maiden name issue. Let me check.",
    readBy: ['003', '004'],
    createdAt: hoursAgo(4.5),
  },
  {
    id: 'msg-008',
    conversationId: 'conv-003',
    senderId: '002',
    type: 'text',
    content: 'Escalated to compliance team. Awaiting response.',
    readBy: ['002'],
    createdAt: hoursAgo(4),
  },
];

// ============================================================================
// Conversations
// ============================================================================

/** Predefined mock conversations (ConversationDTO shape). */
export const mockConversations: MockConversation[] = [
  {
    id: 'conv-001',
    participants: [adminUser, aliceAgent],
    lastMessage: conv001Messages[conv001Messages.length - 1],
    unreadCount: 2,
    createdAt: hoursAgo(24),
    updatedAt: hoursAgo(2),
    messages: conv001Messages,
  },
  {
    id: 'conv-002',
    participants: [adminUser, davidChen],
    lastMessage: conv002Messages[conv002Messages.length - 1],
    unreadCount: 0,
    createdAt: hoursAgo(48),
    updatedAt: hoursAgo(16),
    messages: conv002Messages,
  },
  {
    id: 'conv-003',
    participants: [aliceAgent, bobAgent, davidChen],
    lastMessage: conv003Messages[conv003Messages.length - 1],
    unreadCount: 1,
    createdAt: hoursAgo(6),
    updatedAt: hoursAgo(4),
    messages: conv003Messages,
  },
];

// ============================================================================
// Response Helpers
// ============================================================================

/** Conversations list response (without embedded messages). */
export const conversationsListResponse = {
  conversations: mockConversations.map(
    ({ messages: _messages, ...rest }): ConversationDTO => rest
  ),
  meta: {
    total: mockConversations.length,
    limit: 10,
    offset: 0,
    page: 1,
    pageCount: 1,
  },
};

/** Get a single conversation by ID (with messages). */
export function getConversationById(id: string): MockConversation | undefined {
  return mockConversations.find((c) => c.id === id);
}

/** Get messages for a conversation (MessageDTO shape). */
export function getConversationMessages(
  id: string
): { messages: MockMessage[]; meta: { total: number; limit: number; offset: number; page: number; pageCount: number } } | undefined {
  const conversation = getConversationById(id);
  if (!conversation) return undefined;
  const messages = conversation.messages ?? [];
  return {
    messages,
    meta: {
      total: messages.length,
      limit: 50,
      offset: 0,
      page: 1,
      pageCount: 1,
    },
  };
}
