/**
 * GetCurrentUser Use Case
 * Returns user data without sensitive fields
 */
import type { IUserRepository } from '../../domain/ports/IUserRepository.js';
import type { User, Candidate } from '../../domain/entities/index.js';

export class GetCurrentUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(
    userId: string,
    userType: 'user' | 'candidate',
  ): Promise<Omit<User | Candidate, 'passwordHash' | 'mfaSecret'> | undefined> {
    const entity = await this.userRepo.findEntityById(userId, userType);
    if (!entity) return undefined;

    // Return without sensitive fields
    const { passwordHash, mfaSecret, ...safe } = entity;
    return safe;
  }
}
