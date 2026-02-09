import type { Router } from 'express';
import type { OAuthProvider, OAuthProviderConfig } from './domain/entities/oauth.entity.js';
import { LegacyOAuthRepository } from './infrastructure/repositories/LegacyOAuthRepository.js';
import { StartAuthorizationUseCase } from './application/use-cases/start-authorization.js';
import { HandleCallbackUseCase } from './application/use-cases/handle-callback.js';
import { GetIntegrationStatusUseCase, GetAllIntegrationStatusesUseCase } from './application/use-cases/get-integration-status.js';
import { DisconnectIntegrationUseCase } from './application/use-cases/disconnect-integration.js';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.js';
import { OAuthController } from './interface/controllers/oauth.controller.js';
import { createOAuthRoutes } from './interface/routes/oauth.routes.js';
import { auditService } from '../../services/audit.service.js';
import { metricsService } from '../../services/metrics.service.js';
import { encrypt, decrypt } from '../../services/crypto.service.js';
import { config } from '../../config/index.js';

const PROVIDER_CONFIGS: Record<OAuthProvider, Omit<OAuthProviderConfig, 'clientId' | 'clientSecret' | 'redirectUri'>> = {
  google: { provider: 'google', authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth', tokenUrl: 'https://oauth2.googleapis.com/token', scopes: ['openid', 'email', 'profile'] },
  microsoft: { provider: 'microsoft', authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize', tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token', scopes: ['openid', 'email', 'profile', 'offline_access'] },
  slack: { provider: 'slack', authorizationUrl: 'https://slack.com/oauth/v2/authorize', tokenUrl: 'https://slack.com/api/oauth.v2.access', scopes: ['openid', 'email', 'profile'] },
  github: { provider: 'github', authorizationUrl: 'https://github.com/login/oauth/authorize', tokenUrl: 'https://github.com/login/oauth/access_token', scopes: ['read:user', 'user:email'] },
};

function getProviderConfig(provider: string): OAuthProviderConfig | undefined {
  const base = PROVIDER_CONFIGS[provider as OAuthProvider];
  const creds = config.oauth?.providers?.[provider as OAuthProvider];
  if (!base || !creds) return undefined;
  return { ...base, clientId: creds.clientId, clientSecret: creds.clientSecret, redirectUri: `${config.oauth.baseRedirectUri}/${provider}` };
}

function getConfiguredProviders(): OAuthProvider[] {
  return (Object.keys(config.oauth?.providers ?? {}) as OAuthProvider[]).filter((p) => config.oauth.providers[p] !== undefined);
}

export interface OAuthModule {
  router: Router;
}

export function createOAuthModule(): OAuthModule {
  const repo = new LegacyOAuthRepository();
  const audit = { log: (e: Parameters<typeof auditService.log>[0]) => auditService.log(e) };
  const crypto = { encrypt, decrypt };
  const metrics = { recordOAuthOperation: (op: string, prov: string, success: boolean, dur?: number) => metricsService.recordOAuthOperation(op as 'authorize' | 'callback' | 'refresh' | 'disconnect', prov as OAuthProvider, success, dur) };

  const startAuth = new StartAuthorizationUseCase(repo, audit, metrics, getProviderConfig, config.oauth?.stateExpiryMinutes ?? 10);
  const handleCb = new HandleCallbackUseCase(repo, audit, crypto, metrics, getProviderConfig);
  const getStatus = new GetIntegrationStatusUseCase(repo);
  const getAllStatuses = new GetAllIntegrationStatusesUseCase(repo, getConfiguredProviders);
  const disconnect = new DisconnectIntegrationUseCase(repo, audit, metrics);
  const refreshToken = new RefreshTokenUseCase(repo, audit, crypto, metrics, getProviderConfig);

  const controller = new OAuthController(startAuth, handleCb, getStatus, getAllStatuses, disconnect, refreshToken, getConfiguredProviders);
  const router = createOAuthRoutes(controller);

  return { router };
}
