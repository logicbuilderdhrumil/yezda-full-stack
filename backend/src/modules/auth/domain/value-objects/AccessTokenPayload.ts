/**
 * Access token JWT claims
 */
export interface AccessTokenPayload {
  sub: string;
  type: 'user' | 'candidate';
  tenantId?: string;
  iat: number;
  exp: number;
  jti: string;
}
