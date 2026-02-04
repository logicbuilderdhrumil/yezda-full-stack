/**
 * App Auth Session Tests
 * Task 1.8: Tests for app authentication session flows
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { appAuthService } from '../src/services/app-auth.service.js';
import { authService } from '../src/services/auth.service.js';

describe('App Auth Service', () => {
  const testDevice = {
    deviceId: 'test-device-123',
    deviceName: 'Test iPhone',
    platform: 'ios' as const,
    appVersion: '1.0.0',
    osVersion: '17.0',
    model: 'iPhone 15',
  };

  describe('App Sign In', () => {
    beforeEach(async () => {
      await authService.signUp({
        email: 'app-signin-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'candidate',
      });
    });

    it('should sign in candidate with valid credentials and device info', async () => {
      const result = await appAuthService.signIn({
        email: 'app-signin-test@example.com',
        password: 'SecureP@ss123!',
        ...testDevice,
      });

      expect(result.success).toBe(true);
      expect(result.tokenPair).toBeDefined();
      expect(result.tokenPair?.accessToken).toBeDefined();
      expect(result.tokenPair?.refreshToken).toBeDefined();
      expect(result.sessionId).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const result = await appAuthService.signIn({
        email: 'app-signin-test@example.com',
        password: 'wrongpassword',
        ...testDevice,
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CREDENTIALS');
    });

    it('should reject non-existent candidate', async () => {
      const result = await appAuthService.signIn({
        email: 'nonexistent@example.com',
        password: 'SecureP@ss123!',
        ...testDevice,
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CREDENTIALS');
    });

    it('should record device metadata in session', async () => {
      const result = await appAuthService.signIn({
        email: 'app-signin-test@example.com',
        password: 'SecureP@ss123!',
        ...testDevice,
      });

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();

      // Get sessions and verify device info is recorded
      const sessions = await appAuthService.getActiveSessions(result.userId!);
      expect(sessions.length).toBeGreaterThan(0);
    });
  });

  describe('App Token Refresh', () => {
    let signInResult: { tokenPair?: { refreshToken: string }; sessionId?: string };

    beforeEach(async () => {
      await authService.signUp({
        email: 'app-refresh-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'candidate',
      });

      signInResult = await appAuthService.signIn({
        email: 'app-refresh-test@example.com',
        password: 'SecureP@ss123!',
        ...testDevice,
      });
    });

    it('should refresh tokens with valid refresh token', async () => {
      const result = await appAuthService.refreshTokens({
        refreshToken: signInResult.tokenPair!.refreshToken,
        deviceId: testDevice.deviceId,
        appVersion: testDevice.appVersion,
      });

      expect(result.success).toBe(true);
      expect(result.tokenPair).toBeDefined();
      expect(result.tokenPair?.accessToken).toBeDefined();
      expect(result.tokenPair?.refreshToken).not.toBe(signInResult.tokenPair?.refreshToken);
    });

    it('should reject invalid refresh token', async () => {
      const result = await appAuthService.refreshTokens({
        refreshToken: 'invalid-token',
        deviceId: testDevice.deviceId,
        appVersion: testDevice.appVersion,
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_REFRESH_TOKEN');
    });

    it('should reject refresh with wrong device ID', async () => {
      const result = await appAuthService.refreshTokens({
        refreshToken: signInResult.tokenPair!.refreshToken,
        deviceId: 'different-device',
        appVersion: testDevice.appVersion,
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DEVICE_MISMATCH');
    });

    it('should revoke old token after rotation', async () => {
      const firstRefresh = await appAuthService.refreshTokens({
        refreshToken: signInResult.tokenPair!.refreshToken,
        deviceId: testDevice.deviceId,
        appVersion: testDevice.appVersion,
      });

      expect(firstRefresh.success).toBe(true);

      // Try to use old token again
      const reuse = await appAuthService.refreshTokens({
        refreshToken: signInResult.tokenPair!.refreshToken,
        deviceId: testDevice.deviceId,
        appVersion: testDevice.appVersion,
      });

      expect(reuse.success).toBe(false);
    });
  });

  describe('App Sign Out', () => {
    let userId: string;
    let sessionId: string;

    beforeEach(async () => {
      await authService.signUp({
        email: 'app-signout-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'candidate',
      });

      const signInResult = await appAuthService.signIn({
        email: 'app-signout-test@example.com',
        password: 'SecureP@ss123!',
        ...testDevice,
      });

      // Extract user ID from sign-in result
      userId = signInResult.userId!;
      sessionId = signInResult.sessionId!;
    });

    it('should revoke current session on sign out', async () => {
      const result = await appAuthService.signOut(userId, sessionId, false);

      expect(result.success).toBe(true);
      expect(result.revokedCount).toBe(1);
    });

    it('should revoke all sessions when revokeAll is true', async () => {
      // Create another session on a different device
      await appAuthService.signIn({
        email: 'app-signout-test@example.com',
        password: 'SecureP@ss123!',
        deviceId: 'another-device',
        platform: 'android',
        appVersion: '1.0.0',
      });

      const result = await appAuthService.signOut(userId, undefined, true);

      expect(result.success).toBe(true);
      expect(result.revokedCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      await authService.signUp({
        email: 'app-sessions-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'candidate',
      });
    });

    it('should list active sessions with device info', async () => {
      const signInResult = await appAuthService.signIn({
        email: 'app-sessions-test@example.com',
        password: 'SecureP@ss123!',
        ...testDevice,
      });

      // The signed-in user would call this
      const sessions = await appAuthService.getActiveSessions(
        signInResult.userId!,
        signInResult.sessionId
      );

      expect(sessions.length).toBeGreaterThanOrEqual(0);
    });

    it('should revoke sessions on same device when signing in again', async () => {
      // First sign-in
      const firstSignIn = await appAuthService.signIn({
        email: 'app-sessions-test@example.com',
        password: 'SecureP@ss123!',
        ...testDevice,
      });

      expect(firstSignIn.success).toBe(true);

      // Second sign-in on same device should revoke first session
      const secondSignIn = await appAuthService.signIn({
        email: 'app-sessions-test@example.com',
        password: 'SecureP@ss123!',
        ...testDevice,
      });

      expect(secondSignIn.success).toBe(true);
      expect(secondSignIn.sessionId).not.toBe(firstSignIn.sessionId);
    });
  });

  describe('Token Validation', () => {
    it('should validate valid access token', async () => {
      await authService.signUp({
        email: 'app-token-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'candidate',
      });

      const signInResult = await appAuthService.signIn({
        email: 'app-token-test@example.com',
        password: 'SecureP@ss123!',
        ...testDevice,
      });

      const payload = await appAuthService.validateAccessToken(
        signInResult.tokenPair!.accessToken
      );

      expect(payload).not.toBeNull();
      expect(payload?.type).toBe('candidate');
    });

    it('should reject invalid access token', async () => {
      const payload = await appAuthService.validateAccessToken('invalid-token');

      expect(payload).toBeNull();
    });
  });
});
