/**
 * User Management Module — Composition Root
 *
 * Wires all user management dependencies using manual constructor injection.
 */
import { PostgresUserManagementRepository } from './infrastructure/repositories/PostgresUserManagementRepository.js';

import { ListUsersUseCase } from './application/use-cases/ListUsersUseCase.js';
import { GetUserByIdUseCase } from './application/use-cases/GetUserByIdUseCase.js';
import { CreateUserUseCase } from './application/use-cases/CreateUserUseCase.js';
import { UpdateUserUseCase } from './application/use-cases/UpdateUserUseCase.js';
import { UpdateUserStatusUseCase } from './application/use-cases/UpdateUserStatusUseCase.js';
import { UpdateUserRolesUseCase } from './application/use-cases/UpdateUserRolesUseCase.js';
import { DeleteUserUseCase } from './application/use-cases/DeleteUserUseCase.js';

import { UserManagementController } from './interface/controllers/user-management.controller.js';
import { createUserManagementRoutes } from './interface/routes/user-management.routes.js';

// Legacy service singletons (not yet migrated into this module)
import { auditService } from '../../services/audit.service.js';
import { metricsService } from '../../services/metrics.service.js';
import { passwordService } from '../../services/password.service.js';
import { userRepository } from '../../repositories/user.repository.js';
import type { IAuditService } from './domain/ports/audit-service.port.js';
import type { IPasswordService } from './domain/ports/password-service.port.js';
import type { IUserAuthRepository } from './domain/ports/user-auth-repository.port.js';

export function createUserManagementModule() {
  // ── Infrastructure ──────────────────────────────────────────────────────
  const userRepo = new PostgresUserManagementRepository();

  // Adapt legacy services to the module's port interfaces.
  const audit = auditService as unknown as IAuditService;
  const password = passwordService as unknown as IPasswordService;
  const userAuthRepo = userRepository as unknown as IUserAuthRepository;

  // ── Use Cases ───────────────────────────────────────────────────────────
  const listUsersUC = new ListUsersUseCase(userRepo, audit, metricsService);
  const getUserByIdUC = new GetUserByIdUseCase(userRepo, audit, metricsService);
  const createUserUC = new CreateUserUseCase(userRepo, audit, metricsService, password, userAuthRepo);
  const updateUserUC = new UpdateUserUseCase(userRepo, audit, metricsService);
  const updateUserStatusUC = new UpdateUserStatusUseCase(userRepo, audit, metricsService);
  const updateUserRolesUC = new UpdateUserRolesUseCase(userRepo, audit, metricsService);
  const deleteUserUC = new DeleteUserUseCase(userRepo, audit, metricsService);

  // ── Interface ───────────────────────────────────────────────────────────
  const controller = new UserManagementController(
    listUsersUC,
    getUserByIdUC,
    createUserUC,
    updateUserUC,
    updateUserStatusUC,
    updateUserRolesUC,
    deleteUserUC,
  );

  const routes = createUserManagementRoutes(controller);

  return {
    routes,
    controller,
    repositories: {
      user: userRepo,
    },
  };
}
