/**
 * Auth module mock fixtures.
 * Provides fake data for authentication endpoints.
 * Aligned with backend contract.
 */

/** Mock user credential for testing. */
export const mockCredentials = {
  email: 'demo@example.com',
  password: 'Demo123!',
};

/** Mock authenticated user data - aligned with backend. */
export const mockUser = {
  id: 'user-001',
  email: 'demo@example.com',
  displayName: 'Demo User',
  firstName: 'Demo',
  lastName: 'User',
  roles: ['admin'] as const,
  tenantId: 'tenant-001',
  type: 'user' as const,
  mfaEnabled: false,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

/** Mock JWT tokens. */
export const mockTokens = {
  accessToken: 'mock-access-token-xyz',
  refreshToken: 'mock-refresh-token-abc',
  expiresIn: 3600,
};

/** Mock sign-in response (backend format with flat tokens). */
export const signInResponse = {
  accessToken: mockTokens.accessToken,
  refreshToken: mockTokens.refreshToken,
  expiresIn: mockTokens.expiresIn,
  tokenType: 'Bearer' as const,
};

/** Mock sign-up response. */
export const signUpResponse = {
  user: mockUser,
  ...mockTokens,
};

/** Mock forgot password response. */
export const forgotPasswordResponse = {
  message: 'Password reset email sent successfully.',
};

/** Mock reset password response. */
export const resetPasswordResponse = {
  message: 'Password reset successfully.',
};

/** Mock TOTP verification response. */
export const verifyTotpResponse = {
  verified: true,
  ...mockTokens,
};

/** Mock refresh token response. */
export const refreshResponse = {
  ...mockTokens,
};

/** Mock current user (me) response - backend format (flat user object). */
export const meResponse = {
  id: mockUser.id,
  email: mockUser.email,
  firstName: mockUser.firstName,
  lastName: mockUser.lastName,
  role: mockUser.roles[0],
  userType: mockUser.type,
  mfaEnabled: mockUser.mfaEnabled,
  tenantId: mockUser.tenantId,
  createdAt: mockUser.createdAt,
  updatedAt: mockUser.updatedAt,
};
