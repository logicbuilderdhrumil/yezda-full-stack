/**
 * RefreshToken Use Case
 * Refreshes tokens using refresh token rotation
 */
import type { ITokenService } from '../../domain/ports/ITokenService.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { AuthResult } from '../dtos/AuthDtos.js';

export class RefreshTokenUseCase {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly auditService: IAuditService,
  ) {}

  async execute(
    refreshToken: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<AuthResult> {
    const result = await this.tokenService.rotateToken(refreshToken, deviceInfo, ipAddress);
    if (!result) {
      return { success: false, error: 'Invalid refresh token', errorCode: 'INVALID_REFRESH_TOKEN' };
    }

    this.auditService.log({
      eventType: 'AUTH_TOKEN_REFRESH',
      actorId: result.session.userId,
      actorType: result.session.userType,
      channel: 'api',
      ipAddress,
    });

    return { success: true, tokenPair: result.tokenPair };
  }
}
