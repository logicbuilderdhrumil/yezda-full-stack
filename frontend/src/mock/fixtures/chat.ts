/**
 * Chat module mock fixtures.
 * Provides fake data for chat conversation and message endpoints.
 */

/** Mock chat message. */
export interface MockMessage {
  id: string;
  content: string;
  sender: { id: string; name: string; avatarUrl?: string };
  createdAt: string;
}

/** Mock chat conversation. */
export interface MockConversation {
  id: string;
  title: string;
  lastMessage: string;
  participants: { id: string; name: string }[];
  unreadCount: number;
  updatedAt: string;
  messages?: MockMessage[];
}

/** Predefined mock conversations. */
export const mockConversations: MockConversation[] = [
  {
    id: 'conv-001',
    title: 'Acme Corp Screening Update',
    lastMessage: 'The background check for John Doe is ready for final review.',
    participants: [
      { id: '001', name: 'Admin User' },
      { id: '003', name: 'Alice Agent' },
    ],
    unreadCount: 2,
    updatedAt: '2026-02-08T09:45:00.000Z',
    messages: [
      {
        id: 'msg-001',
        content: 'Hi Alice, can you provide an update on the Acme Corp batch?',
        sender: { id: '001', name: 'Admin User' },
        createdAt: '2026-02-08T09:00:00.000Z',
      },
      {
        id: 'msg-002',
        content: 'Sure! 3 out of 5 candidates are cleared. John Doe is pending final review.',
        sender: { id: '003', name: 'Alice Agent' },
        createdAt: '2026-02-08T09:20:00.000Z',
      },
      {
        id: 'msg-003',
        content: 'The background check for John Doe is ready for final review.',
        sender: { id: '003', name: 'Alice Agent' },
        createdAt: '2026-02-08T09:45:00.000Z',
      },
    ],
  },
  {
    id: 'conv-002',
    title: 'Pipeline Configuration Discussion',
    lastMessage: "I'll update the executive pipeline stages by EOD.",
    participants: [
      { id: '001', name: 'Admin User' },
      { id: '002', name: 'Manager User' },
    ],
    unreadCount: 0,
    updatedAt: '2026-02-07T16:30:00.000Z',
    messages: [
      {
        id: 'msg-004',
        content: 'We need to add a financial background stage to the executive pipeline.',
        sender: { id: '002', name: 'Manager User' },
        createdAt: '2026-02-07T15:00:00.000Z',
      },
      {
        id: 'msg-005',
        content: "I'll update the executive pipeline stages by EOD.",
        sender: { id: '001', name: 'Admin User' },
        createdAt: '2026-02-07T16:30:00.000Z',
      },
    ],
  },
  {
    id: 'conv-003',
    title: 'Urgent: Emily Brown ID Mismatch',
    lastMessage: 'Escalated to compliance team. Awaiting response.',
    participants: [
      { id: '003', name: 'Alice Agent' },
      { id: '004', name: 'Bob Agent' },
      { id: '002', name: 'Manager User' },
    ],
    unreadCount: 1,
    updatedAt: '2026-02-08T08:10:00.000Z',
    messages: [
      {
        id: 'msg-006',
        content: "Emily Brown's ID verification failed \u2014 the document names don't match.",
        sender: { id: '003', name: 'Alice Agent' },
        createdAt: '2026-02-08T07:30:00.000Z',
      },
      {
        id: 'msg-007',
        content: "I've seen this before. Could be a maiden name issue. Let me check.",
        sender: { id: '004', name: 'Bob Agent' },
        createdAt: '2026-02-08T07:50:00.000Z',
      },
      {
        id: 'msg-008',
        content: 'Escalated to compliance team. Awaiting response.',
        sender: { id: '002', name: 'Manager User' },
        createdAt: '2026-02-08T08:10:00.000Z',
      },
    ],
  },
];

/** Conversations list response (without messages). */
export const conversationsListResponse = {
  conversations: mockConversations.map(({ messages: _messages, ...rest }) => rest),
  meta: {
    page: 1,
    limit: 10,
    total: mockConversations.length,
    totalPages: 1,
  },
};

/** Get a single conversation by ID (with messages). */
export function getConversationById(id: string): MockConversation | undefined {
  return mockConversations.find((c) => c.id === id);
}

/** Get messages for a conversation. */
export function getConversationMessages(id: string): { messages: MockMessage[]; meta: Record<string, number> } | undefined {
  const conversation = getConversationById(id);
  if (!conversation) return undefined;
  const messages = conversation.messages ?? [];
  return {
    messages,
    meta: {
      page: 1,
      limit: 50,
      total: messages.length,
      totalPages: 1,
    },
  };
}
