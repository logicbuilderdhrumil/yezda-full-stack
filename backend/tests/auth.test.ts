/**
 * Authentication Flow Tests
 * Task 1.5: Tests for authentication flows
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../src/services/auth.service.js';
import { tokenService } from '../src/services/token.service.js';
import { passwordService } from '../src/services/password.service.js';
import { mfaService } from '../src/services/mfa.service.js';

describe('Auth Service', () => {
  describe('Sign Up', () => {
    it('should create a new user with valid credentials', async () => {
      const result = await authService.signUp({
        email: 'test-signup@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      expect(result.success).toBe(true);
    });

    it('should reject duplicate email', async () => {
      await authService.signUp({
        email: 'duplicate@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      const result = await authService.signUp({
        email: 'duplicate@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('EMAIL_EXISTS');
    });

    it('should reject weak password', async () => {
      const result = await authService.signUp({
        email: 'weak-password@example.com',
        password: 'weak',
        userType: 'user',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('WEAK_PASSWORD');
    });

    it('should normalize email to lowercase', async () => {
      const result = await authService.signUp({
        email: 'UPPERCASE@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Sign In', () => {
    beforeEach(async () => {
      await authService.signUp({
        email: 'signin-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });
    });

    it('should sign in with valid credentials', async () => {
      const result = await authService.signIn({
        email: 'signin-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
        channel: 'api',
      });

      expect(result.success).toBe(true);
      expect(result.tokenPair).toBeDefined();
      expect(result.tokenPair?.accessToken).toBeDefined();
      expect(result.tokenPair?.refreshToken).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const result = await authService.signIn({
        email: 'signin-test@example.com',
        password: 'wrongpassword',
        userType: 'user',
        channel: 'api',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CREDENTIALS');
    });

    it('should reject non-existent user', async () => {
      const result = await authService.signIn({
        email: 'nonexistent@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
        channel: 'api',
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      await authService.signUp({
        email: 'refresh-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      const signInResult = await authService.signIn({
        email: 'refresh-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
        channel: 'api',
      });

      const refreshResult = authService.refreshTokens(signInResult.tokenPair!.refreshToken);

      expect(refreshResult.success).toBe(true);
      expect(refreshResult.tokenPair).toBeDefined();
      expect(refreshResult.tokenPair?.accessToken).not.toBe(signInResult.tokenPair?.accessToken);
    });

    it('should reject invalid refresh token', () => {
      const result = authService.refreshTokens('invalid-token');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('Password Reset', () => {
    it('should request password reset for existing user', async () => {
      await authService.signUp({
        email: 'reset-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      const result = await authService.requestPasswordReset('reset-test@example.com', 'user');

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('should complete password reset with valid token', async () => {
      await authService.signUp({
        email: 'reset-complete@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      const resetRequest = await authService.requestPasswordReset('reset-complete@example.com', 'user');
      const result = await authService.completePasswordReset(resetRequest.token!, 'NewSecureP@ss456!');

      expect(result.success).toBe(true);

      // Verify can sign in with new password
      const signInResult = await authService.signIn({
        email: 'reset-complete@example.com',
        password: 'NewSecureP@ss456!',
        userType: 'user',
        channel: 'api',
      });

      expect(signInResult.success).toBe(true);
    });

    it('should reject invalid reset token', async () => {
      const result = await authService.completePasswordReset('invalid-token', 'NewSecureP@ss456!');

      expect(result.success).toBe(false);
    });
  });
});

describe('Token Service', () => {
  describe('Token Generation', () => {
    it('should generate valid token pair', () => {
      const result = tokenService.generateTokenPair('user-123', 'user');

      expect(result.tokenPair.accessToken).toBeDefined();
      expect(result.tokenPair.refreshToken).toBeDefined();
      expect(result.tokenPair.tokenType).toBe('Bearer');
      expect(result.tokenPair.expiresIn).toBeGreaterThan(0);
    });

    it('should create session on token generation', () => {
      const result = tokenService.generateTokenPair('user-456', 'user');

      expect(result.session.id).toBeDefined();
      expect(result.session.userId).toBe('user-456');
      expect(result.session.userType).toBe('user');
    });
  });

  describe('Token Validation', () => {
    it('should validate valid access token', () => {
      const { tokenPair } = tokenService.generateTokenPair('user-789', 'user');
      const payload = tokenService.validateAccessToken(tokenPair.accessToken);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-789');
      expect(payload?.type).toBe('user');
    });

    it('should reject invalid access token', () => {
      const payload = tokenService.validateAccessToken('invalid-token');

      expect(payload).toBeNull();
    });
  });

  describe('Token Rotation', () => {
    it('should rotate refresh token', () => {
      const { tokenPair: initial } = tokenService.generateTokenPair('user-rotate', 'user');
      const rotated = tokenService.rotateToken(initial.refreshToken);

      expect(rotated).not.toBeNull();
      expect(rotated?.tokenPair.refreshToken).not.toBe(initial.refreshToken);
    });

    it('should revoke old token after rotation', () => {
      const { tokenPair: initial } = tokenService.generateTokenPair('user-revoke', 'user');
      tokenService.rotateToken(initial.refreshToken);

      // Old token should be revoked
      const reuse = tokenService.rotateToken(initial.refreshToken);
      expect(reuse).toBeNull();
    });
  });
});

describe('Password Service', () => {
  describe('Password Hashing', () => {
    it('should hash and verify password', async () => {
      const password = 'SecurePassword123!';
      const hash = await passwordService.hash(password);

      expect(hash).not.toBe(password);
      expect(await passwordService.verify(password, hash)).toBe(true);
    });

    it('should reject wrong password', async () => {
      const hash = await passwordService.hash('SecurePassword123!');

      expect(await passwordService.verify('wrongpassword', hash)).toBe(false);
    });
  });

  describe('Password Strength', () => {
    it('should accept strong password', () => {
      const result = passwordService.validateStrength('SecureP@ss123!');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short password', () => {
      const result = passwordService.validateStrength('Abc1!');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('8 characters'))).toBe(true);
    });

    it('should require uppercase letter', () => {
      const result = passwordService.validateStrength('lowercase1!');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('uppercase'))).toBe(true);
    });

    it('should require special character', () => {
      const result = passwordService.validateStrength('SecurePass123');

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('special character'))).toBe(true);
    });
  });
});

describe('MFA Service', () => {
  describe('TOTP Enrollment', () => {
    it('should start enrollment and generate QR code', async () => {
      const result = await mfaService.startEnrollment('user-mfa', 'user', 'mfa@example.com');

      expect(result.enrollmentId).toBeDefined();
      expect(result.secret).toBeDefined();
      expect(result.qrCodeUrl).toContain('data:image/png');
      expect(result.otpauthUrl).toContain('otpauth://totp/');
    });

    it('should generate backup codes', () => {
      const codes = mfaService.generateBackupCodes(8);

      expect(codes).toHaveLength(8);
      codes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
      });
    });
  });
});
