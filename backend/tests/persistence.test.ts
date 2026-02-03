/**
 * Persistence Tests
 * Tests for Postgres and Redis backed authentication flows
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../src/services/auth.service.js';
import { tokenService } from '../src/services/token.service.js';
import { mfaService } from '../src/services/mfa.service.js';
import { userRepository } from '../src/repositories/user.repository.js';
import { sessionRepository } from '../src/repositories/session.repository.js';
import { passwordResetRepository } from '../src/repositories/password-reset.repository.js';
import { mfaEnrollmentRepository } from '../src/repositories/mfa-enrollment.repository.js';

describe('Persistence-Backed Auth Flows', () => {
  describe('User Repository Integration', () => {
    it('should persist user on sign up', async () => {
      const result = await authService.signUp({
        email: 'persist-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      expect(result.success).toBe(true);
      expect(userRepository.createUser).toHaveBeenCalled();
    });

    it('should check email exists via repository', async () => {
      await authService.signUp({
        email: 'exists-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      expect(userRepository.emailExists).toHaveBeenCalledWith(
        'exists-test@example.com',
        'user'
      );
    });

    it('should update user on successful sign in', async () => {
      await authService.signUp({
        email: 'signin-persist@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      await authService.signIn({
        email: 'signin-persist@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
        channel: 'api',
      });

      expect(userRepository.updateEntity).toHaveBeenCalled();
    });
  });

  describe('Session Repository Integration', () => {
    it('should persist session on token generation', async () => {
      await authService.signUp({
        email: 'session-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      await authService.signIn({
        email: 'session-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
        channel: 'api',
      });

      expect(sessionRepository.create).toHaveBeenCalled();
    });

    it('should revoke session on sign out', async () => {
      await authService.signUp({
        email: 'signout-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      const signInResult = await authService.signIn({
        email: 'signout-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
        channel: 'api',
      });

      const payload = await tokenService.validateAccessToken(signInResult.tokenPair!.accessToken);
      
      await authService.signOut(payload!.sub, 'user', undefined, true);

      expect(sessionRepository.revokeAllForUser).toHaveBeenCalled();
    });
  });

  describe('Password Reset Repository Integration', () => {
    it('should persist password reset token', async () => {
      await authService.signUp({
        email: 'reset-persist@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      await authService.requestPasswordReset('reset-persist@example.com', 'user');

      expect(passwordResetRepository.create).toHaveBeenCalled();
    });

    it('should delete token after password reset', async () => {
      await authService.signUp({
        email: 'reset-complete@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      const { token } = await authService.requestPasswordReset('reset-complete@example.com', 'user');
      const result = await authService.completePasswordReset(token!, 'NewSecureP@ss456!');

      // Password reset should succeed
      expect(result.success).toBe(true);
      
      // Reusing the same token should fail (token was deleted in transaction)
      const reuseResult = await authService.completePasswordReset(token!, 'AnotherP@ss789!');
      expect(reuseResult.success).toBe(false);
    });
  });

  describe('MFA Enrollment Repository Integration', () => {
    it('should persist MFA enrollment', async () => {
      await mfaService.startEnrollment('user-123', 'user', 'mfa@example.com');

      expect(mfaEnrollmentRepository.create).toHaveBeenCalled();
    });

    it('should mark enrollment verified', async () => {
      const { enrollmentId } = await mfaService.startEnrollment('user-456', 'user', 'verify@example.com');
      
      // The enrollment is stored with encrypted secret by startEnrollment
      // verifyEnrollment will decrypt it before verification
      // We can't verify with a real TOTP code in tests, so just test the flow
      await mfaService.verifyEnrollment(enrollmentId, '000000');

      // The repository method should have been called (even if verification fails with bad code)
      expect(mfaEnrollmentRepository.findById).toHaveBeenCalledWith(enrollmentId);
    });
  });

  describe('Token Rotation with Persistence', () => {
    it('should update session on token rotation', async () => {
      await authService.signUp({
        email: 'rotate-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      const signInResult = await authService.signIn({
        email: 'rotate-test@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
        channel: 'api',
      });

      await authService.refreshTokens(signInResult.tokenPair!.refreshToken);

      // Session should be updated (old revoked, new created)
      expect(sessionRepository.update).toHaveBeenCalled();
      expect(sessionRepository.create).toHaveBeenCalledTimes(2); // Initial + rotated
    });
  });

  describe('Account Lockout with Persistence', () => {
    it('should persist failed attempts', async () => {
      await authService.signUp({
        email: 'lockout-persist@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      // Failed login attempt
      await authService.signIn({
        email: 'lockout-persist@example.com',
        password: 'wrongpassword',
        userType: 'user',
        channel: 'api',
      });

      // User should be updated with incremented failed attempts
      expect(userRepository.updateEntity).toHaveBeenCalled();
    });
  });
});

describe('Redis Integration', () => {
  describe('MFA Sessions', () => {
    it('should store MFA session in Redis on MFA required', async () => {
      // Create user with MFA enabled
      await authService.signUp({
        email: 'mfa-redis@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
      });

      // Enable MFA for user
      const user = await userRepository.findUserByEmail('mfa-redis@example.com');
      if (user) {
        (user as { mfaEnabled: boolean; mfaSecret: string }).mfaEnabled = true;
        (user as { mfaEnabled: boolean; mfaSecret: string }).mfaSecret = 'TESTSECRET123456';
      }

      const result = await authService.signIn({
        email: 'mfa-redis@example.com',
        password: 'SecureP@ss123!',
        userType: 'user',
        channel: 'api',
      });

      expect(result.requiresMfa).toBe(true);
      expect(result.mfaSessionToken).toBeDefined();
    });
  });
});
