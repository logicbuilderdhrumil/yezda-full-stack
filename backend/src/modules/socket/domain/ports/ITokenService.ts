/**
 * Token service port — validates access tokens for socket auth
 */
export interface ITokenService {
  validateAccessToken(token: string): Promise<{
    sub: string;
    type: 'user' | 'candidate';
    tenantId?: string;
    roles?: string[];
    [key: string]: unknown;
  } | null>;
}
