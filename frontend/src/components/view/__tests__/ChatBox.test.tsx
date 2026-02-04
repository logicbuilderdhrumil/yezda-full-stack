import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  ChatBox,
  ChatHeader,
  MessageList,
  MessageItem,
  ChatComposer,
  groupMessagesBySender,
  type ChatMessage,
} from '../ChatBox';

// Mock messages for testing
const mockMessages: ChatMessage[] = [
  {
    id: '1',
    content: 'Hello there!',
    senderId: 'user1',
    senderName: 'Alice',
    timestamp: new Date('2026-02-04T10:00:00'),
    isOwn: false,
  },
  {
    id: '2',
    content: 'Hi Alice!',
    senderId: 'user2',
    senderName: 'Bob',
    timestamp: new Date('2026-02-04T10:01:00'),
    isOwn: true,
  },
  {
    id: '3',
    content: 'How are you?',
    senderId: 'user1',
    senderName: 'Alice',
    timestamp: new Date('2026-02-04T10:02:00'),
    isOwn: false,
  },
];

describe('ChatBox', () => {
  it('renders children', () => {
    render(
      <ChatBox>
        <div data-testid="child">Content</div>
      </ChatBox>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ChatBox className="custom-class">Content</ChatBox>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('ChatHeader', () => {
  it('renders title', () => {
    render(<ChatHeader title="Test Chat" />);
    expect(screen.getByText('Test Chat')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<ChatHeader title="Test Chat" subtitle="Online" />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders avatar image', () => {
    render(<ChatHeader title="Test Chat" avatar="https://example.com/avatar.jpg" />);
    expect(screen.getByAltText('Test Chat')).toBeInTheDocument();
  });

  it('renders custom avatar element', () => {
    render(
      <ChatHeader
        title="Test Chat"
        avatar={<div data-testid="custom-avatar">A</div>}
      />
    );
    expect(screen.getByTestId('custom-avatar')).toBeInTheDocument();
  });

  it('renders actions menu', () => {
    const handleAction = vi.fn();
    render(
      <ChatHeader
        title="Test Chat"
        actions={[{ label: 'Delete', onClick: handleAction }]}
      />
    );
    expect(screen.getByRole('button', { name: 'Chat options' })).toBeInTheDocument();
  });
});

describe('MessageList', () => {
  it('renders messages', () => {
    render(<MessageList messages={mockMessages} />);
    expect(screen.getByText('Hello there!')).toBeInTheDocument();
    expect(screen.getByText('Hi Alice!')).toBeInTheDocument();
  });

  it('shows empty state when no messages', () => {
    render(<MessageList messages={[]} />);
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });

  it('shows custom empty content', () => {
    render(
      <MessageList
        messages={[]}
        emptyContent={<div>Start chatting!</div>}
      />
    );
    expect(screen.getByText('Start chatting!')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { container } = render(<MessageList messages={[]} isLoading />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('uses custom render function', () => {
    render(
      <MessageList
        messages={mockMessages}
        groupMessages={false}
        renderMessage={(msg) => (
          <div key={msg.id} data-testid="custom-message">
            {msg.content}
          </div>
        )}
      />
    );
    expect(screen.getAllByTestId('custom-message')).toHaveLength(3);
  });
});

describe('MessageItem', () => {
  const message: ChatMessage = {
    id: '1',
    content: 'Test message',
    senderId: 'user1',
    senderName: 'Alice',
    timestamp: new Date('2026-02-04T10:00:00'),
    isOwn: false,
    status: 'sent',
  };

  it('renders message content', () => {
    render(<MessageItem message={message} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('applies correct styles for own messages', () => {
    render(<MessageItem message={{ ...message, isOwn: true }} />);
    const item = screen.getByTestId('message-item');
    expect(item).toHaveClass('bg-primary');
  });

  it('applies correct styles for other messages', () => {
    render(<MessageItem message={message} />);
    const item = screen.getByTestId('message-item');
    expect(item).toHaveClass('bg-gray-100');
  });

  it('shows message status for own messages', () => {
    render(<MessageItem message={{ ...message, isOwn: true, status: 'sent' }} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });
});

describe('ChatComposer', () => {
  it('renders input and send button', () => {
    render(<ChatComposer onSendMessage={() => {}} />);
    expect(screen.getByRole('textbox', { name: 'Message input' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument();
  });

  it('calls onSendMessage when form is submitted', () => {
    const handleSend = vi.fn();
    render(<ChatComposer onSendMessage={handleSend} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello!' } });
    fireEvent.submit(input.closest('form')!);

    expect(handleSend).toHaveBeenCalledWith('Hello!');
  });

  it('sends message on Enter key', () => {
    const handleSend = vi.fn();
    render(<ChatComposer onSendMessage={handleSend} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello!' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleSend).toHaveBeenCalledWith('Hello!');
  });

  it('does not send on Shift+Enter', () => {
    const handleSend = vi.fn();
    render(<ChatComposer onSendMessage={handleSend} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello!' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(handleSend).not.toHaveBeenCalled();
  });

  it('clears input after sending', () => {
    render(<ChatComposer onSendMessage={() => {}} />);

    const input = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'Hello!' } });
    fireEvent.submit(input.closest('form')!);

    expect(input.value).toBe('');
  });

  it('disables send button when input is empty', () => {
    render(<ChatComposer onSendMessage={() => {}} />);
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
  });

  it('disables all inputs when disabled prop is true', () => {
    render(<ChatComposer onSendMessage={() => {}} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('shows attachment button by default', () => {
    render(<ChatComposer onSendMessage={() => {}} />);
    expect(screen.getByRole('button', { name: 'Attach file' })).toBeInTheDocument();
  });

  it('hides attachment button when showAttachmentButton is false', () => {
    render(<ChatComposer onSendMessage={() => {}} showAttachmentButton={false} />);
    expect(screen.queryByRole('button', { name: 'Attach file' })).not.toBeInTheDocument();
  });

  it('shows emoji button by default', () => {
    render(<ChatComposer onSendMessage={() => {}} />);
    expect(screen.getByRole('button', { name: 'Add emoji' })).toBeInTheDocument();
  });

  it('respects maxLength', () => {
    render(<ChatComposer onSendMessage={() => {}} maxLength={10} />);

    const input = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: '12345678901234567890' } });

    // Should not exceed max length
    expect(input.value.length).toBeLessThanOrEqual(10);
  });

  it('shows character count when maxLength is set', () => {
    render(<ChatComposer onSendMessage={() => {}} maxLength={100} />);
    expect(screen.getByText('0/100')).toBeInTheDocument();
  });
});

describe('groupMessagesBySender', () => {
  it('groups consecutive messages from same sender', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        content: 'Hi',
        senderId: 'user1',
        senderName: 'Alice',
        timestamp: new Date('2026-02-04T10:00:00'),
      },
      {
        id: '2',
        content: 'How are you?',
        senderId: 'user1',
        senderName: 'Alice',
        timestamp: new Date('2026-02-04T10:01:00'),
      },
    ];

    const groups = groupMessagesBySender(messages);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.messages).toHaveLength(2);
  });

  it('creates separate groups for different senders', () => {
    const groups = groupMessagesBySender(mockMessages);
    expect(groups.length).toBeGreaterThan(1);
  });

  it('starts new group after threshold', () => {
    const messages: ChatMessage[] = [
      {
        id: '1',
        content: 'Hi',
        senderId: 'user1',
        senderName: 'Alice',
        timestamp: new Date('2026-02-04T10:00:00'),
      },
      {
        id: '2',
        content: 'Hello again',
        senderId: 'user1',
        senderName: 'Alice',
        timestamp: new Date('2026-02-04T10:10:00'), // 10 minutes later
      },
    ];

    const groups = groupMessagesBySender(messages, 5);
    expect(groups).toHaveLength(2);
  });

  it('returns empty array for empty messages', () => {
    const groups = groupMessagesBySender([]);
    expect(groups).toHaveLength(0);
  });
});
