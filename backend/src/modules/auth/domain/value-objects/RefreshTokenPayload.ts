/**
 * Refresh token JWT claims
 */
export interface RefreshTokenPayload {
  sub: string;
  type: 'user' | 'candidate';
  sessionId: string;
  iat: number;
  exp: number;
  jti: string;
}
