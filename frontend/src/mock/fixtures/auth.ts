/**
 * Auth module mock fixtures.
 * Provides fake data for authentication endpoints.
 */

/** Mock user credential for testing. */
export const mockCredentials = {
  email: 'demo@example.com',
  password: 'Demo123!',
};

/** Mock authenticated user data. */
export const mockUser = {
  id: 'user-001',
  email: 'demo@example.com',
  firstName: 'Demo',
  lastName: 'User',
  role: 'admin',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

/** Mock JWT tokens. */
export const mockTokens = {
  accessToken: 'mock-access-token-xyz',
  refreshToken: 'mock-refresh-token-abc',
  expiresIn: 3600,
};

/** Mock sign-in response. */
export const signInResponse = {
  user: mockUser,
  ...mockTokens,
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

/** Mock current user (me) response. */
export const meResponse = {
  user: mockUser,
};
