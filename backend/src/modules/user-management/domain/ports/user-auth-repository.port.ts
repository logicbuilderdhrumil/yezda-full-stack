/**
 * User Auth Repository Port (User Management)
 *
 * Used for creating auth records when a new managed user is created.
 */
export interface IUserAuthRepository {
  emailExistsForUser(email: string): Promise<boolean>;
  createUser(user: {
    id: string;
    email: string;
    passwordHash: string;
    mfaEnabled: boolean;
    failedAttempts: number;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<void>;
}
