/**
 * Auth Module — Composition Root
 *
 * Wires all auth module dependencies using manual constructor injection.
 * Imports existing services that haven't been migrated yet from the legacy
 * flat structure. These will be replaced with module-internal implementations
 * in future phases.
 */
import { PostgresUserRepository } from './infrastructure/repositories/PostgresUserRepository.js';
import { PostgresSessionRepository } from './infrastructure/repositories/PostgresSessionRepository.js';
import { PostgresPasswordResetRepository } from './infrastructure/repositories/PostgresPasswordResetRepository.js';
import { PostgresMfaEnrollmentRepository } from './infrastructure/repositories/PostgresMfaEnrollmentRepository.js';
import { RedisMfaSessionAdapter } from './infrastructure/adapters/MfaSessionAdapter.js';
import { PostgresTransactionManager } from './infrastructure/adapters/TransactionManager.js';

import { SignUpUseCase } from './application/use-cases/SignUpUseCase.js';
import { SignInUseCase } from './application/use-cases/SignInUseCase.js';
import { CompleteMfaSignInUseCase } from './application/use-cases/CompleteMfaSignInUseCase.js';
import { RefreshTokenUseCase } from './application/use-cases/RefreshTokenUseCase.js';
import { RequestPasswordResetUseCase } from './application/use-cases/RequestPasswordResetUseCase.js';
import { CompletePasswordResetUseCase } from './application/use-cases/CompletePasswordResetUseCase.js';
import { SignOutUseCase } from './application/use-cases/SignOutUseCase.js';
import { EnableMfaUseCase } from './application/use-cases/EnableMfaUseCase.js';
import { DisableMfaUseCase } from './application/use-cases/DisableMfaUseCase.js';
import { GetCurrentUserUseCase } from './application/use-cases/GetCurrentUserUseCase.js';
import { StartMfaEnrollmentUseCase } from './application/use-cases/StartMfaEnrollmentUseCase.js';
import { CompleteMfaEnrollmentUseCase } from './application/use-cases/CompleteMfaEnrollmentUseCase.js';

import { AuthController } from './interface/controllers/auth.controller.js';
import { createAuthRoutes } from './interface/routes/auth.routes.js';

// Legacy service singletons (not yet migrated into this module)
import { tokenService } from '../../services/token.service.js';
import { passwordService } from '../../services/password.service.js';
import { mfaService } from '../../services/mfa.service.js';
import { auditService } from '../../services/audit.service.js';
import { userManagementRepository } from '../../repositories/user-management.repository.js';
import { config } from '../../config/index.js';

export function createAuthModule() {
  // ── Infrastructure ──────────────────────────────────────────────────────
  const userRepo = new PostgresUserRepository();
  const sessionRepo = new PostgresSessionRepository();
  const passwordResetRepo = new PostgresPasswordResetRepository();
  const mfaEnrollmentRepo = new PostgresMfaEnrollmentRepository();
  const mfaSessionStore = new RedisMfaSessionAdapter();
  const transactionManager = new PostgresTransactionManager();

  // ── Use Cases ───────────────────────────────────────────────────────────
  const signUpUseCase = new SignUpUseCase(userRepo, passwordService, auditService);

  const signInUseCase = new SignInUseCase(
    userRepo,
    passwordService,
    mfaService,
    tokenService,
    auditService,
    mfaSessionStore,
    userManagementRepository,
    config.security.maxFailedAttempts,
    config.security.lockoutDurationMinutes,
  );

  const completeMfaSignInUseCase = new CompleteMfaSignInUseCase(
    userRepo,
    mfaService,
    tokenService,
    auditService,
    mfaSessionStore,
    userManagementRepository,
  );

  const refreshTokenUseCase = new RefreshTokenUseCase(tokenService, auditService);

  const requestPasswordResetUseCase = new RequestPasswordResetUseCase(
    userRepo,
    passwordResetRepo,
    auditService,
    config.security.passwordResetTtlMinutes,
  );

  const completePasswordResetUseCase = new CompletePasswordResetUseCase(
    userRepo,
    passwordResetRepo,
    passwordService,
    tokenService,
    auditService,
    transactionManager,
  );

  const signOutUseCase = new SignOutUseCase(tokenService, auditService);

  const enableMfaUseCase = new EnableMfaUseCase(userRepo, auditService);

  const disableMfaUseCase = new DisableMfaUseCase(userRepo, auditService);

  const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepo);

  const startMfaEnrollmentUseCase = new StartMfaEnrollmentUseCase(mfaService);

  const completeMfaEnrollmentUseCase = new CompleteMfaEnrollmentUseCase(
    mfaService,
    enableMfaUseCase,
  );

  // ── Interface ───────────────────────────────────────────────────────────
  const controller = new AuthController(
    signUpUseCase,
    signInUseCase,
    completeMfaSignInUseCase,
    refreshTokenUseCase,
    signOutUseCase,
    requestPasswordResetUseCase,
    completePasswordResetUseCase,
    startMfaEnrollmentUseCase,
    completeMfaEnrollmentUseCase,
    disableMfaUseCase,
    getCurrentUserUseCase,
    userManagementRepository,
  );

  const routes = createAuthRoutes(controller);

  return {
    routes,
    controller,
    // Expose repos for inter-module use if needed
    repositories: {
      user: userRepo,
      session: sessionRepo,
      passwordReset: passwordResetRepo,
      mfaEnrollment: mfaEnrollmentRepo,
    },
  };
}
