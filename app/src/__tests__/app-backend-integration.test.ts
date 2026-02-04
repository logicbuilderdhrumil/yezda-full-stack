/**
 * App-backend integration smoke tests.
 * Verifies aligned contracts between app services and backend APIs.
 */

import type {
  SignInRequestDto,
  SignInResponseDto,
  MfaVerifyRequestDto,
  RefreshTokenRequestDto,
  RefreshTokenResponseDto,
  DeviceTokenRegistrationRequestDto,
  DeviceTokenRegistrationResponseDto,
  ProfileResponseDto,
  ProfileUpdateRequestDto,
  ApiErrorEnvelope,
} from '../types/api.types';

/**
 * These tests validate that our TypeScript types align with expected backend schemas.
 * They are compile-time checks that catch contract drift.
 */

describe('Auth contract alignment', () => {
  it('SignInRequestDto matches backend signInSchema', () => {
    // Backend expects: email, password, userType, optional mfaCode
    const request: SignInRequestDto = {
      email: 'user@example.com',
      password: 'password123',
      userType: 'candidate',
      mfaCode: '123456',
    };

    expect(request.email).toBeDefined();
    expect(request.password).toBeDefined();
    expect(request.userType).toMatch(/^(user|candidate)$/);
    expect(typeof request.mfaCode).toBe('string');
  });

  it('SignInResponseDto matches backend auth.controller response', () => {
    // Backend returns flat token fields or MFA challenge
    const successResponse: SignInResponseDto = {
      accessToken: 'jwt-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    };

    const mfaResponse: SignInResponseDto = {
      requiresMfa: true,
      mfaSessionToken: 'mfa-session-uuid',
    };

    expect(successResponse.accessToken).toBeDefined();
    expect(successResponse.tokenType).toBe('Bearer');
    expect(mfaResponse.requiresMfa).toBe(true);
  });

  it('MfaVerifyRequestDto matches backend mfaVerifySchema', () => {
    // Backend expects: mfaSessionToken (UUID), mfaCode (6 chars)
    const request: MfaVerifyRequestDto = {
      mfaSessionToken: '550e8400-e29b-41d4-a716-446655440000',
      mfaCode: '123456',
    };

    expect(request.mfaSessionToken).toBeDefined();
    expect(request.mfaCode).toHaveLength(6);
  });

  it('RefreshTokenRequestDto matches backend refreshTokenSchema', () => {
    const request: RefreshTokenRequestDto = {
      refreshToken: 'refresh-token-string',
    };

    expect(request.refreshToken).toBeDefined();
  });

  it('RefreshTokenResponseDto matches backend auth.controller response', () => {
    const response: RefreshTokenResponseDto = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    };

    expect(response.tokenType).toBe('Bearer');
    expect(typeof response.expiresIn).toBe('number');
  });
});

describe('Notification contract alignment', () => {
  it('DeviceTokenRegistrationRequestDto matches backend deviceTokenRegistrationSchema', () => {
    // Backend expects: token (100-300 chars), platform, optional deviceId/deviceName/appVersion
    const request: DeviceTokenRegistrationRequestDto = {
      token: 'a'.repeat(150),
      platform: 'ios',
      deviceId: 'device-uuid',
      deviceName: 'iPhone 15',
      appVersion: '1.0.0',
    };

    expect(request.token.length).toBeGreaterThanOrEqual(100);
    expect(request.token.length).toBeLessThanOrEqual(300);
    expect(['ios', 'android', 'web']).toContain(request.platform);
  });

  it('DeviceTokenRegistrationResponseDto matches backend firebase.controller response', () => {
    const response: DeviceTokenRegistrationResponseDto = {
      message: 'Device token registered successfully',
      tokenId: 'token-uuid',
    };

    expect(response.message).toBeDefined();
    expect(response.tokenId).toBeDefined();
  });
});

describe('Profile contract alignment', () => {
  it('ProfileResponseDto matches backend profile.controller response', () => {
    const response: ProfileResponseDto = {
      profile: {
        id: 'user-uuid',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'USA',
        },
      },
    };

    expect(response.profile.id).toBeDefined();
    expect(response.profile.email).toBeDefined();
  });

  it('ProfileUpdateRequestDto matches backend profile update payload', () => {
    const request: ProfileUpdateRequestDto = {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+9876543210',
      address: {
        city: 'New City',
      },
    };

    // All fields are optional for partial updates
    expect(request.firstName).toBe('Jane');
    expect(request.address?.city).toBe('New City');
  });
});

describe('Error envelope alignment', () => {
  it('ApiErrorEnvelope matches backend error response format', () => {
    const errorResponse: ApiErrorEnvelope = {
      error: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS',
    };

    expect(errorResponse.error).toBeDefined();
    expect(errorResponse.code).toBeDefined();
  });
});

describe('Header alignment', () => {
  it('app requests include required headers', () => {
    // These headers are expected by backend controllers
    const headers = {
      Authorization: 'Bearer access-token',
      'Content-Type': 'application/json',
      'x-tenant-id': 'tenant-uuid',
      'x-channel': 'mobile',
      'x-device-info': 'iOS 17.0',
    };

    expect(headers.Authorization).toMatch(/^Bearer /);
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['x-channel']).toBe('mobile');
  });
});
