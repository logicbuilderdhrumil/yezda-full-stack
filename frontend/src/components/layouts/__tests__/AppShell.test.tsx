/**
 * Tests for AppShell layout components.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { PageContainer } from '@/components/layouts/PageContainer';
import { navConfig, iconMap } from '@/configs/navigation.config';
import type { NavItem, NavSection } from '@/@types/navigation';
import type { UserRole } from '@/@types/auth';

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
  value: vi.fn().mockImplementation((query) => ({
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

describe('PageContainer', () => {
  it('renders children', () => {
    render(<PageContainer>Test content</PageContainer>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders title and description', () => {
    render(
      <PageContainer title="Test Title" description="Test description">
        Content
      </PageContainer>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('applies fullWidth class when specified', () => {
    const { container } = render(
      <PageContainer fullWidth>Content</PageContainer>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).not.toContain('max-w-7xl');
  });
});

describe('Navigation Config', () => {
  it('has sections with items', () => {
    expect(navConfig.sections.length).toBeGreaterThan(0);
    const firstSection = navConfig.sections[0];
    expect(firstSection).toBeDefined();
    expect(firstSection!.items.length).toBeGreaterThan(0);
  });

  it('all icons in config have mappings', () => {
    const getAllIcons = (sections: NavSection[]): string[] => {
      return sections.flatMap((section) =>
        section.items.flatMap((item) => [
          item.icon,
          ...(item.children?.map((c) => c.icon) || []),
        ])
      );
    };

    const icons = getAllIcons(navConfig.sections);
    icons.forEach((icon) => {
      expect(iconMap).toHaveProperty(icon);
    });
  });

  it('items have required properties', () => {
    navConfig.sections.forEach((section) => {
      section.items.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(item.label).toBeDefined();
        expect(item.path).toBeDefined();
        expect(item.icon).toBeDefined();
        expect(Array.isArray(item.authorities)).toBe(true);
      });
    });
  });
});

describe('SidebarContext', () => {
  function TestComponent() {
    const { isCollapsed, isMobileOpen, toggleCollapsed, toggleMobile } =
      useSidebar();
    return (
      <div>
        <span data-testid="collapsed">{String(isCollapsed)}</span>
        <span data-testid="mobile">{String(isMobileOpen)}</span>
        <button onClick={toggleCollapsed}>Toggle Collapsed</button>
        <button onClick={toggleMobile}>Toggle Mobile</button>
      </div>
    );
  }

  beforeEach(() => {
    localStorageMock.clear();
  });

  it('provides default values', () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );
    expect(screen.getByTestId('collapsed').textContent).toBe('false');
    expect(screen.getByTestId('mobile').textContent).toBe('false');
  });

  it('toggles collapsed state', () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );
    fireEvent.click(screen.getByText('Toggle Collapsed'));
    expect(screen.getByTestId('collapsed').textContent).toBe('true');
  });

  it('toggles mobile state', () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );
    fireEvent.click(screen.getByText('Toggle Mobile'));
    expect(screen.getByTestId('mobile').textContent).toBe('true');
  });

  it('throws when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow(
      'useSidebar must be used within a SidebarProvider'
    );
    consoleError.mockRestore();
  });
});

describe('Role-based filtering', () => {
  function filterByAuthority(
    items: NavItem[],
    userRole: UserRole | undefined
  ): NavItem[] {
    return items.filter((item) => {
      if (item.authorities.length === 0) return true;
      return userRole && item.authorities.includes(userRole);
    });
  }

  const testItems: NavItem[] = [
    { id: '1', label: 'Home', path: '/', icon: 'home', authorities: [] },
    {
      id: '2',
      label: 'Admin Only',
      path: '/admin',
      icon: 'shield',
      authorities: ['platform_admin'],
    },
    {
      id: '3',
      label: 'Manager+',
      path: '/manage',
      icon: 'users',
      authorities: ['platform_admin', 'platform_manager'],
    },
  ];

  it('shows all items to admin', () => {
    const filtered = filterByAuthority(testItems, 'platform_admin');
    expect(filtered.length).toBe(3);
  });

  it('filters admin-only items for manager', () => {
    const filtered = filterByAuthority(testItems, 'platform_manager');
    expect(filtered.length).toBe(2);
    expect(filtered.find((i) => i.id === '2')).toBeUndefined();
  });

  it('shows only public items to viewer', () => {
    const filtered = filterByAuthority(testItems, 'platform_viewer');
    expect(filtered.length).toBe(1);
    expect(filtered[0]?.id).toBe('1');
  });

  it('shows only public items when no role', () => {
    const filtered = filterByAuthority(testItems, undefined);
    expect(filtered.length).toBe(1);
  });
});
