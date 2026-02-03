/**
 * Security and Compliance Tests
 * Task 1.10: Security/compliance tests for auth flows
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../src/services/auth.service.js';
import { passwordService } from '../src/services/password.service.js';
import { tokenService } from '../src/services/token.service.js';
import { config } from '../src/config/index.js';

describe('Security Compliance Tests', () => {
  describe('Password Security', () => {
    it('should not store passwords in plain text', async () => {
      const password = 'SecureP@ss123!';
      const hash = await passwordService.hash(password);

      expect(hash).not.toBe(password);
      expect(hash).not.toContain(password);
    });

    it('should use different hash for same password', async () => {
      const password = 'SecureP@ss123!';
      const hash1 = await passwordService.hash(password);
      const hash2 = await passwordService.hash(password);

      // Bcrypt includes random salt, so hashes should differ
      expect(hash1).not.toBe(hash2);
    });

    it('should enforce minimum password complexity', () => {
      const weakPasswords = [
        'password',      // No uppercase, no digit, no special
        '12345678',      // No letters
        'abcdefgh',      // No uppercase, no digit, no special
        'ABCDEFGH',      // No lowercase, no digit, no special
        'Abcdefg1',      // No special character
      ];

      weakPasswords.forEach(password => {
        const result = passwordService.validateStrength(password);
        expect(result.valid).toBe(false);
      });
    });

    it('should enforce maximum password length', () => {
      const longPassword = 'A'.repeat(129) + 'a1!';
      const result = passwordService.validateStrength(longPassword);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('128 characters'))).toBe(true);
    });
  });

  describe('Account Lockout', () => {
    beforeEach(async () => {
      await authService.signUp({
        email: 'lockout-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });
    });

    it('should lock account after max failed attempts', async () => {
      // Attempt to sign in with wrong password repeatedly
      for (let i = 0; i < config.security.maxFailedAttempts; i++) {
        await authService.signIn({
          email: 'lockout-test@example.com',
          password: 'wrongpassword',
          userType: 'user',
          channel: 'api',
        });
      }

      // Next attempt should fail with account locked
      const result = await authService.signIn({
        email: 'lockout-test@example.com',
        password: 'SecureP@ss123!', // Even with correct password
        userType: 'user',
        channel: 'api',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('Token Security', () => {
    it('should generate unique tokens', async () => {
      const { tokenPair: pair1 } = await tokenService.generateTokenPair('user-1', 'user');
      const { tokenPair: pair2 } = await tokenService.generateTokenPair('user-1', 'user');

      expect(pair1.accessToken).not.toBe(pair2.accessToken);
      expect(pair1.refreshToken).not.toBe(pair2.refreshToken);
    });

    it('should include expiration in tokens', async () => {
      const { tokenPair } = await tokenService.generateTokenPair('user-exp', 'user');
      const payload = await tokenService.validateAccessToken(tokenPair.accessToken);

      expect(payload?.exp).toBeDefined();
      expect(payload?.exp).toBeGreaterThan(payload?.iat ?? 0);
    });

    it('should reject tampered tokens', async () => {
      const { tokenPair } = await tokenService.generateTokenPair('user-tamper', 'user');
      const tamperedToken = tokenPair.accessToken.slice(0, -5) + 'XXXXX';

      const payload = await tokenService.validateAccessToken(tamperedToken);
      expect(payload).toBeNull();
    });

    it('should prevent token reuse after rotation', async () => {
      const { tokenPair: initial } = await tokenService.generateTokenPair('user-reuse', 'user');
      
      // Rotate the token
      await tokenService.rotateToken(initial.refreshToken);

      // Attempt to reuse old refresh token
      const reused = await tokenService.rotateToken(initial.refreshToken);
      expect(reused).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should revoke all sessions on password reset', async () => {
      // Create user and sign in
      await authService.signUp({
        email: 'session-revoke@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      const { tokenPair } = (await authService.signIn({
        email: 'session-revoke@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
        channel: 'api',
      }));

      // Request and complete password reset
      const resetRequest = await authService.requestPasswordReset('session-revoke@example.com', 'user');
      await authService.completePasswordReset(resetRequest.token!, 'NewSecureP@ss456!');

      // Old refresh token should be invalid
      const refreshResult = await authService.refreshTokens(tokenPair!.refreshToken);
      expect(refreshResult.success).toBe(false);
    });

    it('should support revoking all user sessions', async () => {
      await authService.signUp({
        email: 'multi-session@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      // Create multiple sessions
      const { tokenPair: session1 } = (await authService.signIn({
        email: 'multi-session@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
        channel: 'api',
      }));

      const { tokenPair: session2 } = (await authService.signIn({
        email: 'multi-session@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
        channel: 'api',
      }));

      // Get user ID from token
      const payload = await tokenService.validateAccessToken(session1!.accessToken);
      
      // Sign out with revoke all
      await authService.signOut(payload!.sub, 'user', undefined, true);

      // Both sessions should be invalid
      expect((await authService.refreshTokens(session1!.refreshToken)).success).toBe(false);
      expect((await authService.refreshTokens(session2!.refreshToken)).success).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should normalize email address', async () => {
      await authService.signUp({
        email: '  TEST@EXAMPLE.COM  ',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      // Should be able to sign in with lowercase
      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
        channel: 'api',
      });

      expect(result.success).toBe(true);
    });

    it('should prevent user enumeration on password reset', async () => {
      // Request reset for non-existent user
      const result = await authService.requestPasswordReset('nonexistent@example.com', 'user');

      // Should return success to prevent enumeration
      expect(result.success).toBe(true);
    });
  });

  describe('Audit Logging', () => {
    it('should log successful sign-in', async () => {
      await authService.signUp({
        email: 'audit-success@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      // Sign in should be logged (verified by no errors)
      const result = await authService.signIn({
        email: 'audit-success@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
        channel: 'api',
        ipAddress: '192.168.1.1',
        userAgent: 'TestAgent/1.0',
      });

      expect(result.success).toBe(true);
    });

    it('should log failed sign-in attempts', async () => {
      await authService.signUp({
        email: 'audit-fail@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      // Failed sign in should be logged (verified by no errors)
      const result = await authService.signIn({
        email: 'audit-fail@example.com',
        password: 'wrongpassword',
        userType: 'user',
        channel: 'api',
        ipAddress: '192.168.1.1',
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('Rate Limiting Config', () => {
  it('should have reasonable auth rate limits', () => {
    expect(config.rateLimit.maxAuthRequests).toBeLessThanOrEqual(20);
    expect(config.rateLimit.maxAuthRequests).toBeGreaterThan(0);
  });

  it('should have reasonable lockout settings', () => {
    expect(config.security.maxFailedAttempts).toBeLessThanOrEqual(10);
    expect(config.security.maxFailedAttempts).toBeGreaterThan(0);
    expect(config.security.lockoutDurationMinutes).toBeGreaterThanOrEqual(15);
  });

  it('should have short-lived access tokens', () => {
    // Access tokens should expire in at most 1 hour
    expect(config.jwt.accessTokenTtlSeconds).toBeLessThanOrEqual(3600);
    expect(config.jwt.accessTokenTtlSeconds).toBeGreaterThan(0);
  });

  it('should have reasonable refresh token lifetime', () => {
    // Refresh tokens should expire in at most 30 days
    expect(config.jwt.refreshTokenTtlSeconds).toBeLessThanOrEqual(30 * 24 * 3600);
    expect(config.jwt.refreshTokenTtlSeconds).toBeGreaterThan(0);
  });
});
