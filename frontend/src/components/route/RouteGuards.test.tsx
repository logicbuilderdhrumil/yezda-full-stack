import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import {
  PublicRoute,
  ProtectedRoute,
  AuthorityGuard,
  AppRoute,
  AccessDeniedView,
  NotFoundView,
} from './RouteGuards';
import { AuthProvider } from '@/context/AuthContext';
import { useAuthStore } from '@/store/authStore';
import type { AuthSession } from '@/@types/auth';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
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

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock fetch to prevent API calls
vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))));

const mockSession: AuthSession = {
  accessToken: 'access-token-123',
  refreshToken: 'refresh-token-456',
  expiresAt: Date.now() + 3600000,
  user: {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    mfaEnabled: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
};

const mockAdminSession: AuthSession = {
  ...mockSession,
  user: {
    ...mockSession.user,
    role: 'admin',
  },
};

function TestWrapper({
  children,
  initialPath = '/',
}: {
  children: React.ReactNode;
  initialPath?: string;
}) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
}

describe('RouteGuards', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useAuthStore.setState({
      session: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      mfaPending: false,
      mfaToken: null,
    });
  });

  describe('AccessDeniedView', () => {
    it('renders access denied message', () => {
      render(
        <TestWrapper>
          <AccessDeniedView />
        </TestWrapper>
      );

      expect(screen.getByText('403')).toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('NotFoundView', () => {
    it('renders not found message', () => {
      render(
        <TestWrapper>
          <NotFoundView />
        </TestWrapper>
      );

      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    });
  });

  describe('PublicRoute', () => {
    it('renders children when unauthenticated', () => {
      render(
        <TestWrapper>
          <Routes>
            <Route
              path="/"
              element={
                <PublicRoute>
                  <div>Public Content</div>
                </PublicRoute>
              }
            />
          </Routes>
        </TestWrapper>
      );

      expect(screen.getByText('Public Content')).toBeInTheDocument();
    });

    it('redirects to home when authenticated', () => {
      useAuthStore.setState({
        session: mockSession,
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <Routes>
            <Route
              path="/"
              element={
                <PublicRoute>
                  <div>Public Content</div>
                </PublicRoute>
              }
            />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </TestWrapper>
      );

      // PublicRoute redirects authenticated users
      expect(screen.queryByText('Public Content')).not.toBeInTheDocument();
    });

    it('shows loading spinner while auth is loading', () => {
      useAuthStore.setState({
        isLoading: true,
      });

      render(
        <TestWrapper>
          <Routes>
            <Route
              path="/"
              element={
                <PublicRoute>
                  <div>Public Content</div>
                </PublicRoute>
              }
            />
          </Routes>
        </TestWrapper>
      );

      expect(screen.queryByText('Public Content')).not.toBeInTheDocument();
    });
  });

  describe('ProtectedRoute', () => {
    it('redirects to sign-in when unauthenticated', () => {
      render(
        <TestWrapper>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/sign-in" element={<div>Sign In Page</div>} />
          </Routes>
        </TestWrapper>
      );

      expect(screen.getByText('Sign In Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders children when authenticated', () => {
      useAuthStore.setState({
        session: mockSession,
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </TestWrapper>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('shows loading spinner while auth is loading', () => {
      useAuthStore.setState({
        isLoading: true,
      });

      render(
        <TestWrapper>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </TestWrapper>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('AuthorityGuard', () => {
    it('renders children when no authority required', () => {
      useAuthStore.setState({
        session: mockSession,
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <AuthorityGuard>
            <div>Content</div>
          </AuthorityGuard>
        </TestWrapper>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders children when user has required role', () => {
      useAuthStore.setState({
        session: mockAdminSession,
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <AuthorityGuard authority={['admin']}>
            <div>Admin Content</div>
          </AuthorityGuard>
        </TestWrapper>
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    it('redirects to access denied page when user lacks authority', () => {
      useAuthStore.setState({
        session: mockSession, // role: 'user'
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <Routes>
            <Route
              path="/"
              element={
                <AuthorityGuard authority={['admin']}>
                  <div>Admin Content</div>
                </AuthorityGuard>
              }
            />
            <Route path="/access-denied" element={<div>Access Denied Page</div>} />
          </Routes>
        </TestWrapper>
      );

      expect(screen.getByText('Access Denied Page')).toBeInTheDocument();
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('allows access when user has one of multiple required roles', () => {
      useAuthStore.setState({
        session: mockSession, // role: 'user'
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <AuthorityGuard authority={['admin', 'user']}>
            <div>Multi-role Content</div>
          </AuthorityGuard>
        </TestWrapper>
      );

      expect(screen.getByText('Multi-role Content')).toBeInTheDocument();
    });
  });

  describe('AppRoute', () => {
    it('applies public route behavior when meta.isPublic is true', () => {
      render(
        <TestWrapper>
          <Routes>
            <Route
              path="/"
              element={
                <AppRoute meta={{ isPublic: true }}>
                  <div>Public Page</div>
                </AppRoute>
              }
            />
          </Routes>
        </TestWrapper>
      );

      expect(screen.getByText('Public Page')).toBeInTheDocument();
    });

    it('applies protected route behavior when meta.isPublic is false', () => {
      render(
        <TestWrapper>
          <Routes>
            <Route
              path="/"
              element={
                <AppRoute meta={{ isPublic: false }}>
                  <div>Protected Page</div>
                </AppRoute>
              }
            />
            <Route path="/sign-in" element={<div>Sign In</div>} />
          </Routes>
        </TestWrapper>
      );

      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.queryByText('Protected Page')).not.toBeInTheDocument();
    });

    it('applies authority guard when meta.authority is set', () => {
      useAuthStore.setState({
        session: mockSession, // role: 'user'
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <Routes>
            <Route
              path="/"
              element={
                <AppRoute meta={{ authority: ['admin'] }}>
                  <div>Admin Only</div>
                </AppRoute>
              }
            />
          </Routes>
        </TestWrapper>
      );

      expect(screen.queryByText('Admin Only')).not.toBeInTheDocument();
      expect(screen.getByText('403')).toBeInTheDocument();
    });
  });
});
