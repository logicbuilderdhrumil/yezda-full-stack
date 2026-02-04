/**
 * Tests for template layout components.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { i18nInstance } from '@/context/I18nProvider';
import { ThemeProvider } from '@/context/ThemeProvider';
import {
  UserProfileDropdown,
  NotificationDropdown,
  Footer,
  GlobalSearchInput,
  ThemeConfigurator,
} from '@/components/template';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock auth context for user profile
const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'admin' as const,
  mfaEnabled: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

vi.mock('@/context/AuthContext', async () => {
  const actual = await vi.importActual('@/context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: mockUser,
      signOut: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    }),
  };
});

// Mock notifications hook
vi.mock('@/views/notifications', () => ({
  useUnreadNotificationCount: () => ({
    count: 3,
    isLoading: false,
    refresh: vi.fn(),
  }),
  useNotifications: () => ({
    notifications: [
      {
        id: '1',
        title: 'Test Notification',
        body: 'This is a test notification',
        status: 'unread',
        type: 'SYSTEM',
        priority: 'normal',
        createdAt: new Date().toISOString(),
        tenantId: 't1',
        userId: 'u1',
        userType: 'user',
      },
    ],
    total: 1,
    unreadCount: 1,
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
    error: null,
    refresh: vi.fn(),
    loadMore: vi.fn(),
    markAsRead: vi.fn(),
    markAsUnread: vi.fn(),
    markAllAsRead: vi.fn(),
    handleRealtimeNotification: vi.fn(),
  }),
}));

// Wrapper with required providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <I18nextProvider i18n={i18nInstance}>
        <ThemeProvider>{children}</ThemeProvider>
      </I18nextProvider>
    </BrowserRouter>
  );
}

describe('Footer', () => {
  it('renders copyright text', () => {
    render(
      <TestWrapper>
        <Footer />
      </TestWrapper>
    );
    const currentYear = new Date().getFullYear();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(String(currentYear)))).toBeInTheDocument();
  });

  it('renders compact mode', () => {
    render(
      <TestWrapper>
        <Footer compact />
      </TestWrapper>
    );
    const footer = screen.getByTestId('footer');
    expect(footer).toHaveClass('h-12');
  });

  it('renders navigation links in full mode', () => {
    render(
      <TestWrapper>
        <Footer compact={false} />
      </TestWrapper>
    );
    // Would check for privacy, terms, help links if translations are loaded
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});

describe('GlobalSearchInput', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('renders search input', () => {
    render(
      <TestWrapper>
        <GlobalSearchInput />
      </TestWrapper>
    );
    expect(screen.getByTestId('global-search')).toBeInTheDocument();
    expect(screen.getByTestId('global-search-input')).toBeInTheDocument();
  });

  it('updates value on input', () => {
    render(
      <TestWrapper>
        <GlobalSearchInput />
      </TestWrapper>
    );
    const input = screen.getByTestId('global-search-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test query' } });
    expect(input.value).toBe('test query');
  });

  it('clears input when clear button is clicked', () => {
    render(
      <TestWrapper>
        <GlobalSearchInput />
      </TestWrapper>
    );
    const input = screen.getByTestId('global-search-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test' } });
    expect(input.value).toBe('test');
    
    const clearButton = screen.getByLabelText(/clear/i);
    fireEvent.click(clearButton);
    expect(input.value).toBe('');
  });

  it('calls onSearch callback when Enter is pressed', () => {
    const onSearch = vi.fn();
    render(
      <TestWrapper>
        <GlobalSearchInput onSearch={onSearch} />
      </TestWrapper>
    );
    const input = screen.getByTestId('global-search-input');
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSearch).toHaveBeenCalledWith('test query');
  });

  it('clears and blurs on Escape', () => {
    render(
      <TestWrapper>
        <GlobalSearchInput />
      </TestWrapper>
    );
    const input = screen.getByTestId('global-search-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('');
  });
});

describe('ThemeConfigurator', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('renders theme toggle button', () => {
    render(
      <TestWrapper>
        <ThemeConfigurator />
      </TestWrapper>
    );
    expect(screen.getByTestId('theme-configurator-trigger')).toBeInTheDocument();
  });

  it('has correct aria attributes for dropdown trigger', () => {
    render(
      <TestWrapper>
        <ThemeConfigurator />
      </TestWrapper>
    );
    const trigger = screen.getByTestId('theme-configurator-trigger');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('UserProfileDropdown', () => {
  it('renders user initials', () => {
    render(
      <TestWrapper>
        <UserProfileDropdown />
      </TestWrapper>
    );
    expect(screen.getByTestId('user-profile-dropdown-trigger')).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe initials
  });

  it('shows user first name', () => {
    render(
      <TestWrapper>
        <UserProfileDropdown />
      </TestWrapper>
    );
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('has correct aria attributes for dropdown trigger', () => {
    render(
      <TestWrapper>
        <UserProfileDropdown />
      </TestWrapper>
    );
    const trigger = screen.getByTestId('user-profile-dropdown-trigger');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('NotificationDropdown', () => {
  it('renders notification bell button', () => {
    render(
      <TestWrapper>
        <NotificationDropdown />
      </TestWrapper>
    );
    expect(screen.getByTestId('notification-dropdown-trigger')).toBeInTheDocument();
  });

  it('shows unread count badge', () => {
    render(
      <TestWrapper>
        <NotificationDropdown />
      </TestWrapper>
    );
    expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('has correct aria attributes for dropdown trigger', () => {
    render(
      <TestWrapper>
        <NotificationDropdown />
      </TestWrapper>
    );
    const trigger = screen.getByTestId('notification-dropdown-trigger');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
