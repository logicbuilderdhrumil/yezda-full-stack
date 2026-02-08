/**
 * SignUp Use Case
 * Creates a new user or candidate account
 */
import { v4 as uuidv4 } from 'uuid';
import type { IUserRepository } from '../../domain/ports/IUserRepository.js';
import type { IPasswordService } from '../../domain/ports/IPasswordService.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { SignUpInput, AuthResult } from '../dtos/AuthDtos.js';
import type { User, Candidate } from '../../domain/entities/index.js';

export class SignUpUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: SignUpInput): Promise<AuthResult> {
    const { email, password, userType } = input;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const emailExists = await this.userRepo.emailExists(normalizedEmail, userType);
    if (emailExists) {
      return { success: false, error: 'Email already registered', errorCode: 'EMAIL_EXISTS' };
    }

    // Validate password strength
    const strengthResult = this.passwordService.validateStrength(password);
    if (!strengthResult.valid) {
      return {
        success: false,
        error: strengthResult.errors.join('; '),
        errorCode: 'WEAK_PASSWORD',
      };
    }

    // Hash password and create user
    const passwordHash = await this.passwordService.hash(password);
    const id = uuidv4();
    const now = new Date();

    const entity: User | Candidate = {
      id,
      email: normalizedEmail,
      passwordHash,
      mfaEnabled: false,
      failedAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };

    if (userType === 'user') {
      await this.userRepo.createUser(entity);
    } else {
      await this.userRepo.createCandidate(entity);
    }

    this.auditService.log({
      eventType: 'AUTH_SIGN_UP',
      actorId: id,
      actorType: userType,
      channel: 'api',
    });

    return { success: true };
  }
}
